import 'dart:async';
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:telephony/telephony.dart';

import 'api_client.dart';
import 'settings_store.dart';
import 'sms_parser.dart';
import 'sticky_alerts.dart';

class SmsLogEntry {
  final String id;
  final DateTime at;
  final String raw;
  final String? matchStatus;
  final String? message;
  final bool success;

  SmsLogEntry({
    required this.id,
    required this.at,
    required this.raw,
    this.matchStatus,
    this.message,
    this.success = true,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'at': at.toIso8601String(),
        'raw': raw,
        'match_status': matchStatus,
        'message': message,
        'success': success,
      };

  factory SmsLogEntry.fromJson(Map<String, dynamic> j) => SmsLogEntry(
        id: j['id'] as String,
        at: DateTime.parse(j['at'] as String),
        raw: j['raw'] as String,
        matchStatus: j['match_status'] as String?,
        message: j['message'] as String?,
        success: j['success'] as bool? ?? true,
      );
}

typedef SmsStatusCallback = void Function(String status);

class SmsPipeline {
  SmsPipeline._();
  static final SmsPipeline instance = SmsPipeline._();

  final Telephony telephony = Telephony.instance;
  final List<SmsLogEntry> logs = [];
  final Set<String> _seenTxn = {};
  final List<Map<String, dynamic>> _retryQueue = [];
  SmsStatusCallback? onStatus;
  VoidCallbackRefresh? onLogChanged;

  static const _logKey = 'sms_pipeline_logs';
  static const _queueKey = 'sms_confirm_queue';

  Future<void> init() async {
    await _loadLogs();
    await _loadQueue();
    final configured = await SettingsStore.instance.isConfigured();
    if (!configured) {
      onStatus?.call('Configure API URL + key in Settings');
      return;
    }

    final granted = await telephony.requestPhoneAndSmsPermissions;
    if (granted != true) {
      onStatus?.call('SMS permission denied');
      return;
    }

    telephony.listenIncomingSms(
      onNewMessage: _onIncoming,
      listenInBackground: false,
    );
    onStatus?.call('Listening for MoMo SMS…');
    unawaited(flushQueue());
  }

  Future<void> _onIncoming(SmsMessage message) async {
    final body = message.body ?? '';
    if (!body.toLowerCase().contains('payment received')) {
      return;
    }
    await processRawSms(body, receivedAt: message.date != null
        ? DateTime.fromMillisecondsSinceEpoch(message.date!)
        : DateTime.now());
  }

  Future<Map<String, dynamic>?> processRawSms(
    String body, {
    DateTime? receivedAt,
  }) async {
    final parsed = parseMomoPaymentSms(body);
    if (parsed.transactionId == null || parsed.amount == null) {
      final entry = SmsLogEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        at: DateTime.now(),
        raw: body,
        matchStatus: 'parse_error',
        message: 'Could not parse amount/transaction id',
        success: false,
      );
      await _addLog(entry);
      await StickyAlertService.instance.showSticky(
        id: 'parse_${entry.id}',
        title: 'Unparsed MoMo SMS',
        body: 'Open Ops app — SMS could not be parsed. Manual review.',
      );
      return null;
    }

    if (_seenTxn.contains(parsed.transactionId)) {
      return {'duplicate': true, 'match_status': 'duplicate'};
    }
    _seenTxn.add(parsed.transactionId!);

    try {
      final result = await OpsApiClient.instance.confirmMomo(
        amount: parsed.amount!,
        transactionId: parsed.transactionId!,
        reference: parsed.reference,
        payerName: parsed.payerName,
        rawSms: body,
        receivedAt: receivedAt,
      );

      final status = result['match_status']?.toString() ?? 'unknown';
      final message = result['message']?.toString() ?? '';
      await _addLog(SmsLogEntry(
        id: parsed.transactionId!,
        at: DateTime.now(),
        raw: body,
        matchStatus: status,
        message: message,
        success: result['success'] == true,
      ));

      final stickyStatuses = {
        'wallet_alert',
        'unmatched',
        'ambiguous',
        'registration_matched',
        'matched',
      };
      if (stickyStatuses.contains(status) || result['inbox_id'] != null) {
        final inboxId = result['inbox_id']?.toString() ?? parsed.transactionId!;
        await StickyAlertService.instance.showSticky(
          id: inboxId,
          title: _titleForStatus(status, parsed.amount!),
          body: message.isNotEmpty
              ? message
              : 'Ref ${parsed.reference ?? "?"} · TXN ${parsed.transactionId}',
        );
      }

      onStatus?.call('Last SMS: $status');
      return result;
    } catch (e) {
      _retryQueue.add({
        'amount': parsed.amount,
        'transaction_id': parsed.transactionId,
        'reference': parsed.reference,
        'payer_name': parsed.payerName,
        'raw_sms': body,
        'received_at': (receivedAt ?? DateTime.now()).toUtc().toIso8601String(),
      });
      await _saveQueue();
      await _addLog(SmsLogEntry(
        id: parsed.transactionId!,
        at: DateTime.now(),
        raw: body,
        matchStatus: 'queued',
        message: 'Network error — queued for retry: $e',
        success: false,
      ));
      await StickyAlertService.instance.showSticky(
        id: 'queue_${parsed.transactionId}',
        title: 'MoMo SMS queued (offline)',
        body: 'Will retry confirm. TXN ${parsed.transactionId}',
      );
      onStatus?.call('Queued SMS (offline)');
      return null;
    }
  }

  String _titleForStatus(String status, double amount) {
    switch (status) {
      case 'matched':
        return 'Order → processing GHS ${amount.toStringAsFixed(2)}';
      case 'wallet_alert':
        return 'WALLET TOP-UP — approve on web';
      case 'registration_matched':
        return 'Registration MoMo — approve agent';
      case 'ambiguous':
        return 'Ambiguous MoMo match';
      case 'unmatched':
        return 'Unmatched MoMo payment';
      default:
        return 'MoMo SMS: $status';
    }
  }

  Future<void> flushQueue() async {
    if (_retryQueue.isEmpty) return;
    final remaining = <Map<String, dynamic>>[];
    for (final item in List<Map<String, dynamic>>.from(_retryQueue)) {
      try {
        final result = await OpsApiClient.instance.confirmMomo(
          amount: (item['amount'] as num).toDouble(),
          transactionId: item['transaction_id'] as String,
          reference: item['reference'] as String?,
          payerName: item['payer_name'] as String?,
          rawSms: item['raw_sms'] as String?,
          receivedAt: item['received_at'] != null
              ? DateTime.tryParse(item['received_at'] as String)
              : null,
        );
        await _addLog(SmsLogEntry(
          id: item['transaction_id'] as String,
          at: DateTime.now(),
          raw: item['raw_sms'] as String? ?? '',
          matchStatus: result['match_status']?.toString(),
          message: result['message']?.toString(),
          success: true,
        ));
        await StickyAlertService.instance.clearSticky('queue_${item['transaction_id']}');
      } catch (_) {
        remaining.add(item);
      }
    }
    _retryQueue
      ..clear()
      ..addAll(remaining);
    await _saveQueue();
  }

  Future<void> _addLog(SmsLogEntry entry) async {
    logs.insert(0, entry);
    if (logs.length > 200) logs.removeRange(200, logs.length);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _logKey,
      logs.take(100).map((e) => jsonEncode(e.toJson())).toList(),
    );
    onLogChanged?.call();
  }

  Future<void> _loadLogs() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_logKey) ?? [];
    logs
      ..clear()
      ..addAll(raw.map((s) => SmsLogEntry.fromJson(jsonDecode(s) as Map<String, dynamic>)));
  }

  Future<void> _loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_queueKey) ?? [];
    _retryQueue
      ..clear()
      ..addAll(raw.map((s) => jsonDecode(s) as Map<String, dynamic>));
  }

  Future<void> _saveQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _queueKey,
      _retryQueue.map((e) => jsonEncode(e)).toList(),
    );
  }
}

typedef VoidCallbackRefresh = void Function();

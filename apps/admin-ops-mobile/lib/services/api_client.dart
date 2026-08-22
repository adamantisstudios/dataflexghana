import 'dart:convert';

import 'package:http/http.dart' as http;

import 'settings_store.dart';

class OpsApiClient {
  OpsApiClient._();
  static final OpsApiClient instance = OpsApiClient._();

  Future<Map<String, String>> _headers() async {
    final key = await SettingsStore.instance.getApiKey();
    if (key == null || key.isEmpty) {
      throw StateError('Ops API key not configured');
    }
    return {
      'Authorization': 'Bearer $key',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  Future<Uri> _uri(String path, [Map<String, String>? query]) async {
    final base = await SettingsStore.instance.getBaseUrl();
    return Uri.parse('$base$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> confirmMomo({
    required double amount,
    required String transactionId,
    String? reference,
    String? payerName,
    String? rawSms,
    DateTime? receivedAt,
  }) async {
    final res = await http.post(
      await _uri('/api/ops/momo/confirm'),
      headers: await _headers(),
      body: jsonEncode({
        'amount': amount,
        'transaction_id': transactionId,
        'reference': reference,
        'payer_name': payerName,
        'raw_sms': rawSms,
        'received_at': (receivedAt ?? DateTime.now()).toUtc().toIso8601String(),
      }),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Confirm failed (${res.statusCode})');
    }
    return body;
  }

  Future<List<Map<String, dynamic>>> fetchInbox({
    String? since,
    bool unackedOnly = false,
    int limit = 100,
  }) async {
    final query = <String, String>{
      'limit': '$limit',
      if (since != null) 'since': since,
      if (unackedOnly) 'unacked_only': '1',
    };
    final res = await http.get(await _uri('/api/ops/inbox', query), headers: await _headers());
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Inbox fetch failed');
    }
    final items = body['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  Future<void> ackInbox(String id) async {
    final res = await http.post(
      await _uri('/api/ops/inbox/$id/ack'),
      headers: await _headers(),
      body: '{}',
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw Exception(body['error'] ?? 'Ack failed');
    }
  }
}

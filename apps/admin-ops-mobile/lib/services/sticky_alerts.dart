import 'dart:async';
import 'dart:convert';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vibration/vibration.dart';

/// Sticky / pestering notifications that cannot be cleared until acknowledged.
class StickyAlertService {
  StickyAlertService._();
  static final StickyAlertService instance = StickyAlertService._();

  static const _channelId = 'ops_sticky_critical';
  static const _prefsKey = 'sticky_alert_ids';
  static const _baseNotifId = 9000;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  Timer? _pesterTimer;
  final Set<String> _activeIds = {};

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _plugin.initialize(const InitializationSettings(android: android));

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        'Critical ops alerts',
        description: 'Non-dismissible until you Attend in the app',
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
      ),
    );

    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_prefsKey) ?? [];
    _activeIds.addAll(raw);
    if (_activeIds.isNotEmpty) {
      _startPesterLoop();
      await _refreshOngoing();
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefsKey, _activeIds.toList());
  }

  Future<void> showSticky({
    required String id,
    required String title,
    required String body,
  }) async {
    _activeIds.add(id);
    await _persist();
    await _showOne(id, title, body);
    _startPesterLoop();
  }

  Future<void> clearSticky(String id) async {
    _activeIds.remove(id);
    await _persist();
    await _plugin.cancel(id.hashCode.abs() % 100000 + _baseNotifId);
    if (_activeIds.isEmpty) {
      _pesterTimer?.cancel();
      _pesterTimer = null;
      await _plugin.cancel(_baseNotifId);
    } else {
      await _refreshOngoing();
    }
  }

  Future<void> clearAll() async {
    for (final id in _activeIds.toList()) {
      await clearSticky(id);
    }
  }

  void _startPesterLoop() {
    _pesterTimer?.cancel();
    _pesterTimer = Timer.periodic(const Duration(seconds: 25), (_) async {
      if (_activeIds.isEmpty) return;
      if (await Vibration.hasVibrator() ?? false) {
        await Vibration.vibrate(duration: 800, amplitude: 255);
      }
      await _refreshOngoing();
    });
  }

  Future<void> _refreshOngoing() async {
    if (_activeIds.isEmpty) return;
    final count = _activeIds.length;
    await _plugin.show(
      _baseNotifId,
      count == 1 ? 'Action required' : '$count alerts need attention',
      'Open DataFlex Ops and tap Attend. Alerts will keep reminding you.',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          'Critical ops alerts',
          channelDescription: 'Non-dismissible until you Attend in the app',
          importance: Importance.max,
          priority: Priority.max,
          ongoing: true,
          autoCancel: false,
          category: AndroidNotificationCategory.alarm,
          playSound: true,
          enableVibration: true,
          styleInformation: BigTextStyleInformation(
            'Open DataFlex Ops → Inbox → Attend. '
            'Wallet top-ups must be approved on the Wallets tab (no auto-credit).',
            contentTitle: count == 1 ? 'Action required' : '$count alerts need attention',
          ),
        ),
      ),
      payload: jsonEncode({'sticky_ids': _activeIds.toList()}),
    );
  }

  Future<void> _showOne(String id, String title, String body) async {
    final notifId = id.hashCode.abs() % 100000 + _baseNotifId + 1;
    await _plugin.show(
      notifId,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          'Critical ops alerts',
          channelDescription: 'Non-dismissible until you Attend in the app',
          importance: Importance.max,
          priority: Priority.max,
          ongoing: true,
          autoCancel: false,
          playSound: true,
          enableVibration: true,
          styleInformation: BigTextStyleInformation(body, contentTitle: title),
        ),
      ),
      payload: id,
    );
    if (await Vibration.hasVibrator() ?? false) {
      await Vibration.vibrate(duration: 1200, amplitude: 255);
    }
  }

  Set<String> get activeIds => Set.unmodifiable(_activeIds);
}

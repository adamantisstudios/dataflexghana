import 'dart:async';
import 'dart:convert';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vibration/vibration.dart';

import 'settings_store.dart';

/// Sticky / pestering notifications that cannot be cleared until acknowledged.
class StickyAlertService {
  StickyAlertService._();
  static final StickyAlertService instance = StickyAlertService._();

  // Vibration on Android 8+ is a property of the channel and cannot be changed
  // after the channel is created, so the toggle is implemented as two channels
  // and the show path picks one. Renaming either id would orphan the old
  // channel's user-visible settings, so keep these stable.
  static const _channelId = 'ops_sticky_critical';
  static const _channelIdSilentVib = 'ops_sticky_critical_novib';
  static const _channelName = 'Critical ops alerts';
  static const _channelDesc = 'Non-dismissible until you Attend in the app';

  static const _prefsKey = 'sticky_alert_ids';
  static const _dismissedKey = 'ops_dismissed_alert_ids';
  static const _baseNotifId = 9000;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  Timer? _pesterTimer;
  final Set<String> _activeIds = {};
  final Set<String> _dismissedIds = {};

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _plugin.initialize(const InitializationSettings(android: android));

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDesc,
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
      ),
    );
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelIdSilentVib,
        '$_channelName (no vibration)',
        description: '$_channelDesc — vibration disabled in app settings',
        importance: Importance.max,
        playSound: true,
        enableVibration: false,
      ),
    );

    await SettingsStore.instance.loadVibrationPrefs();

    final prefs = await SharedPreferences.getInstance();
    _activeIds.addAll(prefs.getStringList(_prefsKey) ?? []);
    _dismissedIds.addAll(prefs.getStringList(_dismissedKey) ?? []);
    if (_activeIds.isNotEmpty) {
      _startPesterLoop();
      await _refreshOngoing();
    }
  }

  bool get _vibrate => SettingsStore.instance.vibrationEnabledSync;
  bool get _pesterVibrate => SettingsStore.instance.pesterVibrationEnabledSync;
  String get _activeChannel => _vibrate ? _channelId : _channelIdSilentVib;

  Future<void> _buzz({required int ms}) async {
    if (!_vibrate) return;
    if (await Vibration.hasVibrator()) {
      await Vibration.vibrate(duration: ms, amplitude: 255);
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefsKey, _activeIds.toList());
    await prefs.setStringList(_dismissedKey, _dismissedIds.toList());
  }

  int _notifIdFor(String id) => id.hashCode.abs() % 100000 + _baseNotifId + 1;

  /// Ids the operator has explicitly cleared, so a server row that still says
  /// "unacked" doesn't resurrect the notification on the next poll.
  bool isDismissed(String id) => _dismissedIds.contains(id);

  Future<void> showSticky({
    required String id,
    required String title,
    required String body,
  }) async {
    if (_dismissedIds.contains(id)) return;
    _activeIds.add(id);
    await _persist();
    await _showOne(id, title, body);
    _startPesterLoop();
  }

  Future<void> clearSticky(String id) async {
    _activeIds.remove(id);
    await _persist();
    await _plugin.cancel(_notifIdFor(id));
    if (_activeIds.isEmpty) {
      _pesterTimer?.cancel();
      _pesterTimer = null;
      await _plugin.cancel(_baseNotifId);
    } else {
      await _refreshOngoing();
    }
  }

  /// Wipe every notification this app has posted and stop the pester loop.
  /// Ids are remembered as dismissed so polling does not re-raise them.
  Future<void> clearAll({bool remember = true}) async {
    if (remember) _dismissedIds.addAll(_activeIds);
    _activeIds.clear();
    _pesterTimer?.cancel();
    _pesterTimer = null;
    await _plugin.cancelAll();
    await _persist();
  }

  /// Let previously cleared alerts come back (used by "restore" in settings).
  Future<void> forgetDismissed() async {
    _dismissedIds.clear();
    await _persist();
  }

  int get dismissedCount => _dismissedIds.length;

  void _startPesterLoop() {
    _pesterTimer?.cancel();
    _pesterTimer = Timer.periodic(const Duration(seconds: 25), (_) async {
      if (_activeIds.isEmpty) return;
      if (_pesterVibrate) await _buzz(ms: 800);
      await _refreshOngoing();
    });
  }

  Future<void> _refreshOngoing() async {
    if (_activeIds.isEmpty) return;
    final count = _activeIds.length;
    final title = count == 1 ? 'Action required' : '$count alerts need attention';
    await _plugin.show(
      _baseNotifId,
      title,
      'Open DataFlex Ops and tap Attend. Alerts will keep reminding you.',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _activeChannel,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.max,
          ongoing: true,
          autoCancel: false,
          category: AndroidNotificationCategory.alarm,
          playSound: true,
          enableVibration: _vibrate,
          styleInformation: BigTextStyleInformation(
            'Open DataFlex Ops → Inbox → Attend. '
            'Wallet top-ups must be approved on the Wallets tab (no auto-credit).',
            contentTitle: title,
          ),
        ),
      ),
      payload: jsonEncode({'sticky_ids': _activeIds.toList()}),
    );
  }

  Future<void> _showOne(String id, String title, String body) async {
    await _plugin.show(
      _notifIdFor(id),
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _activeChannel,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.max,
          priority: Priority.max,
          ongoing: true,
          autoCancel: false,
          playSound: true,
          enableVibration: _vibrate,
          styleInformation: BigTextStyleInformation(body, contentTitle: title),
        ),
      ),
      payload: id,
    );
    await _buzz(ms: 1200);
  }

  Set<String> get activeIds => Set.unmodifiable(_activeIds);
}

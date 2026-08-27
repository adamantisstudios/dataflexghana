import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'settings_store.dart';

/// Heads-up / full-screen notification for an incoming agent call.
///
/// Scope note: this makes a ringing call visible when the app is backgrounded
/// but still resident, because [CallService]'s Dart poll timer keeps running.
/// Android will eventually doze or suspend that timer (and always does once the
/// process is killed), so this is *not* true background ringing. Real
/// background ringing needs a push transport — FCM with a high-priority data
/// message — which does not exist anywhere in this repo today.
class CallNotifications {
  CallNotifications._();
  static final CallNotifications instance = CallNotifications._();

  // Dedicated call channels, deliberately separate from StickyAlertService's
  // `ops_sticky_critical*` channels so ops alerts and calls can be silenced
  // independently. Vibration on Android 8+ is a property of the channel and is
  // immutable once created, so the in-app toggle is implemented as two channels
  // and the show path picks one. Keep these ids stable — renaming one orphans
  // the user-visible channel settings behind it.
  static const _channelId = 'ops_incoming_call';
  static const _channelIdNoVib = 'ops_incoming_call_novib';
  static const _channelName = 'Incoming agent calls';
  static const _channelDesc = 'Rings when an agent places a voice call to you';

  /// Outside StickyAlertService's 9000..109000 id range so the two never clash.
  static const _notifId = 8100;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  bool _ready = false;
  bool _cleared = false;
  String? _shownSessionId;

  /// Session currently represented by a posted notification, if any.
  String? get shownSessionId => _shownSessionId;

  /// Safe to call repeatedly and from either service; the plugin itself is a
  /// singleton, so re-initialising is a no-op beyond channel creation. No tap
  /// handler is registered on purpose: tapping simply launches the app, which
  /// is enough because CallsPage reads the same CallService singleton, and it
  /// avoids clobbering any callback StickyAlertService registered.
  Future<void> init() async {
    if (_ready) return;
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
        _channelIdNoVib,
        '$_channelName (no vibration)',
        description: '$_channelDesc — vibration disabled in app settings',
        importance: Importance.max,
        playSound: true,
        enableVibration: false,
      ),
    );
    _ready = true;
  }

  bool get _vibrate => SettingsStore.instance.vibrationEnabledSync;
  String get _activeChannel => _vibrate ? _channelId : _channelIdNoVib;

  /// Posts (or leaves in place) the ringing notification for [sessionId].
  /// Re-showing the same session is a no-op so the heads-up banner does not
  /// re-fire on every poll tick.
  Future<void> showRinging({
    required String sessionId,
    required String callerName,
    String callerPhone = '',
  }) async {
    if (_shownSessionId == sessionId) return;
    await init();

    final body = callerPhone.isEmpty
        ? '$callerName is calling you'
        : '$callerName • $callerPhone';

    try {
      await _plugin.show(
        _notifId,
        'Incoming call',
        body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _activeChannel,
            _channelName,
            channelDescription: _channelDesc,
            importance: Importance.max,
            priority: Priority.max,
            category: AndroidNotificationCategory.call,
            fullScreenIntent: true,
            ongoing: true,
            autoCancel: false,
            onlyAlertOnce: true,
            playSound: true,
            enableVibration: _vibrate,
            styleInformation: BigTextStyleInformation(
              '$body. Open DataFlex Ops to answer or decline.',
              contentTitle: 'Incoming call',
            ),
          ),
        ),
        payload: sessionId,
      );
      _shownSessionId = sessionId;
      _cleared = false;
    } catch (_) {
      // Notification permission refused or the plugin is unavailable — the
      // in-app UI still shows the call, so this is never fatal.
      _shownSessionId = null;
    }
  }

  /// Removes the ringing notification. Safe to call when nothing is posted;
  /// repeated calls short-circuit so the 4s poll does not hit the plugin on
  /// every idle tick.
  Future<void> clear() async {
    if (_shownSessionId == null && _cleared) return;
    _cleared = true;
    _shownSessionId = null;
    try {
      await _plugin.cancel(_notifId);
    } catch (_) {}
  }
}

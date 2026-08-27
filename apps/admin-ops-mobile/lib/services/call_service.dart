import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:vibration/vibration.dart';

import 'admin_api.dart';
import 'admin_session.dart';
import 'call_notifications.dart';
import 'settings_store.dart';

/// One row of `call_sessions` as returned by `/api/calls/incoming`.
class CallSession {
  const CallSession({
    required this.id,
    required this.status,
    required this.roomName,
    required this.callerId,
    required this.callerName,
    required this.callerPhone,
    required this.createdAt,
  });

  final String id;
  final String status;
  final String roomName;
  final String callerId;
  final String callerName;
  final String callerPhone;
  final DateTime? createdAt;

  static CallSession? fromRow(dynamic raw) {
    if (raw is! Map) return null;
    final row = raw.cast<String, dynamic>();
    final id = (row['id'] ?? '').toString();
    if (id.isEmpty) return null;

    final agent = row['agents'];
    String agentField(List<String> keys) {
      if (agent is! Map) return '';
      for (final k in keys) {
        final v = agent[k];
        if (v != null && v.toString().trim().isNotEmpty) return v.toString().trim();
      }
      return '';
    }

    return CallSession(
      id: id,
      status: (row['status'] ?? '').toString(),
      roomName: (row['livekit_room_name'] ?? '').toString(),
      callerId: (row['caller_id'] ?? '').toString(),
      callerName: agentField(['full_name', 'agent_name']),
      callerPhone: agentField(['phone_number']),
      createdAt: DateTime.tryParse((row['created_at'] ?? '').toString()),
    );
  }

  String get displayName => callerName.isNotEmpty ? callerName : 'Agent';
}

/// Everything the call screen needs to join LiveKit after accepting.
class AcceptedCall {
  const AcceptedCall({
    required this.sessionId,
    required this.token,
    required this.serverUrl,
    required this.roomName,
  });

  final String sessionId;
  final String token;
  final String serverUrl;
  final String roomName;
}

/// Raised when a call could no longer be accepted (agent hung up, or another
/// device answered first).
class CallGoneException implements Exception {
  CallGoneException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Polls `/api/calls/incoming` while an admin is signed in and exposes the
/// ringing/active call to the UI. Also owns the ring vibration, which is
/// gated on the user's vibration preference.
class CallService extends ChangeNotifier {
  CallService._();
  static final CallService instance = CallService._();

  static const _pollInterval = Duration(seconds: 4);

  Timer? _poll;
  Timer? _ringBuzz;
  bool _polling = false;
  bool _inFlight = false;
  bool _disposed = false;

  CallSession? _ringing;
  CallSession? _active;
  String? _lastError;
  bool _unauthorized = false;
  bool _loadedOnce = false;

  /// Set by the in-call screen so the ringtone stops and a call the admin is
  /// already on is not re-announced.
  bool _handling = false;

  CallSession? get ringing => _ringing;
  CallSession? get active => _active;
  String? get lastError => _lastError;
  bool get isUnauthorized => _unauthorized;
  bool get isPolling => _polling;
  bool get hasLoaded => _loadedOnce;

  /// Number of currently ringing calls, for a nav badge.
  int get ringingCount => _ringing == null ? 0 : 1;

  /// Begin polling for incoming calls. Safe to call repeatedly.
  void start() {
    if (_disposed || _polling) return;
    _polling = true;
    unawaited(CallNotifications.instance.init());
    _poll?.cancel();
    _poll = Timer.periodic(_pollInterval, (_) => unawaited(refresh()));
    unawaited(refresh());
    _safeNotify();
  }

  void stop() {
    _polling = false;
    _poll?.cancel();
    _poll = null;
    _stopRing();
    _safeNotify();
  }

  /// Marks the ringing call as being handled by the in-call screen, which
  /// silences the ringtone without stopping the poll.
  void setHandling(bool value) {
    if (_handling == value) return;
    _handling = value;
    if (value) _stopRing();
    _safeNotify();
  }

  Future<void> refresh() async {
    if (_disposed || _inFlight) return;
    if (!AdminSession.instance.isSignedIn) {
      // No-op while signed out; clear anything stale, including a notification
      // posted before the admin signed out.
      final hadCall = _ringing != null || _active != null;
      _ringing = null;
      _active = null;
      _stopRing();
      if (hadCall) _safeNotify();
      return;
    }

    _inFlight = true;
    try {
      final res = await AdminApi.instance.getJson('/api/calls/incoming');
      if (_disposed) return;

      _ringing = CallSession.fromRow(res['ringing']);
      _active = CallSession.fromRow(res['active']);
      _lastError = null;
      _unauthorized = false;
      _loadedOnce = true;

      // Every successful poll re-derives the ring state from the server, so a
      // notification can never outlive the ringing row: the moment the agent
      // hangs up, `_ringing` is null here and the notification is cancelled.
      final ringing = _ringing;
      if (ringing != null && !_handling) {
        _startRing(ringing);
      } else {
        _stopRing();
      }
      _safeNotify();
    } on AdminApiException catch (e) {
      if (_disposed) return;
      _lastError = e.message;
      _unauthorized = e.isUnauthorized;
      _loadedOnce = true;
      _stopRing();
      _safeNotify();
    } catch (e) {
      if (_disposed) return;
      _lastError = e.toString();
      _loadedOnce = true;
      _safeNotify();
    } finally {
      _inFlight = false;
    }
  }

  /// Accepts [sessionId] and returns the LiveKit join details.
  /// Throws [CallGoneException] when the call is no longer ringing.
  Future<AcceptedCall> accept(String sessionId) async {
    Map<String, dynamic> res;
    try {
      res = await AdminApi.instance.post(
        '/api/calls/respond',
        body: {'sessionId': sessionId, 'action': 'accept'},
      );
    } on AdminApiException catch (e) {
      if (e.statusCode == 404 || e.statusCode == 409) {
        unawaited(refresh());
        throw CallGoneException(
          e.statusCode == 404
              ? 'That call is no longer available.'
              : 'The agent already hung up.',
        );
      }
      rethrow;
    }

    final token = (res['token'] ?? '').toString();
    final serverUrl = (res['serverUrl'] ?? '').toString();
    final roomName = (res['roomName'] ?? '').toString();
    if (token.isEmpty || serverUrl.isEmpty) {
      throw CallGoneException('The call could not be set up. Please try again.');
    }

    _stopRing();
    unawaited(refresh());
    return AcceptedCall(
      sessionId: sessionId,
      token: token,
      serverUrl: serverUrl,
      roomName: roomName,
    );
  }

  Future<void> decline(String sessionId) async {
    _stopRing();
    try {
      await AdminApi.instance.post(
        '/api/calls/respond',
        body: {'sessionId': sessionId, 'action': 'decline'},
      );
    } on AdminApiException catch (e) {
      // A call the agent already cancelled is fine to treat as declined.
      if (e.statusCode != 404 && e.statusCode != 409) rethrow;
    }
    _ringing = null;
    _safeNotify();
    unawaited(refresh());
  }

  Future<void> endCall(String sessionId) async {
    _stopRing();
    try {
      await AdminApi.instance.post('/api/calls/end', body: {'sessionId': sessionId});
    } on AdminApiException catch (e) {
      if (e.statusCode != 404) rethrow;
    }
    _active = null;
    _safeNotify();
    unawaited(refresh());
  }

  /// True once a poll shows [sessionId] is no longer ringing or active — the
  /// agent hung up on their side.
  bool isSessionGone(String sessionId) {
    if (!_loadedOnce) return false;
    return _ringing?.id != sessionId && _active?.id != sessionId;
  }

  // ── Ring feedback ─────────────────────────────────────────────────────────

  /// Ring feedback is a heads-up/full-screen notification plus an optional
  /// repeating buzz. The notification is what makes a call visible while the
  /// app is backgrounded; see [CallNotifications] for why that is still not
  /// true push-based background ringing.
  void _startRing(CallSession session) {
    unawaited(
      CallNotifications.instance.showRinging(
        sessionId: session.id,
        callerName: session.displayName,
        callerPhone: session.callerPhone,
      ),
    );

    if (_ringBuzz != null) return;
    if (!SettingsStore.instance.vibrationEnabledSync) return;
    _buzz();
    _ringBuzz = Timer.periodic(const Duration(seconds: 3), (_) {
      // Honour the toggle being flipped mid-ring; the notification stays.
      if (!SettingsStore.instance.vibrationEnabledSync) {
        _stopBuzz();
        return;
      }
      _buzz();
    });
  }

  void _buzz() {
    unawaited(() async {
      try {
        if (await Vibration.hasVibrator()) {
          Vibration.vibrate(pattern: const [0, 500, 400, 500]);
        }
      } catch (_) {}
    }());
  }

  /// Clears both halves of the ring feedback. Called from every teardown path
  /// — accept, decline, end, handling, poll showing no ringing call, poll
  /// failure, sign-out, [stop] and [dispose] — so the notification cannot go
  /// stale.
  void _stopRing() {
    _stopBuzz();
    unawaited(CallNotifications.instance.clear());
  }

  void _stopBuzz() {
    _ringBuzz?.cancel();
    _ringBuzz = null;
    try {
      Vibration.cancel();
    } catch (_) {}
  }

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _poll?.cancel();
    _stopRing();
    super.dispose();
  }
}

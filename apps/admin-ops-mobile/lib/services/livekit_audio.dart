import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

/// Outcome of a media permission request.
enum MediaPermissionResult { granted, denied, permanentlyDenied }

/// Audio-only port of the agent app's `LiveKitService`.
///
/// Owns a single [Room] for one 1:1 admin call and mirrors its state into a
/// [ChangeNotifier]. One instance per call; always [dispose] it.
class LiveKitAudio extends ChangeNotifier {
  Room? _room;
  EventsListener<RoomEvent>? _listener;

  bool _disposed = false;
  bool _connecting = false;
  bool _micEnabled = false;
  bool _speakerOn = false;
  String? _error;
  int _reconnectAttempt = 0;

  /// Fires when the last remote participant leaves or the room drops, i.e. the
  /// agent hung up. The call screen listens to exit cleanly.
  final _remoteLeft = StreamController<void>.broadcast();
  Stream<void> get remoteLeft => _remoteLeft.stream;

  Room? get room => _room;

  ConnectionState get connectionState =>
      _room?.connectionState ?? ConnectionState.disconnected;
  bool get isConnected => connectionState == ConnectionState.connected;
  bool get isConnecting => _connecting || connectionState == ConnectionState.connecting;
  bool get isReconnecting => connectionState == ConnectionState.reconnecting;
  int get reconnectAttempt => _reconnectAttempt;

  bool get micEnabled => _micEnabled;
  bool get speakerOn => _speakerOn;
  String? get error => _error;

  int get remoteCount => _room?.remoteParticipants.length ?? 0;

  /// True while any remote participant is talking.
  bool get remoteSpeaking {
    final room = _room;
    if (room == null) return false;
    return room.activeSpeakers.any((p) => p is RemoteParticipant);
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  static Future<MediaPermissionResult> requestMicPermission() async {
    final status = await Permission.microphone.request();
    if (status.isPermanentlyDenied || status.isRestricted) {
      return MediaPermissionResult.permanentlyDenied;
    }
    if (status.isGranted || status.isLimited) return MediaPermissionResult.granted;
    return MediaPermissionResult.denied;
  }

  Future<bool> openPermissionSettings() => openAppSettings();

  // ── Connection lifecycle ──────────────────────────────────────────────────

  Future<void> connect({
    required String serverUrl,
    required String token,
    bool publishAudio = true,
    bool speakerOn = false,
  }) async {
    await _teardownRoom();
    if (_disposed) return;

    _connecting = true;
    _error = null;
    _reconnectAttempt = 0;
    _speakerOn = speakerOn;
    _safeNotify();

    final room = Room(
      roomOptions: const RoomOptions(
        adaptiveStream: true,
        dynacast: true,
        defaultAudioCaptureOptions: AudioCaptureOptions(
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        ),
      ),
    );
    _room = room;
    _attachListeners(room);

    try {
      await room.connect(
        serverUrl,
        token,
        connectOptions: const ConnectOptions(autoSubscribe: true),
      );
      await _applySpeakerRoute(_speakerOn);
      try {
        await WakelockPlus.enable();
      } catch (_) {}

      if (publishAudio) {
        await setMicrophoneEnabled(true);
      }
    } catch (e) {
      _error = _readableError(e);
      await _teardownRoom();
      _connecting = false;
      _safeNotify();
      rethrow;
    }

    _connecting = false;
    _safeNotify();
  }

  Future<void> disconnect() async {
    await _teardownRoom();
    _safeNotify();
  }

  void _attachListeners(Room room) {
    room.addListener(_safeNotify);

    final listener = room.createListener();
    _listener = listener;

    listener
      ..on<RoomDisconnectedEvent>((_) {
        _micEnabled = false;
        _safeNotify();
        _emitRemoteLeft();
      })
      ..on<RoomReconnectingEvent>((_) => _safeNotify())
      ..on<RoomReconnectedEvent>((_) {
        _reconnectAttempt = 0;
        _safeNotify();
      })
      ..on<RoomAttemptReconnectEvent>((event) {
        _reconnectAttempt = event.attempt;
        _safeNotify();
      })
      ..on<ParticipantConnectedEvent>((_) => _safeNotify())
      ..on<ParticipantDisconnectedEvent>((_) {
        _safeNotify();
        if (remoteCount == 0) _emitRemoteLeft();
      })
      ..on<ActiveSpeakersChangedEvent>((_) => _safeNotify())
      ..on<TrackSubscribedEvent>((_) => _safeNotify())
      ..on<TrackUnsubscribedEvent>((_) => _safeNotify())
      ..on<TrackMutedEvent>((_) => _safeNotify())
      ..on<TrackUnmutedEvent>((_) => _safeNotify())
      ..on<LocalTrackPublishedEvent>((_) => _syncLocalTrackState())
      ..on<LocalTrackUnpublishedEvent>((_) => _syncLocalTrackState());
  }

  void _emitRemoteLeft() {
    if (_disposed || _remoteLeft.isClosed) return;
    _remoteLeft.add(null);
  }

  Future<void> _teardownRoom() async {
    final room = _room;
    final listener = _listener;
    _room = null;
    _listener = null;

    if (room != null) {
      room.removeListener(_safeNotify);
      try {
        await listener?.dispose();
      } catch (_) {}
      try {
        await room.disconnect();
      } catch (_) {}
      try {
        await room.dispose();
      } catch (_) {}
    }

    _micEnabled = false;
    try {
      await WakelockPlus.disable();
    } catch (_) {}
  }

  // ── Publishing ────────────────────────────────────────────────────────────

  Future<bool> setMicrophoneEnabled(bool enabled) async {
    final local = _room?.localParticipant;
    if (local == null) return false;

    if (enabled) {
      final permission = await requestMicPermission();
      if (permission != MediaPermissionResult.granted) {
        _error = permission == MediaPermissionResult.permanentlyDenied
            ? 'Microphone access is blocked. Enable it in app settings.'
            : 'Microphone permission is required to speak.';
        _safeNotify();
        return false;
      }
    }

    try {
      await local.setMicrophoneEnabled(enabled);
      _micEnabled = enabled;
      _error = null;
      _safeNotify();
      return true;
    } catch (e) {
      _error = _readableError(e);
      _safeNotify();
      return false;
    }
  }

  Future<bool> toggleMicrophone() => setMicrophoneEnabled(!_micEnabled);

  void _syncLocalTrackState() {
    final local = _room?.localParticipant;
    if (local != null) {
      _micEnabled = local.audioTrackPublications.any((p) => !p.muted);
    }
    _safeNotify();
  }

  // ── Audio routing ─────────────────────────────────────────────────────────

  /// True routes audio to the loudspeaker, false to the earpiece.
  Future<void> setSpeakerOn(bool value) async {
    _speakerOn = value;
    await _applySpeakerRoute(value);
    _safeNotify();
  }

  Future<void> toggleSpeaker() => setSpeakerOn(!_speakerOn);

  Future<void> _applySpeakerRoute(bool value) async {
    try {
      await AudioManager.instance.setSpeakerOutputPreferred(value, force: true);
    } catch (_) {}
  }

  // ── Teardown ──────────────────────────────────────────────────────────────

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  static String _readableError(Object e) {
    final text = e.toString().replaceFirst('Exception: ', '').trim();
    return text.isEmpty ? 'Could not connect the call audio' : text;
  }

  @override
  void dispose() {
    _disposed = true;
    unawaited(_remoteLeft.close());
    unawaited(_teardownRoom());
    super.dispose();
  }
}

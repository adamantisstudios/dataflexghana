import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

/// Data-channel topics shared with the web client (`lib/voice-room-topics.ts`).
class VoiceTopics {
  static const handRaise = 'hand-raise';
  static const adminShare = 'admin-share';
  static const grantSpeak = 'grant-speak';

  /// Server → agent: refetch a publish token and reconnect with the mic on.
  static const unmuteCommand = 'unmute-command';

  /// Host → agent: allow or revoke camera publishing.
  static const videoPermission = 'video-permission';
  static const reaction = 'reaction';
  static const chat = 'chat';
  static const poll = 'poll';
  static const demote = 'demote';
  static const spotlight = 'spotlight';

  static const reactionEmojis = ['👏', '🔥', '💡', '❤️'];

  /// Topics delivered over data streams (`sendText`) rather than raw packets.
  static const textStreamTopics = [
    handRaise,
    grantSpeak,
    reaction,
    chat,
    poll,
    spotlight,
    videoPermission,
    demote,
  ];
}

/// A message received on a LiveKit data channel or text stream.
class LiveKitDataMessage {
  LiveKitDataMessage({
    required this.topic,
    required this.text,
    this.senderIdentity,
  });

  final String topic;
  final String text;
  final String? senderIdentity;

  /// Decoded JSON payload, or null when the body is a bare string.
  Map<String, dynamic>? get json {
    try {
      final decoded = jsonDecode(text);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return null;
  }
}

/// Outcome of a media permission request.
enum MediaPermissionResult { granted, denied, permanentlyDenied }

/// Owns a single [Room] and mirrors its state into a [ChangeNotifier] the UI
/// can rebuild from. One instance per live screen; always [dispose] it.
class LiveKitService extends ChangeNotifier {
  Room? _room;
  EventsListener<RoomEvent>? _listener;
  final _dataMessages = StreamController<LiveKitDataMessage>.broadcast();
  final _registeredTextTopics = <String>[];

  bool _disposed = false;
  bool _connecting = false;
  bool _micEnabled = false;
  bool _cameraEnabled = false;
  bool _speakerOn = true;
  String? _error;
  int _reconnectAttempt = 0;

  Room? get room => _room;
  Stream<LiveKitDataMessage> get dataMessages => _dataMessages.stream;

  ConnectionState get connectionState => _room?.connectionState ?? ConnectionState.disconnected;
  bool get isConnected => connectionState == ConnectionState.connected;
  bool get isConnecting => _connecting || connectionState == ConnectionState.connecting;
  bool get isReconnecting => connectionState == ConnectionState.reconnecting;
  int get reconnectAttempt => _reconnectAttempt;

  bool get micEnabled => _micEnabled;
  bool get cameraEnabled => _cameraEnabled;
  bool get speakerOn => _speakerOn;
  String? get error => _error;

  LocalParticipant? get localParticipant => _room?.localParticipant;
  String? get localIdentity => _room?.localParticipant?.identity;

  /// Local participant first, then remotes ordered by name.
  List<Participant> get participants {
    final room = _room;
    if (room == null) return const [];
    final remotes = room.remoteParticipants.values.toList()
      ..sort((a, b) => _displayName(a).toLowerCase().compareTo(_displayName(b).toLowerCase()));
    final local = room.localParticipant;
    return [?local, ...remotes];
  }

  Set<String> get speakingIdentities =>
      (_room?.activeSpeakers ?? const <Participant>[]).map((p) => p.identity).toSet();

  /// Camera tracks currently available for rendering, local track included.
  List<VideoTrack> get videoTracks {
    final tracks = <VideoTrack>[];
    for (final participant in participants) {
      final track = videoTrackFor(participant);
      if (track != null) tracks.add(track);
    }
    return tracks;
  }

  VideoTrack? videoTrackFor(Participant participant) {
    for (final pub in participant.videoTrackPublications) {
      if (pub.muted) continue;
      final track = pub.track;
      if (track is VideoTrack) return track;
    }
    return null;
  }

  bool isSpeaking(Participant participant) => participant.isSpeaking;

  /// Role carried by the token — `listener`, `speaker`, `moderator`,
  /// `co-host` or `admin`. Read from participant attributes, falling back to
  /// the JSON metadata blob the server also sets.
  String roleOf(Participant participant) {
    final attr = participant.attributes['role'];
    if (attr != null && attr.isNotEmpty) return attr;
    final metadata = participant.metadata;
    if (metadata != null && metadata.isNotEmpty) {
      try {
        final decoded = jsonDecode(metadata);
        if (decoded is Map && decoded['role'] != null) return decoded['role'].toString();
      } catch (_) {}
    }
    return 'listener';
  }

  String get localRole {
    final local = _room?.localParticipant;
    return local == null ? 'listener' : roleOf(local);
  }

  bool get canModerate => const ['co-host', 'moderator', 'admin'].contains(localRole);

  static String _displayName(Participant participant) =>
      participant.name.isNotEmpty ? participant.name : participant.identity;

  String displayNameOf(Participant participant) => _displayName(participant);

  // ── Permissions ───────────────────────────────────────────────────────────

  /// Requests microphone (and optionally camera) access.
  Future<MediaPermissionResult> requestMediaPermissions({bool video = false}) =>
      requestPermissions(video: video);

  /// Same as [requestMediaPermissions] but callable without a live room, so a
  /// screen can prompt before it decides to connect.
  static Future<MediaPermissionResult> requestPermissions({bool video = false}) async {
    final wanted = <Permission>[Permission.microphone, if (video) Permission.camera];
    final statuses = await wanted.request();

    var result = MediaPermissionResult.granted;
    for (final status in statuses.values) {
      if (status.isPermanentlyDenied || status.isRestricted) {
        return MediaPermissionResult.permanentlyDenied;
      }
      if (!status.isGranted && !status.isLimited) {
        result = MediaPermissionResult.denied;
      }
    }
    return result;
  }

  /// Opens the OS app-settings page so a permanently denied permission can be
  /// re-granted.
  Future<bool> openPermissionSettings() => openAppSettings();

  // ── Connection lifecycle ──────────────────────────────────────────────────

  /// Connects to [serverUrl] with [token]. Any previous room is torn down
  /// first, which is what makes the token-upgrade reconnect cycle work.
  Future<void> connect({
    required String serverUrl,
    required String token,
    bool publishAudio = false,
    bool publishVideo = false,
    bool speakerOn = true,
  }) async {
    await _teardownRoom();
    if (_disposed) return;

    _connecting = true;
    _error = null;
    _reconnectAttempt = 0;
    _speakerOn = speakerOn;
    _safeNotify();

    final room = Room(
      roomOptions: RoomOptions(
        adaptiveStream: true,
        dynacast: true,
        defaultAudioCaptureOptions: const AudioCaptureOptions(
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        ),
        // Square capture keeps mobile tiles consistent with the web stage.
        defaultCameraCaptureOptions: const CameraCaptureOptions(
          cameraPosition: CameraPosition.front,
          params: VideoParameters(
            dimensions: VideoDimensions(720, 720),
            encoding: VideoEncoding(maxBitrate: 1200 * 1000, maxFramerate: 24),
          ),
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
      await WakelockPlus.enable();

      if (publishAudio) {
        await setMicrophoneEnabled(true);
      }
      if (publishVideo) {
        await setCameraEnabled(true);
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
      ..on<RoomDisconnectedEvent>((event) {
        _micEnabled = false;
        _cameraEnabled = false;
        _safeNotify();
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
      ..on<ParticipantDisconnectedEvent>((_) => _safeNotify())
      ..on<ActiveSpeakersChangedEvent>((_) => _safeNotify())
      ..on<TrackSubscribedEvent>((_) => _safeNotify())
      ..on<TrackUnsubscribedEvent>((_) => _safeNotify())
      ..on<TrackMutedEvent>((_) => _safeNotify())
      ..on<TrackUnmutedEvent>((_) => _safeNotify())
      ..on<LocalTrackPublishedEvent>((_) => _syncLocalTrackState())
      ..on<LocalTrackUnpublishedEvent>((_) => _syncLocalTrackState())
      ..on<ParticipantMetadataUpdatedEvent>((_) => _safeNotify())
      ..on<ParticipantPermissionsUpdatedEvent>((_) => _safeNotify())
      ..on<DataReceivedEvent>((event) {
        final topic = event.topic;
        if (topic == null || topic.isEmpty) return;
        _emitData(
          LiveKitDataMessage(
            topic: topic,
            text: _decodeUtf8(event.data),
            senderIdentity: event.participant?.identity,
          ),
        );
      });

    // The web client sends hand-raises, reactions, chat and permission changes
    // over data streams, so those topics need stream handlers too.
    for (final topic in VoiceTopics.textStreamTopics) {
      try {
        room.registerTextStreamHandler(topic, (reader, participantIdentity) async {
          try {
            final text = await reader.readAll();
            _emitData(
              LiveKitDataMessage(topic: topic, text: text, senderIdentity: participantIdentity),
            );
          } catch (_) {}
        });
        _registeredTextTopics.add(topic);
      } catch (_) {
        // A topic reserved by the SDK — ignore and keep the rest.
      }
    }
  }

  void _emitData(LiveKitDataMessage message) {
    if (_dataMessages.isClosed) return;
    _dataMessages.add(message);
  }

  static String _decodeUtf8(List<int> bytes) {
    try {
      return utf8.decode(bytes);
    } catch (_) {
      return String.fromCharCodes(bytes);
    }
  }

  Future<void> _teardownRoom() async {
    final room = _room;
    final listener = _listener;
    _room = null;
    _listener = null;

    if (room != null) {
      room.removeListener(_safeNotify);
      for (final topic in _registeredTextTopics) {
        try {
          room.unregisterTextStreamHandler(topic);
        } catch (_) {}
      }
      _registeredTextTopics.clear();
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
    _cameraEnabled = false;
    try {
      await WakelockPlus.disable();
    } catch (_) {}
  }

  // ── Publishing ────────────────────────────────────────────────────────────

  /// Enables or disables the microphone. Returns false when the permission was
  /// refused or the token does not allow publishing.
  Future<bool> setMicrophoneEnabled(bool enabled) async {
    final local = _room?.localParticipant;
    if (local == null) return false;

    if (enabled) {
      final permission = await requestMediaPermissions();
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

  Future<bool> setCameraEnabled(bool enabled) async {
    final local = _room?.localParticipant;
    if (local == null) return false;

    if (enabled) {
      final permission = await requestMediaPermissions(video: true);
      if (permission != MediaPermissionResult.granted) {
        _error = permission == MediaPermissionResult.permanentlyDenied
            ? 'Camera access is blocked. Enable it in app settings.'
            : 'Camera permission is required to go on video.';
        _safeNotify();
        return false;
      }
    }

    try {
      await local.setCameraEnabled(enabled);
      _cameraEnabled = enabled;
      _error = null;
      _safeNotify();
      return true;
    } catch (e) {
      _error = _readableError(e);
      _safeNotify();
      return false;
    }
  }

  Future<bool> toggleCamera() => setCameraEnabled(!_cameraEnabled);

  Future<void> switchCamera() async {
    final local = _room?.localParticipant;
    if (local == null) return;
    for (final pub in local.videoTrackPublications) {
      final track = pub.track;
      if (track is LocalVideoTrack) {
        try {
          await track.setCameraPosition(
            track.currentOptions is CameraCaptureOptions &&
                    (track.currentOptions as CameraCaptureOptions).cameraPosition ==
                        CameraPosition.front
                ? CameraPosition.back
                : CameraPosition.front,
          );
        } catch (e) {
          _error = _readableError(e);
        }
        _safeNotify();
        return;
      }
    }
  }

  void _syncLocalTrackState() {
    final local = _room?.localParticipant;
    if (local != null) {
      _micEnabled = local.audioTrackPublications.any((p) => !p.muted);
      _cameraEnabled = local.videoTrackPublications.any((p) => !p.muted);
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

  // ── Data channel ──────────────────────────────────────────────────────────

  /// Publishes [payload] on [topic] using a data stream, matching how the web
  /// client sends hand-raises and reactions. Falls back to a raw data packet.
  Future<void> sendTopicMessage(String topic, String payload) async {
    final local = _room?.localParticipant;
    if (local == null) return;
    try {
      await local.sendText(payload, options: SendTextOptions(topic: topic));
    } catch (_) {
      await local.publishData(utf8.encode(payload), reliable: true, topic: topic);
    }
  }

  Future<void> raiseHand() {
    final local = _room?.localParticipant;
    if (local == null) return Future.value();
    return sendTopicMessage(
      VoiceTopics.handRaise,
      jsonEncode({
        'type': VoiceTopics.handRaise,
        'identity': local.identity,
        'name': local.name,
      }),
    );
  }

  Future<void> sendReaction(String emoji) =>
      sendTopicMessage(VoiceTopics.reaction, jsonEncode({'emoji': emoji}));

  // ── Teardown ──────────────────────────────────────────────────────────────

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }

  static String _readableError(Object e) {
    final text = e.toString().replaceFirst('Exception: ', '').trim();
    return text.isEmpty ? 'Something went wrong with the live connection' : text;
  }

  @override
  void dispose() {
    _disposed = true;
    unawaited(_dataMessages.close());
    unawaited(_teardownRoom());
    super.dispose();
  }
}

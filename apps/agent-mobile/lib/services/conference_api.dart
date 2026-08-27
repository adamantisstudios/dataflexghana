import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'session_store.dart';

/// HTTP surface for LiveKit-backed features: regional voice conferences,
/// channel live sessions and 1:1 support calls with the admin.
///
/// Every endpoint here is authenticated with `authenticateAgent` on the server,
/// which reads the Bearer token + `x-agent-id` pair produced by
/// [SessionStore.authHeaders].
class ConferenceApi {
  ConferenceApi._();
  static final instance = ConferenceApi._();

  Future<Uri> _uri(String path, [Map<String, String>? query]) async {
    final base = await SessionStore.instance.getBaseUrl();
    return Uri.parse('$base$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _decode(http.Response res) async {
    Map<String, dynamic> body = {};
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final err = body['error']?.toString() ?? 'Request failed (${res.statusCode})';
    throw ApiException(
      err,
      statusCode: res.statusCode,
      code: body['code']?.toString(),
      banned: body['banned'] == true,
    );
  }

  // ── Regional voice conferences ────────────────────────────────────────────

  Future<Map<String, dynamic>> voiceRooms() async {
    final res = await http.get(
      await _uri('/api/agent/voice-rooms'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  /// `canPublishVideo` is only granted when [video] **and** [speak] are set —
  /// the server ands the two flags together.
  Future<Map<String, dynamic>> voiceRoomToken({
    required String roomName,
    bool speak = false,
    bool video = false,
  }) async {
    final res = await http.get(
      await _uri('/api/agent/voice-rooms/token', {
        'roomName': roomName,
        if (speak) 'speak': '1',
        if (video) 'video': '1',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<List<Map<String, dynamic>>> voiceRoomChats(String roomName) async {
    final res = await http.get(
      await _uri('/api/agent/voice-rooms/${Uri.encodeComponent(roomName)}/chats'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    final chats = data['chats'];
    if (chats is List) {
      return chats.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return const [];
  }

  Future<Map<String, dynamic>> sendVoiceRoomChat({
    required String roomName,
    required String message,
    String? senderName,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/voice-rooms/${Uri.encodeComponent(roomName)}/chats'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'message': message,
        if (senderName != null && senderName.trim().isNotEmpty) 'senderName': senderName.trim(),
      }),
    );
    return _decode(res);
  }

  /// [action] is one of `mute`, `unmute`, `invite`, `kick`, `demote`.
  /// Requires the caller to hold the co-host or moderator role in the room.
  Future<Map<String, dynamic>> moderateVoiceRoom({
    required String roomName,
    required String action,
    required String identity,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/voice-rooms/${Uri.encodeComponent(roomName)}/moderate'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'action': action, 'identity': identity}),
    );
    return _decode(res);
  }

  // ── Channel live sessions ─────────────────────────────────────────────────

  Future<Map<String, dynamic>> channelLiveStatus(String channelId) async {
    final res = await http.get(
      await _uri('/api/agent/channels/$channelId/live'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  /// Host-only. Throws with status 409 when the channel is already live.
  Future<Map<String, dynamic>> startChannelLive({
    required String channelId,
    String sessionType = 'audio',
    String title = '',
  }) async {
    final res = await http.post(
      await _uri('/api/agent/channels/$channelId/live'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'sessionType': sessionType, 'title': title}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> joinChannelLive({
    required String channelId,
    bool speak = false,
    bool video = false,
  }) async {
    final res = await http.get(
      await _uri('/api/agent/channels/$channelId/live/join', {
        if (speak) 'speak': '1',
        if (video) 'video': '1',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> endChannelLive(String sessionId) async {
    final res = await http.post(
      await _uri('/api/channel-live/$sessionId/end'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> muteChannelParticipant({
    required String sessionId,
    required String identity,
  }) async {
    final res = await http.post(
      await _uri('/api/channel-live/$sessionId/mute'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'identity': identity}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> unmuteChannelParticipant({
    required String sessionId,
    required String identity,
  }) async {
    final res = await http.post(
      await _uri('/api/channel-live/$sessionId/unmute'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'identity': identity}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> setChannelVideoPermission({
    required String sessionId,
    required String identity,
    required bool allowed,
  }) async {
    final res = await http.post(
      await _uri('/api/channel-live/$sessionId/video-permission'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'identity': identity, 'allowed': allowed}),
    );
    return _decode(res);
  }

  Future<List<Map<String, dynamic>>> channelLiveMessages(String sessionId) async {
    final res = await http.get(
      await _uri('/api/channel-live/$sessionId/messages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    final messages = data['messages'];
    if (messages is List) {
      return messages.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return const [];
  }

  Future<Map<String, dynamic>> sendChannelLiveMessage({
    required String sessionId,
    required String message,
    required String senderName,
  }) async {
    final res = await http.post(
      await _uri('/api/channel-live/$sessionId/messages'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'message': message, 'senderName': senderName}),
    );
    return _decode(res);
  }

  // ── 1:1 support calls (agent → admin, audio only) ─────────────────────────

  Future<Map<String, dynamic>> callAvailability() async {
    final res = await http.get(
      await _uri('/api/calls/availability'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  /// Creates the room and a `ringing` session. A 409 means the admin is busy.
  Future<Map<String, dynamic>> initiateCall() async {
    final res = await http.post(
      await _uri('/api/calls/initiate'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({}),
    );
    return _decode(res);
  }

  /// Polled while ringing — `session.status` moves to active / declined / ended.
  Future<Map<String, dynamic>> callStatus(String sessionId) async {
    final res = await http.get(
      await _uri('/api/calls/initiate', {'sessionId': sessionId}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> endCall(String sessionId) async {
    final res = await http.post(
      await _uri('/api/calls/end'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'sessionId': sessionId}),
    );
    return _decode(res);
  }
}

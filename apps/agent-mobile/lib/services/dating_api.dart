import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

import 'api_client.dart';
import 'session_store.dart';

/// Every call in the website's `/agent/dating` experience. The routes all use
/// `authenticateAgent`, so the app's Bearer token + `x-agent-id` are enough and
/// no mobile-specific endpoints are involved.
class DatingApi {
  DatingApi._();
  static final instance = DatingApi._();

  /// Last resolved API base. Photo widgets need a synchronous absolute URL, so
  /// the base is primed once (see [primeBaseUrl]) and reused after that.
  static String? _baseUrlCache;

  static Future<void> primeBaseUrl() async {
    _baseUrlCache = await SessionStore.instance.getBaseUrl();
  }

  /// Dating photos come back as the relative authenticated proxy path
  /// `/api/agent/dating/photos/{id}/serve`.
  static String absolutize(String? raw) {
    final s = raw?.trim() ?? '';
    if (s.isEmpty) return '';
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    final base = _baseUrlCache ?? 'https://www.dataflexghana.com';
    return s.startsWith('/') ? '$base$s' : '$base/$s';
  }

  Future<Uri> _uri(String path, [Map<String, String>? query]) async {
    final base = await SessionStore.instance.getBaseUrl();
    _baseUrlCache = base;
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

  // ── Profile ───────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(
      await _uri('/api/agent/dating/profile'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> saveProfile(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/dating/profile'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  /// Permanent purge of the dating profile, photos, matches and messages.
  Future<Map<String, dynamic>> deleteProfile() async {
    final res = await http.delete(
      await _uri('/api/agent/dating/profile'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  // ── Discover / swipe ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> discover() async {
    final res = await http.get(
      await _uri('/api/agent/dating/discover'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> swipe({
    required String targetAgentId,
    required String direction,
    bool isTopPick = false,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/dating/swipe'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'target_agent_id': targetAgentId,
        'direction': direction,
        'is_top_pick': isTopPick,
      }),
    );
    return _decode(res);
  }

  // ── Matches / messages ────────────────────────────────────────────────────

  Future<Map<String, dynamic>> matches() async {
    final res = await http.get(
      await _uri('/api/agent/dating/matches'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> messages(String matchId) async {
    final res = await http.get(
      await _uri('/api/agent/dating/messages/$matchId'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> sendMessage({
    required String matchId,
    required String content,
    String messageType = 'text',
  }) async {
    final res = await http.post(
      await _uri('/api/agent/dating/messages/$matchId'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'content': content.trim(), 'message_type': messageType}),
    );
    return _decode(res);
  }

  /// Read receipts are a Silver/Gold feature — the route 403s on Free.
  Future<Map<String, dynamic>> markMessagesRead({
    required String matchId,
    required List<String> messageIds,
  }) async {
    final res = await http.patch(
      await _uri('/api/agent/dating/messages/$matchId'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'message_ids': messageIds}),
    );
    return _decode(res);
  }

  // ── Photos ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> uploadPhoto(XFile file) async {
    final uri = await _uri('/api/agent/dating/upload');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    final name = file.name.isNotEmpty ? file.name : file.path.split(RegExp(r'[\\/]')).last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    final subtype = ext == 'png'
        ? 'png'
        : ext == 'webp'
            ? 'webp'
            : 'jpeg';
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      filename: name,
      contentType: MediaType('image', subtype),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _decode(res);
  }

  Future<Map<String, dynamic>> deletePhoto(String photoId) async {
    final res = await http.delete(
      await _uri('/api/agent/dating/photos/$photoId'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> reorderPhotos(List<String> photoIds) async {
    final res = await http.put(
      await _uri('/api/agent/dating/photos/reorder'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'photo_ids': photoIds}),
    );
    return _decode(res);
  }

  // ── Subscription / payments ───────────────────────────────────────────────

  Future<Map<String, dynamic>> subscription() async {
    final res = await http.get(
      await _uri('/api/agent/dating/subscription'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> initializePayment({
    required String plan,
    String? email,
  }) async {
    final res = await http.post(
      await _uri('/api/paystack/dating/initialize'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'plan': plan,
        'terms_accepted': true,
        if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      }),
    );
    return _decode(res);
  }

  // ── Counselling ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> counselling() async {
    final res = await http.get(
      await _uri('/api/agent/dating/counselling'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> bookCounselling({
    required DateTime scheduledAt,
    required String sessionType,
    String? counsellorName,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/dating/counselling'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'scheduled_at': scheduledAt.toUtc().toIso8601String(),
        'session_type': sessionType,
        if (counsellorName != null && counsellorName.trim().isNotEmpty)
          'counsellor_name': counsellorName.trim(),
      }),
    );
    return _decode(res);
  }

  // ── Safety ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> block(String blockedAgentId) async {
    final res = await http.post(
      await _uri('/api/agent/dating/block'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'blocked_agent_id': blockedAgentId}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> report({
    required String reportedAgentId,
    required String reason,
    String? details,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/dating/report'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'reported_agent_id': reportedAgentId,
        'reason': reason,
        if (details != null && details.trim().isNotEmpty) 'details': details.trim(),
      }),
    );
    return _decode(res);
  }
}

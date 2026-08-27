import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'cache_store.dart';
import 'session_store.dart';

/// Member-facing DataFlex Channels endpoints (feed + interactions).
/// Mirrors the conventions in [ApiClient] and reuses its [ApiException].
class ChannelsApi {
  ChannelsApi._();
  static final instance = ChannelsApi._();

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
    final photoGate = err.toLowerCase().contains('photo verification');
    throw ChannelAccessException(
      err,
      statusCode: res.statusCode,
      photoGate: photoGate,
      code: body['code']?.toString(),
      banned: body['banned'] == true,
      requiresJoin: body['requires_join'] == true,
      channel: body['channel'] is Map ? Map<String, dynamic>.from(body['channel'] as Map) : null,
      membership: body['membership'] is Map ? Map<String, dynamic>.from(body['membership'] as Map) : null,
    );
  }

  /// Aggregated member feed: channel, membership, posts, qa, videos, audio, pinned.
  /// Throws a [ChannelAccessException] with `requiresJoin` set when the caller is
  /// not an active member (HTTP 403).
  Future<Map<String, dynamic>> feed(
    String channelId, {
    int page = 1,
    int limit = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'channel_feed_${channelId}_$page';
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/channels/$channelId/feed', {
        'page': '$page',
        'limit': '$limit',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson(cacheKey, data, ttl: const Duration(minutes: 2));
    return data;
  }

  Future<Map<String, dynamic>> interact({
    required String channelId,
    required String action,
    required String postId,
    String postType = 'post',
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/channels/$channelId/interact'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'action': action,
        'post_id': postId,
        'post_type': postType,
      }),
    );
    return _decode(res);
  }

  Future<void> like(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'like', postId: postId, postType: postType).then((_) {});

  Future<void> unlike(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'unlike', postId: postId, postType: postType).then((_) {});

  Future<void> save(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'save', postId: postId, postType: postType).then((_) {});

  Future<void> unsave(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'unsave', postId: postId, postType: postType).then((_) {});

  Future<void> markViewed(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'view', postId: postId, postType: postType).then((_) {});

  Future<void> invalidateFeed(String channelId) =>
      CacheStore.instance.invalidatePrefix('channel_feed_$channelId');
}

/// [ApiException] plus the membership context the feed endpoint returns on 403.
class ChannelAccessException extends ApiException {
  ChannelAccessException(
    super.message, {
    super.statusCode,
    super.photoGate,
    super.code,
    super.banned,
    this.requiresJoin = false,
    this.channel,
    this.membership,
  });

  final bool requiresJoin;
  final Map<String, dynamic>? channel;
  final Map<String, dynamic>? membership;
}

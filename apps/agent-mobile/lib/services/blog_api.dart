import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'cache_store.dart';
import 'session_store.dart';

/// Admin-published blog posts (site `blogs` table) exposed to agents.
class BlogApi {
  BlogApi._();
  static final instance = BlogApi._();

  Future<Uri> _uri(String path, [Map<String, String>? query]) async {
    final base = await SessionStore.instance.getBaseUrl();
    return Uri.parse('$base$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _get(Map<String, String> query) async {
    final res = await http.get(
      await _uri('/api/agent/mobile/blog', query),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
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
      photoGate: err.toLowerCase().contains('photo verification'),
      code: body['code']?.toString(),
      banned: body['banned'] == true,
    );
  }

  Future<Map<String, dynamic>> listPosts({
    String search = '',
    String category = '',
    int page = 1,
    bool forceRefresh = false,
  }) async {
    final key = 'blog_list_${search.trim()}_${category.trim()}_$page';
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(key);
      if (cached != null) return cached;
    }
    final query = <String, String>{'page': '$page', 'limit': '12'};
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    if (category.trim().isNotEmpty && category != 'all') query['category'] = category.trim();
    final data = await _get(query);
    await CacheStore.instance.putJson(key, data, ttl: const Duration(minutes: 10));
    return data;
  }

  /// Not cached — the endpoint also increments the post view counter.
  Future<Map<String, dynamic>> getPost(String slug) => _get({'slug': slug});
}

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'admin_session.dart';
import 'settings_store.dart';

class AdminApiException implements Exception {
  AdminApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401 || statusCode == 403;

  @override
  String toString() => message;
}

/// Thin transport for the website's admin REST API.
///
/// Every new admin tab in this app is a client of the same routes the dashboard
/// uses, so there is no mobile-specific backend to keep in sync.
class AdminApi {
  AdminApi._();
  static final AdminApi instance = AdminApi._();

  static const _timeout = Duration(seconds: 30);

  Future<Uri> _uri(String path, [Map<String, dynamic>? query]) async {
    final base = await SettingsStore.instance.getBaseUrl();
    final uri = Uri.parse('$base$path');
    if (query == null || query.isEmpty) return uri;
    final merged = <String, String>{...uri.queryParameters};
    query.forEach((k, v) {
      if (v == null) return;
      final s = v.toString();
      if (s.isEmpty) return;
      merged[k] = s;
    });
    return uri.replace(queryParameters: merged.isEmpty ? null : merged);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
  }) async {
    final uri = await _uri(path, query);
    final headers = AdminSession.instance.headers();
    final encoded = body == null ? null : jsonEncode(body);

    late http.Response res;
    try {
      switch (method) {
        case 'GET':
          res = await http.get(uri, headers: headers).timeout(_timeout);
          break;
        case 'POST':
          res = await http.post(uri, headers: headers, body: encoded ?? '{}').timeout(_timeout);
          break;
        case 'PATCH':
          res = await http.patch(uri, headers: headers, body: encoded ?? '{}').timeout(_timeout);
          break;
        case 'PUT':
          res = await http.put(uri, headers: headers, body: encoded ?? '{}').timeout(_timeout);
          break;
        case 'DELETE':
          res = await http.delete(uri, headers: headers, body: encoded).timeout(_timeout);
          break;
        default:
          throw AdminApiException('Unsupported method $method');
      }
    } on AdminApiException {
      rethrow;
    } catch (e) {
      throw AdminApiException('Network error: $e');
    }

    dynamic parsed;
    if (res.body.isNotEmpty) {
      try {
        parsed = jsonDecode(res.body);
      } catch (_) {
        if (res.statusCode >= 400) {
          throw AdminApiException('Server error ${res.statusCode}', statusCode: res.statusCode);
        }
        throw AdminApiException('Could not read server response');
      }
    }

    if (res.statusCode >= 400) {
      String message = 'Request failed (${res.statusCode})';
      if (parsed is Map) {
        final err = parsed['error'] ?? parsed['message'] ?? parsed['detail'];
        if (err != null) message = err.toString();
      }
      throw AdminApiException(message, statusCode: res.statusCode);
    }

    return parsed;
  }

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    final r = await _send('GET', path, query: query);
    if (r is Map<String, dynamic>) return r;
    if (r is List) return {'items': r};
    return {};
  }

  /// Admin routes are inconsistent about their list key, so try the common ones
  /// and fall back to the first list-valued entry in the payload.
  Future<List<Map<String, dynamic>>> getList(
    String path, {
    Map<String, dynamic>? query,
    List<String> keys = const [],
  }) async {
    final r = await _send('GET', path, query: query);
    return _extractList(r, keys);
  }

  List<Map<String, dynamic>> _extractList(dynamic r, List<String> keys) {
    if (r is List) return r.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
    if (r is Map<String, dynamic>) {
      final candidates = [...keys, 'items', 'data', 'results', 'rows'];
      for (final k in candidates) {
        final v = r[k];
        if (v is List) {
          return v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
        }
      }
      for (final v in r.values) {
        if (v is List) {
          return v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
        }
      }
    }
    return const [];
  }

  Future<Map<String, dynamic>> post(String path, {Object? body, Map<String, dynamic>? query}) async {
    final r = await _send('POST', path, body: body, query: query);
    return r is Map<String, dynamic> ? r : {};
  }

  Future<Map<String, dynamic>> patch(String path, {Object? body, Map<String, dynamic>? query}) async {
    final r = await _send('PATCH', path, body: body, query: query);
    return r is Map<String, dynamic> ? r : {};
  }

  Future<Map<String, dynamic>> put(String path, {Object? body, Map<String, dynamic>? query}) async {
    final r = await _send('PUT', path, body: body, query: query);
    return r is Map<String, dynamic> ? r : {};
  }

  Future<Map<String, dynamic>> delete(String path, {Object? body, Map<String, dynamic>? query}) async {
    final r = await _send('DELETE', path, body: body, query: query);
    return r is Map<String, dynamic> ? r : {};
  }
}

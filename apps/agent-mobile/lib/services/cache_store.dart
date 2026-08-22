import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Simple TTL JSON cache for faster cold starts.
class CacheStore {
  CacheStore._();
  static final instance = CacheStore._();

  Future<void> putJson(String key, Object value, {Duration ttl = const Duration(hours: 6)}) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = {
      'expires_at': DateTime.now().add(ttl).toIso8601String(),
      'data': value,
    };
    await prefs.setString('cache_$key', jsonEncode(payload));
  }

  Future<T?> getJson<T>(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('cache_$key');
    if (raw == null) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final expires = DateTime.tryParse(map['expires_at']?.toString() ?? '');
      if (expires != null && expires.isBefore(DateTime.now())) {
        await prefs.remove('cache_$key');
        return null;
      }
      return map['data'] as T?;
    } catch (_) {
      return null;
    }
  }

  Future<void> invalidate(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cache_$key');
  }

  Future<void> invalidatePrefix(String prefix) async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith('cache_$prefix')).toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }
}

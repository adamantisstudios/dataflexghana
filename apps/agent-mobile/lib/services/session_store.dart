import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  SessionStore._();
  static final instance = SessionStore._();

  static const _agentKey = 'agent_json';
  static const _baseUrlKey = 'api_base_url';
  static const _defaultBase = 'https://www.dataflexghana.com';

  final _secure = const FlutterSecureStorage();

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey)?.trim().isNotEmpty == true
        ? prefs.getString(_baseUrlKey)!.trim().replaceAll(RegExp(r'/$'), '')
        : _defaultBase;
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url.trim().replaceAll(RegExp(r'/$'), ''));
  }

  Future<Map<String, dynamic>?> getAgent() async {
    final raw = await _secure.read(key: _agentKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveAgent(Map<String, dynamic> agent) async {
    await _secure.write(key: _agentKey, value: jsonEncode(agent));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('agent_cache_name', agent['full_name']?.toString() ?? '');
    await prefs.setString('agent_cache_phone', agent['phone_number']?.toString() ?? '');
    await prefs.setString('agent_cache_photo', agent['profile_image_url']?.toString() ?? '');
  }

  Future<void> clear() async {
    await _secure.delete(key: _agentKey);
  }

  Future<Map<String, String>> authHeaders() async {
    final agent = await getAgent();
    if (agent == null || agent['id'] == null) {
      return {'Content-Type': 'application/json'};
    }
    final bearer = base64Encode(utf8.encode(jsonEncode(agent)));
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $bearer',
      'x-agent-id': agent['id'].toString(),
    };
    final phone = agent['phone_number']?.toString();
    if (phone != null && phone.isNotEmpty) {
      headers['x-agent-phone'] = phone;
    }
    return headers;
  }
}

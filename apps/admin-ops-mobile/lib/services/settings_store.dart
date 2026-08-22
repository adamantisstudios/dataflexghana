import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsStore {
  SettingsStore._();
  static final SettingsStore instance = SettingsStore._();

  static const _secure = FlutterSecureStorage();
  static const _kApiKey = 'ops_api_key';
  static const _kBaseUrl = 'ops_base_url';
  static const _kMomoNumber = 'ops_momo_number';

  Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kBaseUrl) ?? 'https://www.dataflexghana.com';
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBaseUrl, url.trim().replaceAll(RegExp(r'/$'), ''));
  }

  Future<String?> getApiKey() => _secure.read(key: _kApiKey);

  Future<void> setApiKey(String key) => _secure.write(key: _kApiKey, value: key.trim());

  Future<String> getMomoNumber() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kMomoNumber) ?? '0557943392';
  }

  Future<void> setMomoNumber(String number) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kMomoNumber, number.trim());
  }

  Future<bool> isConfigured() async {
    final key = await getApiKey();
    final base = await getBaseUrl();
    return (key != null && key.isNotEmpty) && base.isNotEmpty;
  }
}

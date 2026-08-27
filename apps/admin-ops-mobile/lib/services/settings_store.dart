import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsStore {
  SettingsStore._();
  static final SettingsStore instance = SettingsStore._();

  static const _secure = FlutterSecureStorage();
  static const _kApiKey = 'ops_api_key';
  static const _kBaseUrl = 'ops_base_url';
  static const _kMomoNumber = 'ops_momo_number';
  static const _kVibration = 'ops_vibration_enabled';
  static const _kPesterVibration = 'ops_pester_vibration_enabled';

  /// Cached so the notification path can check it without an await race.
  bool _vibrationEnabled = true;
  bool _pesterVibrationEnabled = true;

  bool get vibrationEnabledSync => _vibrationEnabled;
  bool get pesterVibrationEnabledSync => _pesterVibrationEnabled && _vibrationEnabled;

  Future<void> loadVibrationPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _vibrationEnabled = prefs.getBool(_kVibration) ?? true;
    _pesterVibrationEnabled = prefs.getBool(_kPesterVibration) ?? true;
  }

  Future<bool> getVibrationEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    _vibrationEnabled = prefs.getBool(_kVibration) ?? true;
    return _vibrationEnabled;
  }

  Future<void> setVibrationEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kVibration, value);
    _vibrationEnabled = value;
  }

  /// The repeating "pester" buzz for unattended alerts, separate from the
  /// single buzz on arrival so a quieter middle ground is possible.
  Future<bool> getPesterVibrationEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    _pesterVibrationEnabled = prefs.getBool(_kPesterVibration) ?? true;
    return _pesterVibrationEnabled;
  }

  Future<void> setPesterVibrationEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kPesterVibration, value);
    _pesterVibrationEnabled = value;
  }

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

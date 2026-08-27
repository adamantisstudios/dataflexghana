import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'settings_store.dart';

class AdminAuthException implements Exception {
  AdminAuthException(this.message, {this.requires2FA = false, this.pendingToken});
  final String message;
  final bool requires2FA;
  final String? pendingToken;

  @override
  String toString() => message;
}

class AdminProfile {
  const AdminProfile({required this.id, required this.email, required this.fullName});

  final String id;
  final String email;
  final String fullName;

  factory AdminProfile.fromJson(Map<String, dynamic> json) => AdminProfile(
        id: (json['id'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        fullName: (json['full_name'] ?? json['fullName'] ?? '').toString(),
      );

  Map<String, dynamic> toJson() => {'id': id, 'email': email, 'full_name': fullName};

  String get displayName => fullName.isNotEmpty ? fullName : email;
}

/// Admin identity for the ops phone.
///
/// The ops device key only unlocks `/api/ops/*`. Everything under `/api/admin/*`
/// and the call routes authenticate an admin *user*, so the app signs in once and
/// keeps the profile in secure storage. Headers mirror `getAdminAuthHeaders()` in
/// `lib/api-client.ts` so the mobile app is indistinguishable from the dashboard.
class AdminSession extends ChangeNotifier {
  AdminSession._();
  static final AdminSession instance = AdminSession._();

  static const _secure = FlutterSecureStorage();
  static const _kAdmin = 'ops_admin_profile';

  AdminProfile? _admin;
  AdminProfile? get admin => _admin;
  bool get isSignedIn => _admin != null && _admin!.id.isNotEmpty;

  Future<void> restore() async {
    final raw = await _secure.read(key: _kAdmin);
    if (raw == null || raw.isEmpty) return;
    try {
      _admin = AdminProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      notifyListeners();
    } catch (_) {
      await _secure.delete(key: _kAdmin);
    }
  }

  Future<AdminProfile> signIn({required String email, required String password}) async {
    final base = await SettingsStore.instance.getBaseUrl();
    final res = await http.post(
      Uri.parse('$base/api/admin/login'),
      headers: const {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email.trim(), 'password': password}),
    );

    Map<String, dynamic> body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw AdminAuthException('Unexpected response from server (${res.statusCode})');
    }

    if (body['requires2FA'] == true) {
      throw AdminAuthException(
        'This admin has two-factor authentication enabled. Complete the 2FA login on the '
        'website once with "trust this device", or use an admin without 2FA for the ops phone.',
        requires2FA: true,
        pendingToken: body['pendingToken'] as String?,
      );
    }

    if (res.statusCode >= 400 || body['success'] != true) {
      throw AdminAuthException((body['error'] ?? 'Login failed').toString());
    }

    final adminJson = body['admin'];
    if (adminJson is! Map<String, dynamic>) {
      throw AdminAuthException('Login succeeded but no admin profile was returned');
    }

    final profile = AdminProfile.fromJson(adminJson);
    if (profile.id.isEmpty) {
      throw AdminAuthException('Login succeeded but the admin id was missing');
    }

    await _secure.write(key: _kAdmin, value: jsonEncode(profile.toJson()));
    _admin = profile;
    notifyListeners();
    return profile;
  }

  Future<void> signOut() async {
    await _secure.delete(key: _kAdmin);
    _admin = null;
    notifyListeners();
  }

  /// Throws if not signed in — callers are admin-only screens.
  Map<String, String> headers({bool json = true}) {
    final a = _admin;
    if (a == null) throw AdminAuthException('Admin sign-in required');
    final bearer = base64Encode(
      utf8.encode(jsonEncode({'id': a.id, 'email': a.email, 'full_name': a.fullName})),
    );
    return {
      'Authorization': 'Bearer $bearer',
      'x-admin-id': a.id,
      'Accept': 'application/json',
      // Cookie kept in sync for routes that read admin_id from cookies.
      'Cookie': 'admin_id=${a.id}',
      if (json) 'Content-Type': 'application/json',
    };
  }
}

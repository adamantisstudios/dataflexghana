import 'dart:convert';

import 'package:http/http.dart' as http;

import 'cache_store.dart';
import 'session_store.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.photoGate = false, this.code});
  final String message;
  final int? statusCode;
  final bool photoGate;
  final String? code;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();
  static final instance = ApiClient._();

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
    throw ApiException(
      err,
      statusCode: res.statusCode,
      photoGate: photoGate,
      code: body['code']?.toString(),
    );
  }

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await http.post(
      await _uri('/api/agent/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone_number': phone.trim(), 'password': password}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> verify2fa({
    required String code,
    required String pendingToken,
    bool rememberDevice = true,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/verify-2fa'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'code': code.trim(),
        'pendingToken': pendingToken,
        'rememberDevice': rememberDevice,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> home({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('home');
      if (cached != null) return cached;
    }
    final res = await http.get(await _uri('/api/agent/mobile/home'), headers: await SessionStore.instance.authHeaders());
    final data = await _decode(res);
    await CacheStore.instance.putJson('home', data, ttl: const Duration(minutes: 10));
    if (data['agent'] is Map<String, dynamic>) {
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(data['agent'] as Map));
    }
    return data;
  }

  Future<Map<String, dynamic>> dataBundles({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('bundles');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/data-bundles'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('bundles', data, ttl: const Duration(minutes: 5));
    return data;
  }

  Future<Map<String, dynamic>> createDataOrder({
    required String bundleId,
    required String recipientPhone,
    required String paymentMethod,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/data-orders'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'bundle_id': bundleId,
        'recipient_phone': recipientPhone,
        'payment_method': paymentMethod,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('home');
    await CacheStore.instance.invalidatePrefix('orders');
    await CacheStore.instance.invalidate('wallet');
    await CacheStore.instance.invalidate('bundles');
    return data;
  }

  Future<Map<String, dynamic>> listDataOrders({
    String? status,
    String? provider,
    String? search,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'orders:${status ?? 'all'}:${provider ?? 'all'}:${search ?? ''}';
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
      if (cached != null) return cached;
    }
    final query = <String, String>{};
    if (status != null && status != 'all') query['status'] = status;
    if (provider != null && provider != 'all') query['provider'] = provider;
    if (search != null && search.trim().isNotEmpty) query['q'] = search.trim();
    final res = await http.get(
      await _uri('/api/agent/mobile/data-orders', query.isEmpty ? null : query),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson(cacheKey, data, ttl: const Duration(minutes: 2));
    return data;
  }

  Future<void> deleteDataOrder(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/mobile/data-orders', {'id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    await _decode(res);
    await CacheStore.instance.invalidatePrefix('orders');
  }

  Future<Map<String, dynamic>> wallet({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('wallet');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/wallet'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('wallet', data, ttl: const Duration(minutes: 2));
    return data;
  }

  Future<Map<String, dynamic>> walletTopup({
    required double amount,
    required String paymentReference,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/wallet/topup'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'amount': amount,
        'payment_reference': paymentReference,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('wallet');
    await CacheStore.instance.invalidate('home');
    return data;
  }

  Future<Map<String, dynamic>> notifications({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('notifications');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/notifications'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('notifications', data, ttl: const Duration(minutes: 5));
    return data;
  }

  Future<void> dismissNotification(String id) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/notifications'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'notification_id': id}),
    );
    await _decode(res);
    await CacheStore.instance.invalidate('notifications');
  }

  Future<Map<String, dynamic>> compliance({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('compliance');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/compliance'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('compliance', data, ttl: const Duration(minutes: 15));
    return data;
  }

  Future<Map<String, dynamic>> submitCompliance({
    required String formId,
    required String clientName,
    required String clientPhone,
    String? notes,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/compliance'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'form_id': formId,
        'client_name': clientName,
        'client_phone': clientPhone,
        'notes': notes,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('compliance');
    return data;
  }
}

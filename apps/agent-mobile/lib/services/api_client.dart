import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

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
    await CacheStore.instance.putJson('home', data, ttl: const Duration(minutes: 5));
    if (data['agent'] is Map<String, dynamic>) {
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(data['agent'] as Map));
    }
    return data;
  }

  /// Wallet + commission — same logic as admin Agents tab and /agent/wallet.
  Future<Map<String, dynamic>> displayBalances({String? agentId, bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('display_balances');
      if (cached != null) return cached;
    }

    Map<String, dynamic>? data;
    try {
      final res = await http.get(
        await _uri('/api/agent/mobile/display-balances'),
        headers: await SessionStore.instance.authHeaders(),
      );
      data = await _decode(res);
    } catch (_) {
      final id = agentId ?? (await SessionStore.instance.getAgent())?['id']?.toString();
      if (id != null && id.isNotEmpty) {
        final res = await http.get(await _uri('/api/agent/display-balances', {'agentId': id}));
        data = await _decode(res);
      } else {
        rethrow;
      }
    }

    await CacheStore.instance.putJson('display_balances', data, ttl: const Duration(minutes: 2));
    return data;
  }

  Future<Map<String, dynamic>> refreshAgentProfile({bool forceRefresh = true}) async {
    final local = await SessionStore.instance.getAgent();
    final agentId = local?['id']?.toString();

    Map<String, dynamic>? agent = local != null ? Map<String, dynamic>.from(local) : null;
    Map<String, dynamic>? balances;

    try {
      balances = await displayBalances(agentId: agentId, forceRefresh: forceRefresh);
    } catch (_) {}

    try {
      final homeData = await ApiClient.instance.home(forceRefresh: forceRefresh);
      if (homeData['agent'] is Map<String, dynamic>) {
        agent = Map<String, dynamic>.from(homeData['agent'] as Map);
      }
      if (homeData['balances'] is Map<String, dynamic>) {
        balances = Map<String, dynamic>.from(homeData['balances'] as Map);
      }
    } catch (_) {
      try {
        final walletData = await ApiClient.instance.wallet(forceRefresh: forceRefresh);
        balances ??= {
          'wallet_balance': walletData['wallet_balance'],
          'commission_balance': walletData['commission_balance'],
          'available_balance': walletData['available_balance'],
        };
      } catch (_) {}
    }

    if (agent != null && balances != null) {
      agent = {
        ...agent,
        'wallet_balance': balances['wallet_balance'],
        'commission_balance': balances['commission_balance'],
        if (balances['available_balance'] != null) 'available_balance': balances['available_balance'],
      };
      await SessionStore.instance.saveAgent(agent);
    }

    return {'agent': agent, 'balances': balances};
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

  Future<Map<String, dynamic>> complianceForm(String formId) async {
    final res = await http.get(
      await _uri('/api/agent/mobile/compliance', {'form_id': formId}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<String> uploadComplianceImage(XFile file, String imageType) async {
    final uri = await _uri('/api/agent/mobile/compliance/upload');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    req.headers.addAll(headers);
    req.fields['image_type'] = imageType;
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: MediaType('image', file.path.split('.').last),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    return data['image_url']?.toString() ?? '';
  }

  Future<Map<String, dynamic>> submitComplianceForm({
    required String formId,
    required Map<String, dynamic> formData,
    required List<Map<String, String>> images,
    double? selectedCost,
    String? selectedCostTier,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/compliance'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'form_id': formId,
        'form_data': formData,
        'images': images,
        if (selectedCost != null) 'selected_cost': selectedCost,
        if (selectedCostTier != null) 'selected_cost_tier': selectedCostTier,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('compliance');
    return data;
  }

  Future<Map<String, dynamic>> _cachedGet({
    required String cacheKey,
    required Future<Map<String, dynamic>> Function() network,
    Duration ttl = const Duration(minutes: 15),
    bool forceRefresh = false,
    void Function(Map<String, dynamic> fresh)? onUpdated,
  }) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
      if (cached != null) {
        network().then((fresh) async {
          try {
            final changed = jsonEncode(cached) != jsonEncode(fresh);
            await CacheStore.instance.putJson(cacheKey, fresh, ttl: ttl);
            if (changed) onUpdated?.call(fresh);
          } catch (_) {}
        }).catchError((_) {});
        return cached;
      }
    }
    final fresh = await network();
    await CacheStore.instance.putJson(cacheKey, fresh, ttl: ttl);
    return fresh;
  }

  Future<Map<String, dynamic>> jobs({
    String search = '',
    String industry = '',
    bool featured = false,
    int page = 1,
    bool forceRefresh = false,
    void Function(Map<String, dynamic> fresh)? onUpdated,
  }) {
    final key = 'jobs_${search.trim()}_${industry.trim()}_${featured}_$page';
    return _cachedGet(
      cacheKey: key,
      ttl: const Duration(minutes: 15),
      forceRefresh: forceRefresh,
      onUpdated: onUpdated,
      network: () async {
        final query = <String, String>{
          'page': '$page',
          'limit': '20',
        };
        if (search.trim().isNotEmpty) query['search'] = search.trim();
        if (industry.trim().isNotEmpty && industry != 'all') query['industry'] = industry.trim();
        if (featured) query['featured'] = 'true';
        final res = await http.get(
          await _uri('/api/agent/mobile/jobs', query),
          headers: await SessionStore.instance.authHeaders(),
        );
        return _decode(res);
      },
    );
  }

  Future<Map<String, dynamic>> jobDetail(String id, {bool forceRefresh = false}) {
    final key = 'job_$id';
    return _cachedGet(
      cacheKey: key,
      ttl: const Duration(minutes: 30),
      forceRefresh: forceRefresh,
      network: () async {
        final res = await http.get(
          await _uri('/api/agent/mobile/jobs/$id'),
          headers: await SessionStore.instance.authHeaders(),
        );
        return _decode(res);
      },
    );
  }

  Future<Map<String, dynamic>> fashionCategories({
    bool forceRefresh = false,
    void Function(Map<String, dynamic> fresh)? onUpdated,
  }) {
    return _cachedGet(
      cacheKey: 'fashion_categories',
      ttl: const Duration(hours: 1),
      forceRefresh: forceRefresh,
      onUpdated: onUpdated,
      network: () async {
        final res = await http.get(
          await _uri('/api/agent/mobile/fashion/categories'),
          headers: await SessionStore.instance.authHeaders(),
        );
        return _decode(res);
      },
    );
  }

  Future<Map<String, dynamic>> fashionProducts({
    String search = '',
    String categoryId = '',
    int page = 1,
    bool forceRefresh = false,
    void Function(Map<String, dynamic> fresh)? onUpdated,
  }) {
    final key = 'fashion_products_${search.trim()}_${categoryId}_$page';
    return _cachedGet(
      cacheKey: key,
      ttl: const Duration(minutes: 15),
      forceRefresh: forceRefresh,
      onUpdated: onUpdated,
      network: () async {
        final query = <String, String>{'page': '$page', 'limit': '12'};
        if (search.trim().isNotEmpty) query['search'] = search.trim();
        if (categoryId.isNotEmpty) query['category'] = categoryId;
        final res = await http.get(
          await _uri('/api/agent/mobile/fashion/products', query),
          headers: await SessionStore.instance.authHeaders(),
        );
        return _decode(res);
      },
    );
  }

  Future<Map<String, dynamic>> fashionProduct(String id, {bool forceRefresh = false}) {
    final key = 'fashion_product_$id';
    return _cachedGet(
      cacheKey: key,
      ttl: const Duration(minutes: 30),
      forceRefresh: forceRefresh,
      network: () async {
        final res = await http.get(
          await _uri('/api/agent/mobile/fashion/products', {'id': id}),
          headers: await SessionStore.instance.authHeaders(),
        );
        return _decode(res);
      },
    );
  }
}

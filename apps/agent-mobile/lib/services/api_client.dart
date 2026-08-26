import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

import 'cache_store.dart';
import 'session_store.dart';

class ApiException implements Exception {
  ApiException(
    this.message, {
    this.statusCode,
    this.photoGate = false,
    this.code,
    this.banned = false,
  });
  final String message;
  final int? statusCode;
  final bool photoGate;
  final String? code;
  final bool banned;
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
      banned: body['banned'] == true,
    );
  }

  /// Persist a manual MoMo registration intent (5-digit reference).
  Future<Map<String, dynamic>> registerIntent({
    required String referenceCode,
    double amount = 47,
    String? agentName,
    String? agentEmail,
    String? agentPhone,
  }) async {
    final res = await http.post(
      await _uri('/api/ops/registration-intent'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'reference_code': referenceCode.trim(),
        'amount': amount,
        if (agentName != null && agentName.trim().isNotEmpty) 'agent_name': agentName.trim(),
        if (agentEmail != null && agentEmail.trim().isNotEmpty) 'agent_email': agentEmail.trim(),
        if (agentPhone != null && agentPhone.trim().isNotEmpty) 'agent_phone': agentPhone.trim(),
      }),
    );
    return _decode(res);
  }

  /// Start Paystack registration fee payment (amount in pesewas).
  Future<Map<String, dynamic>> initializePaystackRegister({
    required String agentName,
    required String email,
    int amountPesewas = 5000,
  }) async {
    final res = await http.post(
      await _uri('/api/paystack/register/initialize'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'agent_name': agentName.trim(),
        'email': email.trim(),
        'amount': amountPesewas,
      }),
    );
    return _decode(res);
  }

  /// Verify Paystack registration payment by reference.
  Future<Map<String, dynamic>> verifyPaystackRegister(String reference) async {
    final res = await http.post(
      await _uri('/api/paystack/register/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'reference': reference.trim()}),
    );
    return _decode(res);
  }

  /// Create a new agent account (pending admin approval).
  Future<Map<String, dynamic>> registerAgent({
    required String fullName,
    required String phoneNumber,
    required String paymentLine,
    required String region,
    required String password,
    String? referralCode,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'fullName': fullName.trim(),
        'phoneNumber': phoneNumber.trim(),
        'paymentLine': paymentLine.trim(),
        'region': region.trim(),
        'password': password,
        if (referralCode != null && referralCode.trim().isNotEmpty) 'referralCode': referralCode.trim(),
      }),
    );
    return _decode(res);
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

  // ── Groceries (public Paystack flow) ──────────────────────────────────────

  Future<Map<String, dynamic>> groceryPayCommitment({
    required String fullName,
    required String email,
    required String phone,
  }) async {
    final res = await http.post(
      await _uri('/api/grocery/pay-commitment'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({
        'full_name': fullName.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> groceryVerifyPayment(String reference) async {
    final res = await http.get(
      await _uri('/api/grocery/verify-payment', {'reference': reference}),
      headers: {'Accept': 'application/json'},
    );
    return _decode(res);
  }

  Future<String> groceryUploadImage(XFile file) async {
    final uri = await _uri('/api/grocery/upload');
    final req = http.MultipartRequest('POST', uri);
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: MediaType('image', file.path.split('.').last),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    return data['url']?.toString() ?? '';
  }

  Future<Map<String, dynamic>> grocerySubmitRequest(Map<String, dynamic> payload) async {
    final res = await http.post(
      await _uri('/api/grocery/request'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode(payload),
    );
    return _decode(res);
  }

  // ── Agent settings ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> agentSettings({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('settings');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/settings'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('settings', data, ttl: const Duration(minutes: 5));
    if (data['agent'] is Map<String, dynamic>) {
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(data['agent'] as Map));
    }
    return data;
  }

  Future<Map<String, dynamic>> updateAgentProfile({
    required String email,
    required String profession,
    required String exactLocation,
    String? profileImageUrl,
  }) async {
    final res = await http.put(
      await _uri('/api/agent/mobile/settings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'email': email.trim(),
        'profession': profession.trim(),
        'exact_location': exactLocation.trim(),
        if (profileImageUrl != null && profileImageUrl.isNotEmpty) 'profile_image_url': profileImageUrl,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('settings');
    await CacheStore.instance.invalidate('home');
    if (data['agent'] is Map<String, dynamic>) {
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(data['agent'] as Map));
    }
    return data;
  }

  Future<Map<String, dynamic>> changeAgentPassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/settings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'action': 'change-password',
        'current_password': currentPassword,
        'new_password': newPassword,
      }),
    );
    return _decode(res);
  }

  Future<String> uploadAgentImage(XFile file) async {
    final uri = await _uri('/api/upload/image');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: MediaType('image', file.path.split('.').last),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    return data['url']?.toString() ?? '';
  }

  Future<Map<String, dynamic>> verifyProfilePhoto(String profileImageUrl, {bool autoApproved = false}) async {
    final res = await http.post(
      await _uri('/api/agent/profile-photo/verify'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'profile_image_url': profileImageUrl,
        'auto_approved': autoApproved,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> deleteAgentAccount() async {
    final res = await http.post(
      await _uri('/api/agent/account/delete'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> twoFactorStatus() async {
    final res = await http.get(
      await _uri('/api/agent/2fa/status'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> twoFactorSetup() async {
    final res = await http.post(
      await _uri('/api/agent/2fa/setup'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> twoFactorConfirm(String code) async {
    final res = await http.post(
      await _uri('/api/agent/2fa/confirm'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'code': code.trim()}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> twoFactorDisable({String? password, String? code}) async {
    final res = await http.post(
      await _uri('/api/agent/2fa/disable'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        if (password != null && password.isNotEmpty) 'password': password,
        if (code != null && code.isNotEmpty) 'code': code.trim(),
      }),
    );
    return _decode(res);
  }

  // ── Professional writing ──────────────────────────────────────────────────

  Future<Map<String, dynamic>> writingSubmissions({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('writing');
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/writing'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson('writing', data, ttl: const Duration(minutes: 5));
    return data;
  }

  Future<Map<String, dynamic>> submitWriting({
    required String serviceType,
    required Map<String, dynamic> formData,
    String? cvType,
    String? documentPath,
    String? imagePath,
  }) async {
    final uri = await _uri('/api/agent/mobile/writing');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    req.fields['service_type'] = serviceType;
    req.fields['form_data'] = jsonEncode(formData);
    if (cvType != null && cvType.isNotEmpty) req.fields['cv_type'] = cvType;

    if (documentPath != null && documentPath.isNotEmpty) {
      final name = documentPath.split(RegExp(r'[\\/]')).last;
      final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'pdf';
      req.files.add(await http.MultipartFile.fromPath(
        'document',
        documentPath,
        filename: name,
        contentType: MediaType(
          ext == 'pdf' ? 'application' : 'application',
          ext == 'pdf' ? 'pdf' : 'octet-stream',
        ),
      ));
    }
    if (imagePath != null && imagePath.isNotEmpty) {
      final name = imagePath.split(RegExp(r'[\\/]')).last;
      final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
      req.files.add(await http.MultipartFile.fromPath(
        'image',
        imagePath,
        filename: name,
        contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
      ));
    }

    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    await CacheStore.instance.invalidate('writing');
    return data;
  }

  // ── Referral Hub / storefront ─────────────────────────────────────────────

  Future<Map<String, dynamic>> getStoreProfile() async {
    final res = await http.get(
      await _uri('/api/agent/store-profile'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> saveStoreProfile(Map<String, dynamic> body) async {
    final res = await http.put(
      await _uri('/api/agent/store-profile'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> checkStoreSlug(String slug, {String? agentId}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/store-profile/check-slug', {
        'slug': slug.trim(),
        if (id.isNotEmpty) 'agentId': id,
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStoreSettings() async {
    final res = await http.get(
      await _uri('/api/agent/store-settings'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> upsertStoreSetting({
    required String itemType,
    required String itemId,
    required bool isVisible,
    double? customMargin,
  }) async {
    final res = await http.put(
      await _uri('/api/agent/store-settings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'item_type': itemType,
        'item_id': itemId,
        'is_visible': isVisible,
        'custom_margin': ?customMargin,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStoreBundles({
    required String provider,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await http.get(
      await _uri('/api/agent/store-bundles', {
        'provider': provider,
        'page': '$page',
        'limit': '$limit',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getListingProducts() async {
    final res = await http.get(
      await _uri('/api/agent/listing-products'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getListingPackages() async {
    final res = await http.get(
      await _uri('/api/agent/listing-packages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<String> uploadListingImage(XFile file) async {
    final uri = await _uri('/api/agent/listing-products/upload');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    final name = file.name.isNotEmpty ? file.name : file.path.split(RegExp(r'[\\/]')).last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      filename: name,
      contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    return data['url']?.toString() ?? '';
  }

  Future<Map<String, dynamic>> createListingProduct(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/listing-products'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStoreServices({int page = 1, int limit = 20}) async {
    final res = await http.get(
      await _uri('/api/agent/store-services', {'page': '$page', 'limit': '$limit'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStoreWholesale({int page = 1, int limit = 20}) async {
    final res = await http.get(
      await _uri('/api/agent/store-wholesale-products', {'page': '$page', 'limit': '$limit'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getComplianceSubmissions() async {
    final res = await http.get(
      await _uri('/api/agent/storefront/compliance-submissions'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getAdvertisingPackages() async {
    final res = await http.get(
      await _uri('/api/agent/advertising/packages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getAdvertisingOrders({int page = 1, int limit = 20}) async {
    final res = await http.get(
      await _uri('/api/agent/advertising/orders', {'page': '$page', 'limit': '$limit'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getWritingPackages() async {
    final res = await http.get(
      await _uri('/api/agent/writing-services/packages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStoreProperties() async {
    final res = await http.get(
      await _uri('/api/agent/store-properties'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getInfluencerProfile() async {
    final res = await http.get(
      await _uri('/api/agent/influencer/profile'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getInfluencerPackages() async {
    final res = await http.get(
      await _uri('/api/agent/influencer/packages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getFarmListings() async {
    final res = await http.get(
      await _uri('/api/agent/farm-listings'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> createFarmListing(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/farm-listings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getFarmOrders() async {
    final res = await http.get(
      await _uri('/api/agent/farm-orders'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getStorefrontOrders({int page = 1, int limit = 20}) async {
    final res = await http.get(
      await _uri('/api/agent/storefront-orders', {'page': '$page', 'limit': '$limit'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> requestStorefrontPayout() async {
    final res = await http.post(
      await _uri('/api/agent/storefront/request-payout'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({}),
    );
    return _decode(res);
  }

  // ── Withdrawals ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getWithdrawals({String? agentId, String? status}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/withdrawals', {
        if (id.isNotEmpty) 'agentId': id,
        if (status != null && status.isNotEmpty) 'status': status,
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> requestWithdraw({
    required double amount,
    required String momoNumber,
    String? agentId,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.post(
      await _uri('/api/agent/withdraw'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'agent_id': id,
        'amount': amount,
        'momo_number': momoNumber.trim(),
      }),
    );
    return _decode(res);
  }

  // ── Referral program ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getReferralLink({String? agentId}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/referral/generate-link', {'agent_id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> generateReferralLink({
    String? agentId,
    String? agentName,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final name = agentName ?? agent?['full_name']?.toString() ?? 'Agent';
    final res = await http.post(
      await _uri('/api/agent/referral/generate-link'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({'agent_id': id, 'agent_name': name}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getReferralStats({String? agentId}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/referral/stats', {'agent_id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  // ── Wholesale ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getWholesaleMeta() async {
    final res = await http.get(
      await _uri('/api/agent/mobile/wholesale', {'view': 'meta'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getWholesaleCatalog({
    String search = '',
    String category = '',
    String price = 'all',
    int page = 1,
    int limit = 12,
  }) async {
    final query = <String, String>{
      'view': 'catalog',
      'page': '$page',
      'limit': '$limit',
      'price': price,
    };
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    if (category.isNotEmpty && category != 'All') query['category'] = category;
    final res = await http.get(
      await _uri('/api/agent/mobile/wholesale', query),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getWholesaleOrders({String? agentId}) async {
    final res = await http.get(
      await _uri('/api/agent/mobile/wholesale', {'view': 'orders'}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> wholesaleCheckout({
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    required String deliveryAddress,
    required String deliveryPhone,
    required double totalAmount,
    required double totalCommission,
    String? paymentReference,
    String? agentId,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.post(
      await _uri('/api/agent/wholesale/checkout'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'agent_id': id,
        'items': items,
        'payment_method': paymentMethod,
        'payment_reference': ?paymentReference,
        'delivery_address': deliveryAddress,
        'delivery_phone': deliveryPhone,
        'total_amount': totalAmount,
        'total_commission': totalCommission,
      }),
    );
    final data = await _decode(res);
    await CacheStore.instance.invalidate('wallet');
    await CacheStore.instance.invalidate('home');
    await CacheStore.instance.invalidate('display_balances');
    return data;
  }

  Future<Map<String, dynamic>> getMyWholesaleProducts({
    int page = 1,
    String search = '',
    String category = '',
    String status = '',
  }) async {
    final query = <String, String>{'view': 'my-products', 'page': '$page', 'limit': '24'};
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    if (category.isNotEmpty && category != 'All') query['category'] = category;
    if (status.isNotEmpty && status != 'All') query['status'] = status;
    final res = await http.get(
      await _uri('/api/agent/mobile/wholesale', query),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> submitWholesaleProduct(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/wholesale/submit-product'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> updateMyWholesaleProduct(Map<String, dynamic> body) async {
    final res = await http.put(
      await _uri('/api/agent/mobile/wholesale'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<void> deleteMyWholesaleProduct(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/mobile/wholesale', {'id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    await _decode(res);
  }

  Future<Map<String, dynamic>> getMyProperties({
    String search = '',
    String category = '',
    String status = '',
  }) async {
    final query = <String, String>{};
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    if (category.isNotEmpty && category != 'All') query['category'] = category;
    if (status.isNotEmpty && status != 'All') query['status'] = status;
    final res = await http.get(
      await _uri('/api/agent/mobile/properties', query.isEmpty ? null : query),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> submitProperty(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/properties/submit-property'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> updateMyProperty(Map<String, dynamic> body) async {
    final res = await http.put(
      await _uri('/api/agent/mobile/properties'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<void> deleteMyProperty(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/mobile/properties', {'id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    await _decode(res);
  }

  // ── Domestic workers ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getDomesticWorkers({
    String search = '',
    int page = 1,
    int limit = 12,
  }) async {
    final query = <String, String>{'page': '$page', 'limit': '$limit'};
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    final res = await http.get(
      await _uri('/api/agent/mobile/domestic-workers', query),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> submitDomesticWorkerHire(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/domestic-workers'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<String> uploadImage(XFile file) async {
    final uri = await _uri('/api/upload/image');
    final req = http.MultipartRequest('POST', uri);
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    final name = file.name.isNotEmpty ? file.name : file.path.split(RegExp(r'[\\/]')).last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      filename: name,
      contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    return data['url']?.toString() ?? '';
  }

  // ── Savings ───────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getSavings({String? agentId}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/savings', {if (id.isNotEmpty) 'agentId': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getSavingsPlans() async {
    final res = await http.get(
      await _uri('/api/agent/savings/plans'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> createSavings({
    required String savingsPlanId,
    required double amount,
    String? agentId,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.post(
      await _uri('/api/agent/savings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'agentId': id,
        'savingsPlanId': savingsPlanId,
        'amount': amount,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getSavingsTransactions({String? savingsId}) async {
    final res = await http.get(
      await _uri('/api/agent/savings/transactions', {
        if (savingsId != null && savingsId.isNotEmpty) 'savingsId': savingsId,
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> savingsWithdraw({
    required String savingsId,
    required double amount,
    required String withdrawalType,
    required String mobileMoneyNumber,
    required String mobileMoneyNetwork,
    String? reason,
    String? agentId,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.post(
      await _uri('/api/agent/savings/withdraw'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'agentId': id,
        'savingsId': savingsId,
        'amount': amount,
        'withdrawalType': withdrawalType,
        'mobileMoneyNumber': mobileMoneyNumber.trim(),
        'mobileMoneyNetwork': mobileMoneyNetwork,
        if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
      }),
    );
    return _decode(res);
  }

  // ── AFA / referral services ───────────────────────────────────────────────

  Future<List<dynamic>> getAfaStatus({String? agentId}) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.get(
      await _uri('/api/agent/afa/status', {'agent_id': id}),
      headers: await SessionStore.instance.authHeaders(),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      await _decode(res);
    }
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is List) return decoded;
      if (decoded is Map) {
        if (decoded['error'] != null) {
          throw ApiException(decoded['error'].toString(), statusCode: res.statusCode);
        }
        if (decoded['data'] is List) return decoded['data'] as List;
      }
    } catch (e) {
      if (e is ApiException) rethrow;
    }
    return [];
  }

  Future<Map<String, dynamic>> submitAfa({
    required String fullName,
    required String phoneNumber,
    String? ghanaCard,
    String? dateOfBirth,
    String? location,
    String? occupation,
    String? notes,
    String? agentId,
  }) async {
    final agent = await SessionStore.instance.getAgent();
    final id = agentId ?? agent?['id']?.toString() ?? '';
    final res = await http.post(
      await _uri('/api/agent/afa/submit'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'agent_id': id,
        'full_name': fullName.trim(),
        'phone_number': phoneNumber.trim(),
        'ghana_card': ghanaCard?.trim() ?? 'NOT_PROVIDED',
        'date_of_birth': ?dateOfBirth,
        'location': location?.trim() ?? 'NOT_PROVIDED',
        'occupation': ?occupation,
        'notes': ?notes,
        'payment_instructions':
            'Pay the AFA registration fee via MoMo. Use the payment PIN shown after submit.',
      }),
    );
    return _decode(res);
  }

  // ── Tutorials / courses / vouchers ────────────────────────────────────────

  Future<Map<String, dynamic>> getTutorials() async {
    final res = await http.get(
      await _uri('/api/agent/tutorials'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getOnlineCourses() async {
    final res = await http.get(
      await _uri('/api/agent/online-courses'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getVoucherProducts() async {
    final res = await http.get(
      await _uri('/api/voucher-products'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  // ── Dating ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getDatingProfile() async {
    final res = await http.get(
      await _uri('/api/agent/dating/profile'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> saveDatingProfile(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/dating/profile'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> datingDiscover() async {
    final res = await http.get(
      await _uri('/api/agent/dating/discover'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> datingSwipe({
    required String targetAgentId,
    required String direction,
    bool isTopPick = false,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/dating/swipe'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'target_agent_id': targetAgentId,
        'direction': direction,
        'is_top_pick': isTopPick,
      }),
    );
    return _decode(res);
  }

  // ── Voice rooms / channels ────────────────────────────────────────────────

  Future<Map<String, dynamic>> getVoiceRooms() async {
    final res = await http.get(
      await _uri('/api/agent/voice-rooms'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getVoiceRoomToken({
    required String roomName,
    bool speak = false,
    bool video = false,
  }) async {
    final res = await http.get(
      await _uri('/api/agent/voice-rooms/token', {
        'roomName': roomName,
        if (speak) 'speak': '1',
        if (video) 'video': '1',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getChannels() async {
    final res = await http.get(
      await _uri('/api/agent/channels'),
      headers: await SessionStore.instance.authHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> joinChannel(String channelId, {String? requestMessage}) async {
    final res = await http.post(
      await _uri('/api/agent/channels/$channelId/join'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        if (requestMessage != null && requestMessage.trim().isNotEmpty)
          'request_message': requestMessage.trim(),
      }),
    );
    return _decode(res);
  }
}

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'session_store.dart';

/// Micro-Influencers endpoints under `/api/agent/influencer/**`, matching what
/// MarketplaceInfluencersSection.tsx calls on the website. Kept out of
/// [ApiClient] so the hub owns this surface.
class InfluencerApi {
  InfluencerApi._();
  static final instance = InfluencerApi._();

  /// GHS platform fee taken from both sides of an order (10% each).
  static const platformFeeRate = 0.1;
  static const minAudience = 50000;

  static const orderStatusLabels = <String, String>{
    'pending': 'Pending',
    'accepted': 'Accepted',
    'content_created': 'Content created',
    'completed': 'Completed',
    'disputed': 'Disputed',
    'cancelled': 'Cancelled',
  };

  Future<Uri> _uri(String path) async {
    final base = await SessionStore.instance.getBaseUrl();
    return Uri.parse('$base$path');
  }

  Future<Map<String, String>> _headers() => SessionStore.instance.authHeaders();

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> body = {};
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw ApiException(
      body['error']?.toString() ?? 'Request failed (${res.statusCode})',
      statusCode: res.statusCode,
      code: body['code']?.toString(),
    );
  }

  Future<String> _agentId() async {
    final agent = await SessionStore.instance.getAgent();
    return agent?['id']?.toString() ?? '';
  }

  Future<Map<String, dynamic>?> getProfile() async {
    final res = await http.get(await _uri('/api/agent/influencer/profile'), headers: await _headers());
    final data = _decode(res);
    final profile = data['profile'];
    return profile is Map ? Map<String, dynamic>.from(profile) : null;
  }

  Future<List<Map<String, dynamic>>> getPackages() async {
    final res = await http.get(await _uri('/api/agent/influencer/packages'), headers: await _headers());
    return _list(_decode(res)['packages']);
  }

  Future<List<Map<String, dynamic>>> getOrders() async {
    final res = await http.get(await _uri('/api/agent/influencer/orders'), headers: await _headers());
    return _list(_decode(res)['orders']);
  }

  List<Map<String, dynamic>> _list(Object? raw) => raw is List
      ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : <Map<String, dynamic>>[];

  /// Creates or updates the application. Returns the server message, if any.
  Future<String?> submitApplication({
    required String bio,
    required String niche,
    required int audienceSize,
    required Map<String, String> socialHandles,
    String? photoUrl,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/influencer/profile'),
      headers: await _headers(),
      body: jsonEncode({
        'agentId': await _agentId(),
        'bio': bio,
        'photo_url': (photoUrl?.trim().isEmpty ?? true) ? null : photoUrl!.trim(),
        'niche': niche,
        'audience_size': audienceSize,
        'social_handles': socialHandles,
        'terms_accepted': true,
      }),
    );
    return _decode(res)['message']?.toString();
  }

  Future<void> createPackage({
    required String title,
    required String description,
    required double price,
    required int deliveryDays,
    String? terms,
  }) async {
    final res = await http.post(
      await _uri('/api/agent/influencer/packages'),
      headers: await _headers(),
      body: jsonEncode({
        'agentId': await _agentId(),
        'title': title,
        'description': description.trim().isEmpty ? null : description.trim(),
        'price': price,
        'delivery_days': deliveryDays,
        'terms': (terms?.trim().isEmpty ?? true) ? null : terms!.trim(),
      }),
    );
    _decode(res);
  }

  /// PATCH accepts any subset of the package fields.
  Future<void> updatePackage(
    String id, {
    String? title,
    String? description,
    double? price,
    int? deliveryDays,
    String? terms,
    bool? isActive,
  }) async {
    final res = await http.patch(
      await _uri('/api/agent/influencer/packages/$id'),
      headers: await _headers(),
      body: jsonEncode({
        'agentId': await _agentId(),
        'title': ?title,
        if (description != null)
          'description': description.trim().isEmpty ? null : description.trim(),
        'price': ?price,
        'delivery_days': ?deliveryDays,
        if (terms != null) 'terms': terms.trim().isEmpty ? null : terms.trim(),
        'is_active': ?isActive,
      }),
    );
    _decode(res);
  }

  Future<void> deletePackage(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/influencer/packages/$id'),
      headers: await _headers(),
    );
    _decode(res);
  }
}

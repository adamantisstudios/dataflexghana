import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

import 'api_client.dart';
import 'cache_store.dart';
import 'session_store.dart';

/// Farmers Friend endpoints used by the Referral Hub "Farmers" tab.
///
/// Mirrors `components/agent/farmersfriend/FarmersFriendHub.tsx`,
/// `/api/agent/farm-listings`, `/api/agent/farm-listings/[id]`,
/// `/api/agent/farm-orders` and `/api/farmers/upload-photo`.
class FarmersApi {
  FarmersApi._();
  static final instance = FarmersApi._();

  static const maxPhotos = 5;
  static const _listingsCacheKey = 'hub_farm_listings';
  static const _ordersCacheKey = 'hub_farm_orders';
  static const _cacheTtl = Duration(minutes: 3);

  Future<Uri> _uri(String path) async {
    final base = await SessionStore.instance.getBaseUrl();
    return Uri.parse('$base$path');
  }

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> body = {};
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final err = body['error']?.toString() ?? 'Request failed (${res.statusCode})';
    final code = body['code']?.toString();
    final lower = err.toLowerCase();
    final photoGate = code == 'PHOTO_VERIFICATION_REQUIRED' ||
        lower.contains('photo verification') ||
        lower.contains('verify your account with a photo');
    throw ApiException(
      err,
      statusCode: res.statusCode,
      photoGate: photoGate,
      code: code,
      banned: body['banned'] == true,
    );
  }

  Future<List<FarmListing>> listings({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(_listingsCacheKey);
      if (cached != null) return _mapListings(cached['listings']);
    }
    final res = await http.get(
      await _uri('/api/agent/farm-listings'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = _decode(res);
    await CacheStore.instance.putJson(_listingsCacheKey, data, ttl: _cacheTtl);
    return _mapListings(data['listings']);
  }

  Future<List<FarmOrder>> orders({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(_ordersCacheKey);
      if (cached != null) return _mapOrders(cached['orders']);
    }
    final res = await http.get(
      await _uri('/api/agent/farm-orders'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = _decode(res);
    await CacheStore.instance.putJson(_ordersCacheKey, data, ttl: _cacheTtl);
    return _mapOrders(data['orders']);
  }

  Future<FarmListing> createListing(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/farm-listings'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    final data = _decode(res);
    await invalidate();
    return FarmListing.fromJson(Map<String, dynamic>.from(data['listing'] as Map? ?? {}));
  }

  Future<FarmListing> updateListing(String id, Map<String, dynamic> body) async {
    final res = await http.patch(
      await _uri('/api/agent/farm-listings/$id'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    final data = _decode(res);
    await invalidate();
    return FarmListing.fromJson(Map<String, dynamic>.from(data['listing'] as Map? ?? {}));
  }

  Future<void> deleteListing(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/farm-listings/$id'),
      headers: await SessionStore.instance.authHeaders(),
    );
    _decode(res);
    await invalidate();
  }

  /// POST /api/farmers/upload-photo — JPEG/PNG/WebP only, 8MB max.
  Future<String> uploadPhoto(XFile file) async {
    final req = http.MultipartRequest('POST', await _uri('/api/farmers/upload-photo'));
    final name = file.name.isNotEmpty ? file.name : file.path.split(RegExp(r'[\\/]')).last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    if (!['jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
      throw ApiException('Only JPEG, PNG, and WebP images are allowed (no videos)');
    }
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      filename: name,
      contentType: MediaType('image', ext == 'png' ? 'png' : (ext == 'webp' ? 'webp' : 'jpeg')),
    ));
    final res = await http.Response.fromStream(await req.send());
    final data = _decode(res);
    final url = data['url']?.toString() ?? '';
    if (data['success'] != true || url.isEmpty) {
      throw ApiException(data['error']?.toString() ?? 'Upload failed');
    }
    return url;
  }

  Future<void> invalidate() async {
    await CacheStore.instance.invalidate(_listingsCacheKey);
    await CacheStore.instance.invalidate(_ordersCacheKey);
  }

  List<FarmListing> _mapListings(Object? raw) {
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => FarmListing.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  List<FarmOrder> _mapOrders(Object? raw) {
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => FarmOrder.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }
}

/// Mirrors `FARM_UNITS` in `lib/farm-types.ts`.
const farmUnits = <String>['kg', 'bag', 'crate', 'bunch', 'piece', 'ton', 'litre'];

/// Mirrors `FARM_ORDER_STATUS_LABELS` in `lib/farm-types.ts`.
const farmOrderStatusLabels = <String, String>{
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'picked_up': 'Picked Up',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

double _num(Object? v) {
  if (v is num) return v.toDouble();
  return double.tryParse(v?.toString() ?? '') ?? 0;
}

String? _str(Object? v) {
  final s = v?.toString().trim();
  return s == null || s.isEmpty ? null : s;
}

List<String> _strings(Object? v) {
  if (v is! List) return [];
  return v.map((e) => e?.toString() ?? '').where((e) => e.isNotEmpty).toList();
}

class FarmListing {
  FarmListing({
    required this.id,
    required this.produceName,
    required this.farmerName,
    required this.farmerPhone,
    required this.farmerLocation,
    required this.quantityAvailable,
    required this.unit,
    required this.negotiatedPrice,
    required this.adminMarkup,
    required this.retailPrice,
    required this.photos,
    required this.harvestDate,
    required this.notes,
    required this.isPublished,
    required this.isFulfilled,
    required this.createdAt,
    required this.orderCount,
  });

  factory FarmListing.fromJson(Map<String, dynamic> m) => FarmListing(
        id: m['id']?.toString() ?? '',
        produceName: m['produce_name']?.toString() ?? 'Produce',
        farmerName: m['farmer_name']?.toString() ?? '',
        farmerPhone: m['farmer_phone']?.toString() ?? '',
        farmerLocation: _str(m['farmer_location']),
        quantityAvailable: _num(m['quantity_available']),
        unit: m['unit']?.toString() ?? 'kg',
        negotiatedPrice: _num(m['negotiated_price']),
        adminMarkup: _num(m['admin_markup']),
        retailPrice: _num(m['retail_price']),
        photos: _strings(m['photos']),
        harvestDate: _str(m['harvest_date']),
        notes: _str(m['notes']),
        isPublished: m['is_published'] == true,
        isFulfilled: m['is_fulfilled'] == true,
        createdAt: _str(m['created_at']),
        orderCount: m['order_count'] == null ? 0 : _num(m['order_count']).toInt(),
      );

  final String id;
  final String produceName;
  final String farmerName;
  final String farmerPhone;
  final String? farmerLocation;
  final double quantityAvailable;
  final String unit;
  final double negotiatedPrice;
  final double adminMarkup;
  final double retailPrice;
  final List<String> photos;
  final String? harvestDate;
  final String? notes;
  final bool isPublished;
  final bool isFulfilled;
  final String? createdAt;
  final int orderCount;

  /// Agents may only edit or delete a listing before admin publishes it.
  bool get isEditable => !isPublished;

  String get statusLabel {
    if (isFulfilled) return 'Fulfilled';
    return isPublished ? 'Published' : 'Pending';
  }
}

class FarmOrder {
  FarmOrder({
    required this.id,
    required this.produceName,
    required this.buyerName,
    required this.buyerPhone,
    required this.buyerEmail,
    required this.deliveryAddress,
    required this.quantityOrdered,
    required this.unit,
    required this.totalPrice,
    required this.deliveryFee,
    required this.agentCommission,
    required this.commissionCredited,
    required this.status,
    required this.paystackReference,
    required this.createdAt,
  });

  factory FarmOrder.fromJson(Map<String, dynamic> m) {
    final listing = m['farm_listings'] is Map
        ? Map<String, dynamic>.from(m['farm_listings'] as Map)
        : (m['listing_public'] is Map
            ? Map<String, dynamic>.from(m['listing_public'] as Map)
            : <String, dynamic>{});
    return FarmOrder(
      id: m['id']?.toString() ?? '',
      produceName:
          m['produce_name']?.toString() ?? listing['produce_name']?.toString() ?? 'Produce',
      buyerName: m['buyer_name']?.toString() ?? '—',
      buyerPhone: m['buyer_phone']?.toString() ?? '',
      buyerEmail: _str(m['buyer_email']),
      deliveryAddress: m['delivery_address']?.toString() ?? '',
      quantityOrdered: _num(m['quantity_ordered']),
      unit: listing['unit']?.toString() ?? 'kg',
      totalPrice: _num(m['total_price'] ?? m['total_paid']),
      deliveryFee: _num(m['delivery_fee']),
      agentCommission: _num(m['agent_commission']),
      commissionCredited: m['commission_credited'] == true,
      status: m['status']?.toString() ?? 'pending',
      paystackReference: _str(m['paystack_reference']),
      createdAt: _str(m['created_at']),
    );
  }

  final String id;
  final String produceName;
  final String buyerName;
  final String buyerPhone;
  final String? buyerEmail;
  final String deliveryAddress;
  final double quantityOrdered;
  final String unit;
  final double totalPrice;
  final double deliveryFee;
  final double agentCommission;
  final bool commissionCredited;
  final String status;
  final String? paystackReference;
  final String? createdAt;

  String get statusLabel => farmOrderStatusLabels[status] ?? status;
}

import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

import 'api_client.dart';
import 'cache_store.dart';
import 'session_store.dart';

/// Storefront listing endpoints used by the Referral Hub "My Listings" tab.
///
/// Mirrors `components/agent/referralhub/MarketplaceMyListingsSection.tsx` and
/// the `/api/agent/listing-*` routes. `ApiException`, `SessionStore` and
/// `CacheStore` come from the shared services.
class ListingsApi {
  ListingsApi._();
  static final instance = ListingsApi._();

  static const _packagesCacheKey = 'hub_listing_packages';
  static const _productsCacheKey = 'hub_listing_products';
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

  /// GET /api/agent/listing-packages — subscription, quotas and features.
  Future<Map<String, dynamic>> packages({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(_packagesCacheKey);
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/listing-packages'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = _decode(res);
    await CacheStore.instance.putJson(_packagesCacheKey, data, ttl: _cacheTtl);
    return data;
  }

  /// GET /api/agent/listing-products
  Future<List<Map<String, dynamic>>> products({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(_productsCacheKey);
      if (cached != null) return _asList(cached['products']);
    }
    final res = await http.get(
      await _uri('/api/agent/listing-products'),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = _decode(res);
    await CacheStore.instance.putJson(_productsCacheKey, data, ttl: _cacheTtl);
    return _asList(data['products']);
  }

  /// POST /api/agent/listing-products
  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> body) async {
    final res = await http.post(
      await _uri('/api/agent/listing-products'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    final data = _decode(res);
    await invalidate();
    return data;
  }

  /// PATCH /api/agent/listing-products/[id]
  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> body) async {
    final res = await http.patch(
      await _uri('/api/agent/listing-products/$id'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode(body),
    );
    final data = _decode(res);
    await invalidate();
    return data;
  }

  /// DELETE /api/agent/listing-products/[id]
  Future<void> deleteProduct(String id) async {
    final res = await http.delete(
      await _uri('/api/agent/listing-products/$id'),
      headers: await SessionStore.instance.authHeaders(),
    );
    _decode(res);
    await invalidate();
  }

  /// POST /api/agent/listing-products/upload — returns the public image URL.
  Future<String> uploadImage(XFile file) async {
    final req = http.MultipartRequest('POST', await _uri('/api/agent/listing-products/upload'));
    final headers = await SessionStore.instance.authHeaders();
    headers.remove('Content-Type');
    req.headers.addAll(headers);
    final name = file.name.isNotEmpty ? file.name : file.path.split(RegExp(r'[\\/]')).last;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : 'jpg';
    req.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      filename: name,
      contentType: MediaType('image', ext == 'png' ? 'png' : (ext == 'webp' ? 'webp' : 'jpeg')),
    ));
    final res = await http.Response.fromStream(await req.send());
    final data = _decode(res);
    final url = data['url']?.toString() ?? '';
    if (url.isEmpty) throw ApiException('Upload failed');
    return url;
  }

  Future<void> invalidate() async {
    await CacheStore.instance.invalidate(_packagesCacheKey);
    await CacheStore.instance.invalidate(_productsCacheKey);
  }

  List<Map<String, dynamic>> _asList(Object? raw) {
    if (raw is! List) return [];
    return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
}

/// Dart mirror of `ListingFeatures` in `lib/listing-package-utils.ts`.
class ListingFeatures {
  const ListingFeatures({
    this.whatsappButton = false,
    this.whatsappWidget = false,
    this.whatsappGroup = false,
    this.socialShare = false,
    this.featuredBadge = false,
    this.priority = false,
    this.analytics = false,
    this.heatmap = false,
    this.reviews = false,
    this.qrCode = false,
    this.customSlug = false,
    this.videoEmbed = false,
    this.emailSupport = false,
    this.blogPosts = 0,
    this.bannerSlider = false,
    this.soldBadge = false,
    this.inquiryForm = false,
    this.stockCounter = false,
    this.relatedProducts = false,
    this.limitedOfferBadge = false,
    this.productBoost = false,
    this.couponCodes = false,
    this.affiliateShareLink = false,
    this.verifiedSellerBadge = false,
    this.pdfBrochure = false,
    this.maxImages = 1,
    this.maxListings,
    this.maxBannerImages,
  });

  final bool whatsappButton;
  final bool whatsappWidget;
  final bool whatsappGroup;
  final bool socialShare;
  final bool featuredBadge;
  final bool priority;
  final bool analytics;
  final bool heatmap;
  final bool reviews;
  final bool qrCode;
  final bool customSlug;
  final bool videoEmbed;
  final bool emailSupport;

  /// 0 = none, positive = limit, -1 = unlimited.
  final int blogPosts;
  final bool bannerSlider;
  final bool soldBadge;
  final bool inquiryForm;
  final bool stockCounter;
  final bool relatedProducts;
  final bool limitedOfferBadge;
  final bool productBoost;
  final bool couponCodes;
  final bool affiliateShareLink;
  final bool verifiedSellerBadge;
  final bool pdfBrochure;
  final int maxImages;
  final int? maxListings;
  final int? maxBannerImages;

  static bool _b(Map<String, dynamic> m, String key) => m[key] == true;

  static int _i(Object? v, int fallback) {
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? fallback;
  }

  static const free = ListingFeatures(
    whatsappButton: true,
    whatsappWidget: true,
    maxImages: 1,
    maxListings: 5,
  );

  static const starter = ListingFeatures(maxImages: 1, maxListings: 20);

  static const growth = ListingFeatures(
    whatsappButton: true,
    whatsappWidget: true,
    socialShare: true,
    analytics: true,
    reviews: true,
    qrCode: true,
    soldBadge: true,
    inquiryForm: true,
    stockCounter: true,
    relatedProducts: true,
    affiliateShareLink: true,
    maxImages: 2,
    blogPosts: 5,
    maxListings: 30,
  );

  static const ultimate = ListingFeatures(
    whatsappButton: true,
    whatsappWidget: true,
    whatsappGroup: true,
    socialShare: true,
    featuredBadge: true,
    priority: true,
    analytics: true,
    heatmap: true,
    reviews: true,
    qrCode: true,
    customSlug: true,
    videoEmbed: true,
    emailSupport: true,
    blogPosts: -1,
    bannerSlider: true,
    soldBadge: true,
    inquiryForm: true,
    stockCounter: true,
    relatedProducts: true,
    limitedOfferBadge: true,
    productBoost: true,
    couponCodes: true,
    affiliateShareLink: true,
    verifiedSellerBadge: true,
    pdfBrochure: true,
    maxImages: 4,
    maxListings: 60,
    maxBannerImages: 3,
  );

  factory ListingFeatures.fromJson(Map<String, dynamic> m) {
    return ListingFeatures(
      whatsappButton: _b(m, 'whatsapp_button'),
      whatsappWidget: _b(m, 'whatsapp_widget'),
      whatsappGroup: _b(m, 'whatsapp_group'),
      socialShare: _b(m, 'social_share'),
      featuredBadge: _b(m, 'featured_badge'),
      priority: _b(m, 'priority'),
      analytics: _b(m, 'analytics'),
      heatmap: _b(m, 'heatmap'),
      reviews: _b(m, 'reviews'),
      qrCode: _b(m, 'qr_code'),
      customSlug: _b(m, 'custom_slug'),
      videoEmbed: _b(m, 'video_embed'),
      emailSupport: _b(m, 'email_support'),
      blogPosts: _i(m['blog_posts'], 0),
      bannerSlider: _b(m, 'banner_slider'),
      soldBadge: _b(m, 'sold_badge'),
      inquiryForm: _b(m, 'inquiry_form'),
      stockCounter: _b(m, 'stock_counter'),
      relatedProducts: _b(m, 'related_products'),
      limitedOfferBadge: _b(m, 'limited_offer_badge'),
      productBoost: _b(m, 'product_boost'),
      couponCodes: _b(m, 'coupon_codes'),
      affiliateShareLink: _b(m, 'affiliate_share_link'),
      verifiedSellerBadge: _b(m, 'verified_seller_badge'),
      pdfBrochure: _b(m, 'pdf_brochure'),
      maxImages: _i(m['max_images'], 1),
      maxListings: m['max_listings'] == null ? null : _i(m['max_listings'], 0),
      maxBannerImages: m['max_banner_images'] == null ? null : _i(m['max_banner_images'], 3),
    );
  }

  ListingFeatures copyWithMaxListings(int? value) {
    if (value == null || maxListings != null) return this;
    return ListingFeatures(
      whatsappButton: whatsappButton,
      whatsappWidget: whatsappWidget,
      whatsappGroup: whatsappGroup,
      socialShare: socialShare,
      featuredBadge: featuredBadge,
      priority: priority,
      analytics: analytics,
      heatmap: heatmap,
      reviews: reviews,
      qrCode: qrCode,
      customSlug: customSlug,
      videoEmbed: videoEmbed,
      emailSupport: emailSupport,
      blogPosts: blogPosts,
      bannerSlider: bannerSlider,
      soldBadge: soldBadge,
      inquiryForm: inquiryForm,
      stockCounter: stockCounter,
      relatedProducts: relatedProducts,
      limitedOfferBadge: limitedOfferBadge,
      productBoost: productBoost,
      couponCodes: couponCodes,
      affiliateShareLink: affiliateShareLink,
      verifiedSellerBadge: verifiedSellerBadge,
      pdfBrochure: pdfBrochure,
      maxImages: maxImages,
      maxListings: value,
      maxBannerImages: maxBannerImages,
    );
  }

  /// Mirrors `getPackageFeatures` — stored JSON wins, otherwise fall back to
  /// the built-in defaults keyed on package name.
  static ListingFeatures forPackage(Map<String, dynamic> package) {
    final raw = package['features'];
    final maxListings = package['max_listings'] == null ? null : _i(package['max_listings'], 0);
    if (raw is Map) {
      return ListingFeatures.fromJson(Map<String, dynamic>.from(raw)).copyWithMaxListings(maxListings);
    }
    if (raw is String && raw.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          return ListingFeatures.fromJson(Map<String, dynamic>.from(decoded))
              .copyWithMaxListings(maxListings);
        }
      } catch (_) {}
    }
    switch (package['name']?.toString()) {
      case 'Growth':
        return growth.copyWithMaxListings(maxListings);
      case 'Ultimate':
        return ultimate.copyWithMaxListings(maxListings);
      default:
        return starter.copyWithMaxListings(maxListings);
    }
  }

  /// Mirrors `getEnabledFeatureGroups` in
  /// `lib/listing-package-feature-display.ts`.
  List<FeatureGroup> enabledGroups() {
    final storefront = <String>[];
    final productTools = <String>[];
    final promotion = <String>[];
    final extras = <String>[];

    if (whatsappButton) storefront.add('WhatsApp buy button');
    if (whatsappWidget) storefront.add('WhatsApp floating widget');
    if (socialShare) storefront.add('Social share buttons');
    if (whatsappGroup) storefront.add('WhatsApp group link');

    final maxImg = maxImages < 1 ? 1 : maxImages;
    productTools.add('$maxImg image${maxImg != 1 ? 's' : ''} per product');
    if (videoEmbed) productTools.add('Video embed');
    if (qrCode) productTools.add('QR code on product');
    if (reviews) productTools.add('Reviews & ratings');
    if (stockCounter) productTools.add('Stock counter');
    if (relatedProducts) productTools.add('Related products');
    if (inquiryForm) productTools.add('Inquiry form');
    if (pdfBrochure) productTools.add('PDF brochure');

    if (featuredBadge) promotion.add('Featured badge');
    if (priority) promotion.add('Priority placement');
    if (limitedOfferBadge) promotion.add('Limited-time offers');
    if (productBoost) promotion.add('Product boost');
    if (couponCodes) promotion.add('Coupon codes');
    if (soldBadge) promotion.add('Sold badge');
    if (affiliateShareLink) promotion.add('Share & earn link');

    if (analytics) extras.add('Listing analytics');
    if (heatmap) extras.add('Click heatmap');
    if (blogPosts > 0) extras.add('$blogPosts blog posts');
    if (blogPosts < 0) extras.add('Unlimited blog posts');
    if (bannerSlider) {
      extras.add('Homepage banner slider (${maxBannerImages ?? 3} images)');
    }
    if (emailSupport) extras.add('Email support');
    if (customSlug) extras.add('Custom storefront slug');
    if (verifiedSellerBadge) extras.add('Verified seller badge');

    return [
      FeatureGroup('Storefront', storefront),
      FeatureGroup('Product tools', productTools),
      FeatureGroup('Promotion', promotion),
      FeatureGroup('Extras', extras),
    ].where((g) => g.items.isNotEmpty).toList();
  }
}

class FeatureGroup {
  const FeatureGroup(this.label, this.items);
  final String label;
  final List<String> items;
}

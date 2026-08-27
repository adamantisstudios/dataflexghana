import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../services/listings_api.dart';
import '../../services/session_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/display_format.dart';
import '../../widgets/image_viewer.dart';
import 'listings/listing_form_sheet.dart';

/// Storefront "My Listings" — full parity with
/// `components/agent/referralhub/MarketplaceMyListingsSection.tsx`.
class HubListingsTab extends StatefulWidget {
  const HubListingsTab({super.key});

  @override
  State<HubListingsTab> createState() => _HubListingsTabState();
}

class _PackageCopy {
  const _PackageCopy(this.tagline, {this.highlight = false});
  final String tagline;
  final bool highlight;
}

const _packageCopy = <String, _PackageCopy>{
  'Starter': _PackageCopy('Perfect for getting started'),
  'Growth': _PackageCopy('Best value for growing sellers', highlight: true),
  'Ultimate': _PackageCopy('For serious sellers who want insights'),
};

const _fallbackCopy = _PackageCopy('Sell on your own storefront');

const _planColors = <String, Color>{
  'Free': Color(0xFF475569),
  'Starter': Color(0xFFB45309),
  'Growth': Color(0xFF047857),
  'Ultimate': Color(0xFF6D28D9),
};

class _HubListingsTabState extends State<HubListingsTab> {
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _packages = [];
  Map<String, dynamic>? _subscription;

  int _listingsUsed = 0;
  int _maxListings = 0;
  int _daysRemaining = 0;
  bool _canList = true;
  ListingFeatures _features = ListingFeatures.free;

  bool _loading = true;
  bool _paying = false;
  bool _termsAccepted = false;
  bool _packagesOpen = true;
  bool _showAnalytics = false;
  String? _error;
  bool _photoGated = false;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);
  final _date = DateFormat('d MMM yyyy');

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  static const _photoGateMessage =
      'Your photo verification is still pending. Verify your account photo in Profile to manage your storefront listings.';

  void _handleError(Object e) {
    if (e is ApiException) {
      if (!mounted) return;
      setState(() {
        _photoGated = e.photoGate;
        _error = e.photoGate ? _photoGateMessage : e.message;
      });
      return;
    }
    if (!mounted) return;
    setState(() {
      _photoGated = false;
      _error = 'Failed to load listings';
    });
  }

  Future<void> _load({bool forceRefresh = false}) async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final packagesData = await ListingsApi.instance.packages(forceRefresh: forceRefresh);
      final products = await ListingsApi.instance.products(forceRefresh: forceRefresh);
      if (!mounted) return;

      final rawPackages = packagesData['packages'];
      final rawFeatures = packagesData['features'];
      setState(() {
        _packages = rawPackages is List
            ? rawPackages.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _subscription = packagesData['subscription'] is Map
            ? Map<String, dynamic>.from(packagesData['subscription'] as Map)
            : null;
        _listingsUsed = _int(packagesData['listings_used']);
        _maxListings = _int(packagesData['max_listings']);
        _daysRemaining = _int(packagesData['days_remaining']);
        _canList = packagesData['can_list_products'] != false;
        _features = rawFeatures is Map
            ? ListingFeatures.fromJson(Map<String, dynamic>.from(rawFeatures))
            : ListingFeatures.free;
        _products = products;
        _photoGated = false;
      });
    } catch (e) {
      _handleError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refresh() => _load(forceRefresh: true);

  int _int(Object? v) {
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }

  double _double(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Map<String, dynamic>? get _subPackage {
    final p = _subscription?['package'];
    return p is Map ? Map<String, dynamic>.from(p) : null;
  }

  bool get _isActive => _subscription?['status'] == 'active' && _daysRemaining > 0;
  bool get _isExpired =>
      _subscription != null && _subscription?['status'] == 'active' && _daysRemaining <= 0;
  String get _planName => _subPackage?['name']?.toString() ?? 'Free';
  String get _nextTierName =>
      _planName == 'Free' ? 'Starter' : (_planName == 'Starter' ? 'Growth' : 'Ultimate');
  int get _maxImages => _features.maxImages < 1 ? 1 : _features.maxImages;
  bool get _hasListingAccess => _maxListings > 0;
  bool get _isOnBestPlan => _isActive && _planName == 'Ultimate';
  bool get _showUpgradeCta => !_isOnBestPlan;
  bool get _limitReached => _hasListingAccess && _listingsUsed >= _maxListings;

  bool _isCurrentPackage(String id) {
    if (!_isActive) return false;
    return _subscription?['package_id']?.toString() == id || _subPackage?['id']?.toString() == id;
  }

  // ---------------------------------------------------------------- actions

  Future<void> _purchase(Map<String, dynamic> package) async {
    if (!_termsAccepted) {
      _snack('Accept the Listing Terms before payment', error: true);
      return;
    }
    final id = package['id']?.toString() ?? '';
    if (id.isEmpty) return;

    setState(() => _paying = true);
    try {
      final agent = await SessionStore.instance.getAgent();
      final res = await ApiClient.instance.initializeListingPackage(
        packageId: id,
        email: agent?['email']?.toString(),
        termsAccepted: true,
      );
      final url = res['authorization_url']?.toString() ?? '';
      if (url.isEmpty) throw ApiException('Payment failed');
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) throw ApiException('Could not open Paystack');
      _snack('Complete payment in your browser, then pull down to refresh.');
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Payment failed', error: true);
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _openForm({Map<String, dynamic>? product}) async {
    if (product == null && _limitReached) {
      _snack('Maximum $_maxListings active listings for your package', error: true);
      return;
    }
    final saved = await ListingFormSheet.open(
      context,
      maxImages: _maxImages,
      product: product,
    );
    if (saved == true) await _load(forceRefresh: true);
  }

  Future<void> _togglePublished(Map<String, dynamic> product) async {
    final id = product['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final next = product['is_active'] == false;
    try {
      await ListingsApi.instance.updateProduct(id, {'is_active': next});
      _snack(next ? 'Listing published' : 'Listing hidden from your storefront');
      await _load(forceRefresh: true);
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Update failed', error: true);
    }
  }

  Future<void> _delete(Map<String, dynamic> product) async {
    final id = product['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete listing'),
        content: Text('Delete "${product['title'] ?? 'this listing'}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: DfColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ListingsApi.instance.deleteProduct(id);
      _snack('Listing deleted');
      await _load(forceRefresh: true);
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Delete failed', error: true);
    }
  }

  Future<void> _openTerms() async {
    final base = await SessionStore.instance.getBaseUrl();
    await launchUrl(Uri.parse('$base/listing-terms'), mode: LaunchMode.externalApplication);
  }

  // ------------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    if (_loading && _products.isEmpty && _packages.isEmpty && _error == null) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }

    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Text(
            'My Listings',
            style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          const Text(
            'Manage your storefront products and services. Customers pay you directly via MoMo.',
            style: TextStyle(fontSize: 13, color: DfColors.muted, height: 1.4),
          ),
          const SizedBox(height: 16),
          if (_error != null) ...[
            _errorCard(),
            const SizedBox(height: 16),
          ],
          if (!_canList)
            _disabledByAdminCard()
          else ...[
            _subscriptionCard(),
            if (_showUpgradeCta && _packages.isNotEmpty) ...[
              const SizedBox(height: 16),
              _packagesSection(),
            ],
            const SizedBox(height: 16),
            if (_hasListingAccess) ...[
              if (_features.analytics) _sectionSwitcher(),
              if (_features.analytics) const SizedBox(height: 14),
              if (_showAnalytics) ..._analyticsSection() else ..._productsSection(),
            ] else
              _noAccessCard(),
          ],
        ],
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _photoGated ? const Color(0xFFFFF7E6) : const Color(0xFFFDECEC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _photoGated ? const Color(0xFFF0C36D) : DfColors.danger.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            _photoGated ? Icons.verified_user_outlined : Icons.error_outline,
            size: 20,
            color: _photoGated ? const Color(0xFF8A6100) : DfColors.danger,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error!,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: _photoGated ? const Color(0xFF8A6100) : DfColors.danger,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _disabledByAdminCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      decoration: BoxDecoration(
        color: const Color(0xFFFDECEC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.danger.withValues(alpha: 0.35)),
      ),
      child: const Text(
        'Your product listing section has been disabled by admin. Contact support if you believe this is an error.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF8C1D18)),
      ),
    );
  }

  Widget _noAccessCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Listing slots are currently unavailable on your plan.',
            style: TextStyle(fontSize: 13, color: DfColors.muted, height: 1.4),
          ),
          const SizedBox(height: 8),
          if (_showUpgradeCta)
            TextButton(
              onPressed: () => setState(() => _packagesOpen = true),
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
              child: const Text('Upgrade to start listing'),
            )
          else
            const Text(
              'Contact support for assistance.',
              style: TextStyle(fontSize: 13, color: DfColors.muted),
            ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------- subscription

  Widget _subscriptionCard() {
    final planColor = _planColors[_planName] ?? _planColors['Free']!;
    final status = _subscription?['status']?.toString();
    final expiresAt = DateTime.tryParse(_subscription?['expires_at']?.toString() ?? '');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Icon(Icons.inventory_2_outlined, size: 20, color: DfColors.brand),
              Text(
                'Subscription status',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: planColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: planColor.withValues(alpha: 0.35)),
                ),
                child: Text(
                  '$_planName Plan',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: planColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (status == 'pending') ...[
            _noticeBox(
              'Payment received — awaiting admin activation. You can list products once approved.',
              const Color(0xFFFFF7E6),
              const Color(0xFF8A6100),
            ),
            const SizedBox(height: 10),
          ],
          if (_isExpired) ...[
            _noticeBox(
              'Your package has expired. Renew below to keep your storefront listings visible.',
              const Color(0xFFFDECEC),
              const Color(0xFF8C1D18),
            ),
            const SizedBox(height: 10),
          ],
          RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 13.5, color: DfColors.ink, height: 1.4),
              children: [
                const TextSpan(text: 'You have used '),
                TextSpan(
                  text: '$_listingsUsed',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: ' of '),
                TextSpan(
                  text: '$_maxListings',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: ' listings.'),
              ],
            ),
          ),
          const SizedBox(height: 6),
          if (_isActive) ...[
            Text(
              '$_planName — $_listingsUsed/$_maxListings listings · $_daysRemaining days left',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: DfColors.brandDark),
            ),
            if (expiresAt != null) ...[
              const SizedBox(height: 4),
              Text(
                'Expires ${_date.format(expiresAt)}',
                style: const TextStyle(fontSize: 12, color: DfColors.muted),
              ),
            ],
          ] else
            const Text(
              'You are on the free listing tier. Choose a package below to unlock more listings and premium tools.',
              style: TextStyle(fontSize: 13, color: DfColors.muted, height: 1.4),
            ),
          const SizedBox(height: 12),
          if (_isOnBestPlan)
            _noticeBox(
              "You're on the best plan — enjoy all premium features.",
              const Color(0xFFF3EEFF),
              const Color(0xFF5B21B6),
              icon: Icons.auto_awesome,
            )
          else
            SizedBox(
              height: 44,
              child: ElevatedButton(
                onPressed: () => setState(() => _packagesOpen = true),
                child: Text(_subscription == null ? 'Upgrade plan' : 'Renew or upgrade plan'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _noticeBox(String text, Color bg, Color fg, {IconData? icon}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: fg.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: fg),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 12.5, height: 1.4, color: fg)),
          ),
        ],
      ),
    );
  }

  // --------------------------------------------------------------- packages

  Widget _packagesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: () => setState(() => _packagesOpen = !_packagesOpen),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [DfColors.brand, DfColors.brandLight],
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available packages',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Compare plans and subscribe with Paystack — activated for 30 days.',
                        style: TextStyle(fontSize: 12.5, color: Colors.white70, height: 1.4),
                      ),
                    ],
                  ),
                ),
                AnimatedRotation(
                  turns: _packagesOpen ? 0.5 : 0,
                  duration: const Duration(milliseconds: 180),
                  child: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
                ),
              ],
            ),
          ),
        ),
        if (_packagesOpen) ...[
          const SizedBox(height: 12),
          ..._packages.map(_packageCard),
          _termsCard(),
        ],
      ],
    );
  }

  Widget _packageCard(Map<String, dynamic> pkg) {
    final name = pkg['name']?.toString() ?? 'Package';
    final meta = _packageCopy[name] ?? _fallbackCopy;
    final features = ListingFeatures.forPackage(pkg);
    final groups = features.enabledGroups();
    final isCurrent = _isCurrentPackage(pkg['id']?.toString() ?? '');
    final maxListings = _int(pkg['max_listings']);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent
              ? DfColors.brand
              : (meta.highlight ? DfColors.brand : DfColors.muted.withValues(alpha: 0.18)),
          width: meta.highlight || isCurrent ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (meta.highlight)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              decoration: const BoxDecoration(
                color: DfColors.brand,
                borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
              ),
              child: const Text(
                'MOST POPULAR',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: Colors.white,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(
                  meta.tagline,
                  style: const TextStyle(fontSize: 13, color: DfColors.muted),
                ),
                const SizedBox(height: 12),
                Text(
                  _money.format(_double(pkg['price'])),
                  style: GoogleFonts.outfit(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: DfColors.brand,
                  ),
                ),
                const Text(
                  'One-time · 30 days after activation',
                  style: TextStyle(fontSize: 11.5, color: DfColors.muted),
                ),
                const SizedBox(height: 12),
                _featureLine('$maxListings product listings', bold: true),
                const SizedBox(height: 10),
                const Divider(height: 1),
                const SizedBox(height: 10),
                ...groups.map(
                  (g) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        g.label.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: DfColors.muted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      ...g.items.map((i) => _featureLine(i)),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
                SizedBox(
                  height: 46,
                  child: isCurrent
                      ? OutlinedButton(onPressed: null, child: const Text('Current plan'))
                      : ElevatedButton(
                          onPressed: _paying || !_termsAccepted ? null : () => _purchase(pkg),
                          child: _paying
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Choose plan · Paystack'),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _featureLine(String text, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(Icons.check, size: 14, color: DfColors.brand),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: bold ? 13 : 12.5,
                height: 1.35,
                fontWeight: bold ? FontWeight.w600 : FontWeight.w400,
                color: bold ? DfColors.ink : DfColors.muted,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _termsCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: DfColors.brand.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: _termsAccepted,
            activeColor: DfColors.brand,
            onChanged: (v) => setState(() => _termsAccepted = v ?? false),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Text('I agree to the ', style: TextStyle(fontSize: 13)),
                  GestureDetector(
                    onTap: _openTerms,
                    child: const Text(
                      'Listing Terms and Conditions',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: DfColors.brand,
                        decoration: TextDecoration.underline,
                        decorationColor: DfColors.brand,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --------------------------------------------------------------- products

  Widget _sectionSwitcher() {
    return SegmentedButton<bool>(
      segments: const [
        ButtonSegment(value: false, label: Text('Products'), icon: Icon(Icons.shopping_bag_outlined)),
        ButtonSegment(value: true, label: Text('Analytics'), icon: Icon(Icons.bar_chart)),
      ],
      selected: {_showAnalytics},
      showSelectedIcon: false,
      onSelectionChanged: (s) => setState(() => _showAnalytics = s.first),
    );
  }

  List<Widget> _productsSection() {
    return [
      Row(
        children: [
          Expanded(
            child: Text(
              'Your listings',
              style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700),
            ),
          ),
          FilledButton.icon(
            onPressed: _limitReached ? null : () => _openForm(),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Add listing'),
          ),
        ],
      ),
      const SizedBox(height: 10),
      if (_limitReached)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _noticeBox(
            'Maximum $_maxListings active listings for your package. Delete a listing or upgrade to add more.',
            const Color(0xFFFFF7E6),
            const Color(0xFF8A6100),
          ),
        ),
      if (_maxImages <= 2 && _showUpgradeCta)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _noticeBox(
            'Upgrade to $_nextTierName for more images and premium tools.',
            const Color(0xFFFFF7E6),
            const Color(0xFF8A6100),
          ),
        ),
      if (_products.isEmpty)
        Container(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            children: [
              Icon(Icons.storefront_outlined, size: 34, color: DfColors.muted),
              SizedBox(height: 10),
              Text(
                'No listings yet',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              SizedBox(height: 4),
              Text(
                'Add your first product or service to start selling on your storefront.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.4),
              ),
            ],
          ),
        )
      else
        ..._products.map(_productCard),
    ];
  }

  Widget _productCard(Map<String, dynamic> p) {
    final rawImages = p['images'];
    final images = rawImages is List
        ? rawImages
            .map((e) => DisplayFormat.resolveImageUrl(e?.toString()))
            .where((e) => e.isNotEmpty)
            .toList()
        : <String>[];
    final title = p['title']?.toString() ?? 'Listing';
    final active = p['is_active'] != false;
    final type = p['listing_type']?.toString() == 'service' ? 'Service' : 'Product';
    final views = _int(p['view_count']);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: images.isEmpty
                    ? null
                    : () => FullScreenImageViewer.open(context, images: images, title: title),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: images.isEmpty
                        ? _imageFallback()
                        : CachedNetworkImage(
                            imageUrl: images.first,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(color: DfColors.sand),
                            errorWidget: (_, _, _) => _imageFallback(),
                          ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _chip(type, DfColors.muted),
                        _chip(
                          active ? 'Active' : 'Hidden',
                          active ? DfColors.brand : const Color(0xFF8A6100),
                        ),
                        if ((p['category']?.toString() ?? '').isNotEmpty)
                          _chip(p['category'].toString(), DfColors.muted),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _money.format(_double(p['price'])),
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: DfColors.brand,
                      ),
                    ),
                    Text(
                      '$views view${views == 1 ? '' : 's'}',
                      style: const TextStyle(fontSize: 12, color: DfColors.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _openForm(product: p),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Edit'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _togglePublished(p),
                  icon: Icon(
                    active ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 16,
                  ),
                  label: Text(active ? 'Hide' : 'Publish'),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () => _delete(p),
                icon: const Icon(Icons.delete_outline),
                color: DfColors.danger,
                tooltip: 'Delete listing',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _imageFallback() => Container(
        color: DfColors.sand,
        child: const Icon(Icons.inventory_2_outlined, color: DfColors.muted),
      );

  // -------------------------------------------------------------- analytics

  List<Widget> _analyticsSection() {
    final totalViews = _products.fold<int>(0, (s, p) => s + _int(p['view_count']));
    final activeCount = _products.where((p) => p['is_active'] != false).length;
    final sorted = [..._products]
      ..sort((a, b) => _int(b['view_count']).compareTo(_int(a['view_count'])));
    final top = sorted.isEmpty ? null : sorted.first;

    return [
      Row(
        children: [
          Expanded(
            child: _statCard(
              icon: Icons.visibility_outlined,
              value: '$totalViews',
              label: 'Total product views',
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _statCard(
              icon: Icons.inventory_2_outlined,
              value: '${_products.length}',
              label: 'Total listings',
              footnote: '$activeCount active',
            ),
          ),
        ],
      ),
      if (top != null) ...[
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F3FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF6D28D9).withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.trending_up, size: 16, color: Color(0xFF5B21B6)),
                  const SizedBox(width: 6),
                  Text(
                    'Top performing product',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF5B21B6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                top['title']?.toString() ?? 'Listing',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                '${_int(top['view_count'])} views · ${_money.format(_double(top['price']))}',
                style: const TextStyle(fontSize: 12.5, color: DfColors.muted),
              ),
            ],
          ),
        ),
      ],
      const SizedBox(height: 14),
      const Text(
        'Analytics update as customers view your storefront listings.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 12, color: DfColors.muted),
      ),
    ];
  }

  Widget _statCard({
    required IconData icon,
    required String value,
    required String label,
    String? footnote,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: DfColors.brand.withValues(alpha: 0.12),
            child: Icon(icon, size: 16, color: DfColors.brand),
          ),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(fontSize: 11.5, color: DfColors.muted)),
          if (footnote != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                footnote,
                style: const TextStyle(fontSize: 11, color: DfColors.brandDark),
              ),
            ),
        ],
      ),
    );
  }
}

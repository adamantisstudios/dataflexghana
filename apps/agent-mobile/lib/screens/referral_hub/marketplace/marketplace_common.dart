import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/cache_store.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/display_format.dart';

/// The eight marketplace sub-sections, mirroring MarketplaceSubTabs.tsx.
enum MarketplaceSection {
  bundles,
  services,
  wholesale,
  compliance,
  advertising,
  writing,
  realEstate,
  influencers,
}

extension MarketplaceSectionMeta on MarketplaceSection {
  String get key => switch (this) {
        MarketplaceSection.bundles => 'bundles',
        MarketplaceSection.services => 'services',
        MarketplaceSection.wholesale => 'wholesale',
        MarketplaceSection.compliance => 'compliance',
        MarketplaceSection.advertising => 'advertising',
        MarketplaceSection.writing => 'writing',
        MarketplaceSection.realEstate => 'real-estate',
        MarketplaceSection.influencers => 'influencers',
      };

  /// Sub-tab chip label.
  String get chipLabel => switch (this) {
        MarketplaceSection.bundles => 'Data bundles',
        MarketplaceSection.services => 'Referral services',
        MarketplaceSection.wholesale => 'Wholesale',
        MarketplaceSection.compliance => 'Compliance',
        MarketplaceSection.advertising => 'Advertising',
        MarketplaceSection.writing => 'Writing',
        MarketplaceSection.realEstate => 'Real Estate',
        MarketplaceSection.influencers => 'Micro-Influencers',
      };

  String get title => switch (this) {
        MarketplaceSection.bundles => 'Data Bundles',
        MarketplaceSection.services => 'Referral Services',
        MarketplaceSection.wholesale => 'Wholesale Products',
        MarketplaceSection.compliance => 'Compliance',
        MarketplaceSection.advertising => 'Advertising',
        MarketplaceSection.writing => 'Writing Services',
        MarketplaceSection.realEstate => 'Real Estate',
        MarketplaceSection.influencers => 'Micro-Influencers',
      };

  String get description => switch (this) {
        MarketplaceSection.bundles =>
          'Sell internet data bundles to customers and earn a commission on every completed sale.',
        MarketplaceSection.services =>
          'Browse and refer clients to vetted service providers, then get paid when they convert.',
        MarketplaceSection.wholesale =>
          'List and sell wholesale products directly from your storefront to scale your daily earnings.',
        MarketplaceSection.compliance =>
          'Submit customer information for compliance-heavy services like SIM registration and KYC workflows.',
        MarketplaceSection.advertising =>
          'Offer radio and TV advertising packages to businesses and earn markup on campaign placements.',
        MarketplaceSection.writing =>
          'Promote writing and documentation packages for clients who need professional business or academic support.',
        MarketplaceSection.realEstate =>
          'Promote property sales and rentals while earning commissions from successful closes and referrals.',
        MarketplaceSection.influencers =>
          'Connect influencers with small businesses for paid promotions and referral-based campaign payouts.',
      };
}

/// Accepts the website's sub-tab keys (`real-estate`, `influencers`, …) plus a
/// few tolerant aliases so deep links never land on the wrong section.
MarketplaceSection? marketplaceSectionFromKey(String? raw) {
  final k = raw?.trim().toLowerCase().replaceAll('_', '-');
  if (k == null || k.isEmpty) return null;
  for (final s in MarketplaceSection.values) {
    if (s.key == k) return s;
  }
  return switch (k) {
    'bundle' || 'data-bundles' => MarketplaceSection.bundles,
    'service' || 'referral-services' => MarketplaceSection.services,
    'products' => MarketplaceSection.wholesale,
    'realestate' || 'property' || 'properties' => MarketplaceSection.realEstate,
    'influencer' || 'micro-influencers' => MarketplaceSection.influencers,
    _ => null,
  };
}

String formatGhs(Object? value) {
  if (value is num) return DisplayFormat.money(value);
  final n = double.tryParse(value?.toString() ?? '');
  return n != null ? DisplayFormat.money(n) : '—';
}

/// Property prices carry their own currency on the website.
String formatMoneyWithCurrency(Object? value, Object? currency) {
  final code = currency?.toString().trim().toUpperCase();
  final n = value is num ? value.toDouble() : double.tryParse(value?.toString() ?? '');
  if (n == null) return '—';
  if (code == null || code.isEmpty || code == 'GHS') return DisplayFormat.money(n);
  return '$code ${n.toStringAsFixed(2)}';
}

String marginText(double? value) =>
    (value == null || value == 0) ? '' : _trimZeros(value);

String _trimZeros(double v) {
  final s = v.toStringAsFixed(2);
  return s.endsWith('.00') ? s.substring(0, s.length - 3) : s;
}

double parseMargin(String raw) => double.tryParse(raw.trim()) ?? 0;

String networkAsset(String? provider) {
  final p = (provider ?? '').toLowerCase();
  if (p.contains('telecel') || p.contains('vodafone')) return 'assets/images/telecel.jpg';
  if (p.contains('airtel') || p.contains('tigo')) return 'assets/images/airteltigo.jpg';
  return 'assets/images/mtn.jpg';
}

/// Pulls the first usable image out of the many shapes the API returns and
/// always resolves it to an absolute URL — CachedNetworkImage throws on
/// relative paths, which used to take the whole tab down.
List<String> resolveImageList(Map<String, dynamic> row) {
  final out = <String>[];
  void addAll(Object? raw) {
    if (raw is List) {
      for (final e in raw) {
        final url = DisplayFormat.resolveImageUrl(e?.toString());
        if (url.isNotEmpty && !out.contains(url)) out.add(url);
      }
    } else if (raw != null) {
      final url = DisplayFormat.resolveImageUrl(raw.toString());
      if (url.isNotEmpty && !out.contains(url)) out.add(url);
    }
  }

  addAll(row['image_urls']);
  addAll(row['images']);
  addAll(row['image_url']);
  addAll(row['cover_image']);
  addAll(row['photo_url']);
  return out;
}

/// Network thumbnail that degrades to [fallbackIcon] instead of throwing on an
/// empty or malformed URL.
class SafeImage extends StatelessWidget {
  const SafeImage({
    super.key,
    required this.url,
    this.fallbackIcon = Icons.image_outlined,
    this.fallbackAsset,
    this.fit = BoxFit.cover,
  });

  final String? url;
  final IconData fallbackIcon;
  final String? fallbackAsset;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final resolved = DisplayFormat.resolveImageUrl(url);
    if (resolved.isEmpty) return _fallback();
    return CachedNetworkImage(
      imageUrl: resolved,
      fit: fit,
      placeholder: (_, _) => Container(color: DfColors.sand),
      errorWidget: (_, _, _) => _fallback(),
    );
  }

  Widget _fallback() {
    final asset = fallbackAsset;
    if (asset != null) return Image.asset(asset, fit: fit);
    return Container(
      color: DfColors.sand,
      alignment: Alignment.center,
      child: Icon(fallbackIcon, color: DfColors.muted),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.subtitle, this.icon});

  final String title;
  final String? subtitle;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 20, color: DfColors.brand),
              const SizedBox(width: 6),
            ],
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: const TextStyle(color: DfColors.muted, fontSize: 12, height: 1.35),
          ),
        ],
        const SizedBox(height: 12),
      ],
    );
  }
}

class SubHeading extends StatelessWidget {
  const SubHeading(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text, style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
      );
}

class InfoBanner extends StatelessWidget {
  const InfoBanner({
    super.key,
    required this.text,
    this.icon = Icons.info_outline,
    this.color = DfColors.brand,
  });

  final String text;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 12.5, height: 1.4, color: color)),
          ),
        ],
      ),
    );
  }
}

class EarnBadge extends StatelessWidget {
  const EarnBadge({super.key, required this.amount, this.label = 'Earn'});

  final num amount;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: DfColors.brand.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.3)),
      ),
      child: Text(
        '$label ${DisplayFormat.money(amount)}',
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: DfColors.brandDark,
        ),
      ),
    );
  }
}

class TagChip extends StatelessWidget {
  const TagChip(this.text, {super.key, this.color = DfColors.muted});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

/// "Visible / Hidden" label plus switch, sized so it never squeezes the card.
class VisibilityToggle extends StatelessWidget {
  const VisibilityToggle({
    super.key,
    required this.value,
    required this.busy,
    required this.onChanged,
    this.onLabel = 'Visible',
    this.offLabel = 'Hidden',
  });

  final bool value;
  final bool busy;
  final ValueChanged<bool>? onChanged;
  final String onLabel;
  final String offLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value ? onLabel : offLabel,
          style: const TextStyle(fontSize: 11, color: DfColors.muted),
        ),
        const SizedBox(width: 4),
        if (busy)
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14),
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
            ),
          )
        else
          Switch(
            value: value,
            activeThumbColor: DfColors.brand,
            onChanged: onChanged,
          ),
      ],
    );
  }
}

/// Margin/markup input paired with its action button. Laid out as a column at
/// small text scales so nothing overflows.
class MarginRow extends StatelessWidget {
  const MarginRow({
    super.key,
    required this.controller,
    required this.actionLabel,
    required this.onAction,
    this.label = 'Your margin (GHS)',
    this.hint,
    this.busy = false,
    this.trailing,
  });

  final TextEditingController controller;
  final String actionLabel;
  final VoidCallback? onAction;
  final String label;
  final String? hint;
  final bool busy;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final field = TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
      decoration: InputDecoration(labelText: label, hintText: hint, isDense: true),
    );
    final button = SizedBox(
      height: 44,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44)),
        onPressed: busy ? null : onAction,
        child: busy
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(actionLabel, style: const TextStyle(fontSize: 14)),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        field,
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: button),
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
          ],
        ),
      ],
    );
  }
}

/// Scrollable body with the loading, error and pull-to-refresh states every
/// section shares.
class SectionBody extends StatelessWidget {
  const SectionBody({
    super.key,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.children,
  });

  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: onRefresh,
      child: loading
          ? ListView(
              children: const [
                SizedBox(height: 120),
                Center(child: CircularProgressIndicator(color: DfColors.brand)),
              ],
            )
          : error != null
              ? ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(Icons.cloud_off, color: DfColors.muted, size: 36),
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: DfColors.danger),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: ElevatedButton(
                        onPressed: onRefresh,
                        child: const Text('Retry'),
                      ),
                    ),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: children,
                ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(color: DfColors.muted),
          ),
        ),
      );
}

class Pager extends StatelessWidget {
  const Pager({super.key, required this.page, required this.totalPages, required this.onPage});

  final int page;
  final int totalPages;
  final ValueChanged<int> onPage;

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          OutlinedButton.icon(
            onPressed: page <= 1 ? null : () => onPage(page - 1),
            icon: const Icon(Icons.chevron_left, size: 18),
            label: const Text('Previous'),
          ),
          Text(
            'Page $page / $totalPages',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
          OutlinedButton.icon(
            onPressed: page >= totalPages ? null : () => onPage(page + 1),
            icon: const Icon(Icons.chevron_right, size: 18),
            label: const Text('Next'),
          ),
        ],
      ),
    );
  }
}

/// One controller per (scope, id) pair. Keying by id alone made the saved and
/// catalog bundle fields share a controller, so typing in one clobbered the
/// other — every section must pass its own scope.
class MarginControllers {
  final Map<String, TextEditingController> _ctrls = {};

  TextEditingController of(String scope, String id, {double? initial}) {
    return _ctrls.putIfAbsent(
      '$scope:$id',
      () => TextEditingController(text: marginText(initial)),
    );
  }

  void drop(String scope, String id) => _ctrls.remove('$scope:$id')?.dispose();

  void dispose() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    _ctrls.clear();
  }
}

/// Shared `/api/agent/mobile/store-settings` state. Sections read visibility and
/// margins from here and write through [setVisible] / [remove] so a change in
/// one section is reflected everywhere.
class StoreSettingsStore extends ChangeNotifier {
  static const _cacheKey = 'hub_store_settings';

  List<Map<String, dynamic>> settings = [];
  List<Map<String, dynamic>> savedBundles = [];
  List<Map<String, dynamic>> savedWholesale = [];

  final Set<String> _busy = {};
  bool _loaded = false;

  bool get loaded => _loaded;

  bool isBusy(String itemType, String itemId) => _busy.contains('$itemType:$itemId');

  bool isVisible(String itemType, String itemId) {
    for (final s in settings) {
      if (s['item_type']?.toString() == itemType && s['item_id']?.toString() == itemId) {
        return s['is_visible'] == true;
      }
    }
    return false;
  }

  double? marginFor(String itemId, [String itemType = 'data_bundle']) {
    for (final s in settings) {
      if (s['item_type']?.toString() == itemType && s['item_id']?.toString() == itemId) {
        final m = s['custom_margin'];
        if (m is num) return m.toDouble();
        return double.tryParse(m?.toString() ?? '');
      }
    }
    return null;
  }

  bool get complianceVisible => settings.any(
        (s) => s['item_type']?.toString() == 'compliance_form' && s['is_visible'] == true,
      );

  List<Map<String, dynamic>> visibleOfType(String itemType) => settings
      .where((s) => s['item_type']?.toString() == itemType && s['is_visible'] == true)
      .toList();

  List<Map<String, dynamic>> _rows(Object? raw) => raw is List
      ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : <Map<String, dynamic>>[];

  void _absorb(Map<String, dynamic> data) {
    settings = _rows(data['settings']);
    savedBundles = _rows(data['savedBundles']);
    savedWholesale = _rows(data['savedWholesale']);
    _loaded = true;
  }

  /// Mutating endpoints echo the refreshed collection; use it instead of an
  /// extra round trip. Returns false when the payload lacks settings.
  bool _applyPayload(Map<String, dynamic> data) {
    if (data['settings'] is! List) return false;
    _absorb(data);
    return true;
  }

  Future<void> load({bool force = false}) async {
    if (!force) {
      final cached =
          await CacheStore.instance.getJson<Map<String, dynamic>>(_cacheKey);
      if (cached != null) {
        _absorb(cached);
        notifyListeners();
        return;
      }
    }
    final data = await ApiClient.instance.getStoreSettings();
    // Storefront edits made on the website should show up here quickly.
    await CacheStore.instance.putJson(_cacheKey, data, ttl: const Duration(minutes: 2));
    _absorb(data);
    notifyListeners();
  }

  Future<void> setVisible({
    required String itemType,
    required String itemId,
    required bool visible,
    double? customMargin,
  }) async {
    final key = '$itemType:$itemId';
    _busy.add(key);
    notifyListeners();
    try {
      final data = await ApiClient.instance.upsertStoreSetting(
        itemType: itemType,
        itemId: itemId,
        isVisible: visible,
        customMargin: customMargin,
      );
      await CacheStore.instance.invalidate(_cacheKey);
      if (!_applyPayload(data)) await load(force: true);
    } finally {
      _busy.remove(key);
      notifyListeners();
    }
  }

  Future<void> remove({required String itemType, required String itemId}) async {
    final key = '$itemType:$itemId';
    _busy.add(key);
    notifyListeners();
    try {
      final data = await ApiClient.instance.deleteStoreSetting(
        itemType: itemType,
        itemId: itemId,
      );
      await CacheStore.instance.invalidate(_cacheKey);
      if (!_applyPayload(data)) await load(force: true);
    } finally {
      _busy.remove(key);
      notifyListeners();
    }
  }
}

/// Snackbar + clipboard helpers shared by the section states.
mixin MarketplaceFeedback<T extends StatefulWidget> on State<T> {
  void snack(String message, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? DfColors.danger : null,
      ),
    );
  }

  void snackError(Object e) =>
      snack(e is ApiException ? e.message : e.toString(), error: true);

  Future<void> copyToClipboard(String text, {String message = 'Copied'}) async {
    await Clipboard.setData(ClipboardData(text: text));
    snack(message);
  }
}

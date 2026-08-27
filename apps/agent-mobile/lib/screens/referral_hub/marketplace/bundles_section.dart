import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/cache_store.dart';
import '../../../theme/app_theme.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceBundlesSection.tsx: pick a network, set a margin, add to
/// store, then manage the bundles already on the storefront.
class BundlesSection extends StatefulWidget {
  const BundlesSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<BundlesSection> createState() => _BundlesSectionState();
}

class _BundlesSectionState extends State<BundlesSection> with MarketplaceFeedback {
  static const _networks = ['MTN', 'Telecel', 'AirtelTigo'];
  static const _savedScope = 'saved_bundle';
  static const _catalogScope = 'catalog_bundle';

  final _margins = MarginControllers();

  String _provider = 'MTN';
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _bundles = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _margins.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.store.load(force: force);
      // The API hard-caps limit at 20, so paginate rather than over-requesting.
      final cacheKey = 'hub_bundles_${_provider}_p$_page';
      Map<String, dynamic>? data;
      if (!force) {
        data = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
      }
      data ??= await ApiClient.instance.getStoreBundles(
        provider: _provider,
        page: _page,
        limit: 20,
      );
      await CacheStore.instance.putJson(cacheKey, data, ttl: const Duration(minutes: 15));
      final list = data['bundles'];
      _bundles = list is List
          ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : [];
      _totalPages = (data['totalPages'] is num)
          ? (data['totalPages'] as num).toInt().clamp(1, 9999)
          : 1;
      _total = (data['total'] is num) ? (data['total'] as num).toInt() : _bundles.length;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? _bundleById(String id) {
    for (final b in widget.store.savedBundles) {
      if (b['id']?.toString() == id) return b;
    }
    for (final b in _bundles) {
      if (b['id']?.toString() == id) return b;
    }
    return null;
  }

  Future<void> _save({
    required String id,
    required String scope,
    required String successMessage,
  }) async {
    final margin = parseMargin(_margins.of(scope, id).text);
    if (margin < 0) {
      snack('Margin cannot be negative', error: true);
      return;
    }
    try {
      await widget.store.setVisible(
        itemType: 'data_bundle',
        itemId: id,
        visible: true,
        customMargin: margin,
      );
      if (scope == _catalogScope) {
        // The bundle moves up into "Your store bundles"; the saved field owns
        // the value from here on.
        _margins.drop(_catalogScope, id);
      }
      snack(successMessage);
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _remove(String id) async {
    try {
      await widget.store.remove(itemType: 'data_bundle', itemId: id);
      _margins.drop(_savedScope, id);
      snack('Removed from store');
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _toggleVisible(String id, bool visible, double margin) async {
    try {
      await widget.store.setVisible(
        itemType: 'data_bundle',
        itemId: id,
        visible: visible,
        customMargin: margin,
      );
      snack(visible ? 'Bundle visible on your store' : 'Bundle hidden from store');
    } catch (e) {
      snackError(e);
    }
  }

  void _goToPage(int page) {
    setState(() => _page = page.clamp(1, _totalPages));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) => SectionBody(
        loading: _loading,
        error: _error,
        onRefresh: () => _load(force: true),
        children: _children(),
      ),
    );
  }

  List<Widget> _children() {
    final saved = widget.store.settings
        .where((s) => s['item_type']?.toString() == 'data_bundle')
        .map((s) => s['item_id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();
    final savedIds = saved.toSet();

    return [
      SectionHeader(
        title: MarketplaceSection.bundles.title,
        subtitle: 'Pick a network, set your margin, then add to your store.',
        icon: Icons.sim_card_outlined,
      ),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _networks.map((p) {
          final selected = _provider == p;
          return ChoiceChip(
            avatar: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.asset(networkAsset(p), width: 18, height: 18, fit: BoxFit.cover),
            ),
            label: Text(p),
            selected: selected,
            selectedColor: DfColors.brand.withValues(alpha: 0.2),
            onSelected: (_) {
              if (_provider == p) return;
              setState(() {
                _provider = p;
                _page = 1;
              });
              _load();
            },
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      SubHeading('Your store bundles (${saved.length})'),
      if (saved.isEmpty)
        const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: Text(
            'No bundles in your store yet.',
            style: TextStyle(color: DfColors.muted, fontSize: 12.5),
          ),
        )
      else
        ...saved.map(_savedCard),
      const SizedBox(height: 4),
      SubHeading('Add more bundles'),
      if (_total > 0)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            '$_total $_provider bundles available · page $_page of $_totalPages',
            style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
          ),
        ),
      if (_bundles.isEmpty)
        EmptyState('No bundles for $_provider.')
      else
        ..._bundles.map((b) => _catalogCard(b, savedIds)),
      Pager(page: _page, totalPages: _totalPages, onPage: _goToPage),
    ];
  }

  Widget _savedCard(String id) {
    final store = widget.store;
    final bundle = _bundleById(id);
    final knownPrice = bundle?['price'];
    final base = knownPrice is num ? knownPrice.toDouble() : null;
    final margin = store.marginFor(id) ?? 0;
    final busy = store.isBusy('data_bundle', id);
    final visible = store.isVisible('data_bundle', id);
    final label =
        bundle?['name']?.toString() ?? 'Bundle ${id.length > 8 ? id.substring(0, 8) : id}';
    final provider = bundle?['provider']?.toString();

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 56,
                    height: 56,
                    child: SafeImage(
                      url: bundle?['image_url']?.toString(),
                      fallbackAsset: networkAsset(provider ?? _provider),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      // Base price is unknown when the bundle is no longer in the
                      // catalog; show only the margin rather than a bogus retail.
                      Text(
                        base == null
                            ? 'Margin ${formatGhs(margin)}'
                            : '${provider ?? _provider} · ${bundle?['size_gb'] ?? '?'}GB · '
                                'Base ${formatGhs(base)}',
                        style: const TextStyle(fontSize: 12, color: DfColors.muted),
                      ),
                      if (base != null)
                        Text(
                          'Margin ${formatGhs(margin)} · Sell ${formatGhs(base + margin)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: DfColors.brandDark,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('On your storefront', style: TextStyle(fontSize: 12)),
                VisibilityToggle(
                  value: visible,
                  busy: busy,
                  onChanged: busy ? null : (v) => _toggleVisible(id, v, margin),
                ),
              ],
            ),
            const SizedBox(height: 4),
            MarginRow(
              controller: _margins.of(_savedScope, id, initial: margin),
              actionLabel: 'Update',
              busy: busy,
              onAction: () => _save(
                id: id,
                scope: _savedScope,
                successMessage: 'Margin updated',
              ),
              trailing: SizedBox(
                height: 44,
                width: 48,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.zero,
                    foregroundColor: DfColors.danger,
                    side: const BorderSide(color: DfColors.danger),
                  ),
                  onPressed: busy ? null : () => _remove(id),
                  child: const Icon(Icons.delete_outline, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _catalogCard(Map<String, dynamic> b, Set<String> savedIds) {
    final id = b['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final inStore = savedIds.contains(id);
    final busy = widget.store.isBusy('data_bundle', id);
    final base = b['price'] is num ? (b['price'] as num).toDouble() : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 56,
                height: 56,
                child: SafeImage(
                  url: b['image_url']?.toString(),
                  fallbackAsset: networkAsset(b['provider']?.toString() ?? _provider),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    b['name']?.toString() ?? 'Bundle',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${b['provider'] ?? _provider} · ${b['size_gb'] ?? '?'}GB · '
                    'Base ${formatGhs(base)}',
                    style: const TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                  const SizedBox(height: 8),
                  if (inStore)
                    const TagChip('In store', color: DfColors.brandDark)
                  else
                    MarginRow(
                      controller: _margins.of(_catalogScope, id),
                      actionLabel: 'Add to store',
                      hint: 'e.g. 2',
                      busy: busy,
                      onAction: () => _save(
                        id: id,
                        scope: _catalogScope,
                        successMessage: 'Added to store',
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

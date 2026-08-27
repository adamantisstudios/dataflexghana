import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/image_viewer.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceWholesaleSection.tsx: products already on the storefront
/// with their markup, plus a searchable catalog to add more.
class WholesaleSection extends StatefulWidget {
  const WholesaleSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<WholesaleSection> createState() => _WholesaleSectionState();
}

class _WholesaleSectionState extends State<WholesaleSection> with MarketplaceFeedback {
  static const _savedScope = 'saved_wholesale';
  static const _catalogScope = 'catalog_wholesale';

  final _margins = MarginControllers();
  final _search = TextEditingController();

  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _products = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _margins.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.store.load(force: force);
      final data = await ApiClient.instance.getStoreWholesale(page: _page, limit: 12);
      final list = data['products'];
      var products = list is List
          ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : <Map<String, dynamic>>[];
      final q = _search.text.trim().toLowerCase();
      if (q.isNotEmpty) {
        products = products
            .where((p) =>
                (p['name']?.toString().toLowerCase().contains(q) ?? false) ||
                (p['description']?.toString().toLowerCase().contains(q) ?? false))
            .toList();
      }
      _products = products;
      _totalPages = (data['totalPages'] is num)
          ? (data['totalPages'] as num).toInt().clamp(1, 9999)
          : 1;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save({
    required String id,
    required String scope,
    required bool visible,
    required String successMessage,
  }) async {
    final margin = parseMargin(_margins.of(scope, id).text);
    if (margin < 0) {
      snack('Markup cannot be negative', error: true);
      return;
    }
    try {
      await widget.store.setVisible(
        itemType: 'wholesale_product',
        itemId: id,
        visible: visible,
        customMargin: margin,
      );
      if (scope == _catalogScope) _margins.drop(_catalogScope, id);
      snack(successMessage);
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _remove(String id) async {
    try {
      await widget.store.remove(itemType: 'wholesale_product', itemId: id);
      _margins.drop(_savedScope, id);
      snack('Removed from store');
    } catch (e) {
      snackError(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final saved = widget.store.savedWholesale;
        final savedIds = widget.store.settings
            .where((s) => s['item_type']?.toString() == 'wholesale_product')
            .map((s) => s['item_id']?.toString() ?? '')
            .toSet();

        return SectionBody(
          loading: _loading,
          error: _error,
          onRefresh: () => _load(force: true),
          children: [
            SectionHeader(
              title: MarketplaceSection.wholesale.title,
              subtitle: 'Add items with your markup and sell them from your storefront.',
              icon: Icons.inventory_2_outlined,
            ),
            if (saved.isNotEmpty) ...[
              SubHeading('On your store (${saved.length})'),
              ...saved.map(_savedCard),
              const SizedBox(height: 4),
            ],
            SubHeading('Wholesale catalog'),
            TextField(
              controller: _search,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) {
                setState(() => _page = 1);
                _load();
              },
              decoration: InputDecoration(
                hintText: 'Search products…',
                isDense: true,
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () {
                    setState(() => _page = 1);
                    _load();
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (_products.isEmpty)
              const EmptyState('No products found.')
            else
              ..._products.map((p) => _catalogCard(p, savedIds)),
            Pager(
              page: _page,
              totalPages: _totalPages,
              onPage: (p) {
                setState(() => _page = p);
                _load();
              },
            ),
          ],
        );
      },
    );
  }

  Widget _thumb(Map<String, dynamic> product, {double size = 64}) {
    final images = resolveImageList(product);
    return GestureDetector(
      onTap: images.isEmpty
          ? null
          : () => FullScreenImageViewer.open(
                context,
                images: images,
                title: product['name']?.toString(),
              ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          width: size,
          height: size,
          child: SafeImage(
            url: images.isEmpty ? null : images.first,
            fallbackIcon: Icons.inventory_2_outlined,
          ),
        ),
      ),
    );
  }

  Widget _savedCard(Map<String, dynamic> p) {
    final id = p['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final base = p['price'] is num ? (p['price'] as num).toDouble() : 0.0;
    final margin = widget.store.marginFor(id, 'wholesale_product') ?? 0;
    final visible = widget.store.isVisible('wholesale_product', id);
    final busy = widget.store.isBusy('wholesale_product', id);

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
                _thumb(p),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p['name']?.toString() ?? 'Product',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Base ${formatGhs(base)}',
                        style: const TextStyle(fontSize: 12, color: DfColors.muted),
                      ),
                      Text(
                        'Retail ${formatGhs(base + margin)}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
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
                  onChanged: busy
                      ? null
                      : (v) => _save(
                            id: id,
                            scope: _savedScope,
                            visible: v,
                            successMessage: v
                                ? 'Product visible on store'
                                : 'Product hidden from store',
                          ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            MarginRow(
              controller: _margins.of(_savedScope, id, initial: margin),
              label: 'Your markup (GHS)',
              actionLabel: 'Save markup',
              busy: busy,
              onAction: () => _save(
                id: id,
                scope: _savedScope,
                visible: visible,
                successMessage: 'Markup updated',
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

  Widget _catalogCard(Map<String, dynamic> p, Set<String> savedIds) {
    final id = p['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final onStore = savedIds.contains(id);
    final busy = widget.store.isBusy('wholesale_product', id);
    final base = p['price'] is num ? (p['price'] as num).toDouble() : 0.0;

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
                _thumb(p),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p['name']?.toString() ?? 'Product',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        formatGhs(base),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: DfColors.brandDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (onStore)
              const TagChip('On your store', color: DfColors.brandDark)
            else
              MarginRow(
                controller: _margins.of(_catalogScope, id),
                label: 'Your markup (GHS)',
                hint: 'e.g. 5',
                actionLabel: 'Add to store',
                busy: busy,
                onAction: () => _save(
                  id: id,
                  scope: _catalogScope,
                  visible: true,
                  successMessage: 'Product added to your store',
                ),
              ),
          ],
        ),
      ),
    );
  }
}

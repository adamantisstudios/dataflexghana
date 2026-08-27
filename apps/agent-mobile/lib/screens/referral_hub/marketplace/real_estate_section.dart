import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/image_viewer.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceRealEstateSection.tsx: my listings vs platform listings,
/// each with real imagery and a storefront toggle.
class RealEstateSection extends StatefulWidget {
  const RealEstateSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<RealEstateSection> createState() => _RealEstateSectionState();
}

class _RealEstateSectionState extends State<RealEstateSection> with MarketplaceFeedback {
  bool _loading = true;
  bool _suspended = false;
  String? _error;
  int _tab = 0;
  List<Map<String, dynamic>> _own = [];
  List<Map<String, dynamic>> _platform = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.store.load(force: force);
      final data = await ApiClient.instance.getStoreProperties();
      _suspended = data['suspended'] == true;
      _own = _rows(data['own']);
      _platform = _rows(data['platform']);
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _rows(Object? raw) => raw is List
      ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : <Map<String, dynamic>>[];

  Future<void> _toggle(String id, bool visible) async {
    if (_suspended) {
      snack('Your storefront is suspended. Contact support.', error: true);
      return;
    }
    try {
      await widget.store.setVisible(
        itemType: 'property',
        itemId: id,
        visible: visible,
        customMargin: 0,
      );
      snack(visible ? 'Property visible on your store' : 'Property hidden from store');
      await _load(force: true);
    } catch (e) {
      snackError(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        if (_suspended && !_loading && _error == null) {
          return SectionBody(
            loading: false,
            error: null,
            onRefresh: () => _load(force: true),
            children: const [
              InfoBanner(
                icon: Icons.warning_amber_rounded,
                color: DfColors.danger,
                text: 'Your storefront has been suspended. Property listings cannot be shown '
                    'until an admin reactivates your store.',
              ),
            ],
          );
        }

        final rows = _tab == 0 ? _own : _platform;
        return SectionBody(
          loading: _loading,
          error: _error,
          onRefresh: () => _load(force: true),
          children: [
            SectionHeader(
              title: 'Real Estate on your storefront',
              subtitle: 'Toggle your approved listings and the platform properties you want to '
                  'promote. Customers contact you directly.',
              icon: Icons.home_work_outlined,
            ),
            const InfoBanner(
              icon: Icons.warning_amber_rounded,
              color: Color(0xFF8A6100),
              text: 'You must personally know the property owner and have permission to list. '
                  'Fake or unauthorised listings will permanently suspend your storefront.',
            ),
            SegmentedButton<int>(
              segments: [
                ButtonSegment(value: 0, label: Text('My listings (${_own.length})')),
                ButtonSegment(value: 1, label: Text('Platform (${_platform.length})')),
              ],
              selected: {_tab},
              showSelectedIcon: false,
              onSelectionChanged: (s) => setState(() => _tab = s.first),
            ),
            const SizedBox(height: 12),
            if (rows.isEmpty)
              EmptyState(
                _tab == 0
                    ? 'No approved listings yet. Publish a property from the Listings tab.'
                    : 'No platform properties available to promote right now.',
              )
            else
              ...rows.map(_card),
          ],
        );
      },
    );
  }

  /// One malformed row must never take the whole tab down, so every card build
  /// is guarded.
  Widget _card(Map<String, dynamic> p) {
    try {
      return _buildCard(p);
    } catch (_) {
      return const Card(
        margin: EdgeInsets.only(bottom: 10),
        child: ListTile(
          leading: Icon(Icons.error_outline, color: DfColors.danger),
          title: Text('This listing could not be displayed'),
        ),
      );
    }
  }

  Widget _buildCard(Map<String, dynamic> p) {
    final id = p['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final title = p['title']?.toString() ?? p['name']?.toString() ?? 'Property';
    final price = p['price'] ?? p['asking_price'] ?? p['rent_amount'];
    // Relative paths must be resolved before they reach CachedNetworkImage.
    final images = resolveImageList(p);
    final location = p['location']?.toString() ?? '';
    final category = p['category']?.toString() ?? '';
    final ownListing = p['is_own_listing'] == true;
    final onStorefront = p['is_on_storefront'] == true || widget.store.isVisible('property', id);
    final busy = widget.store.isBusy('property', id);
    final badges = p['badges'];
    final commission = p['commission'];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: images.isEmpty
                ? null
                : () => FullScreenImageViewer.open(context, images: images, title: title),
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: SafeImage(
                    url: images.isEmpty ? null : images.first,
                    fallbackIcon: Icons.home_work_outlined,
                  ),
                ),
                if (images.length > 1)
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${images.length} photos',
                        style: const TextStyle(color: Colors.white, fontSize: 11),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
                ),
                const SizedBox(height: 4),
                Text(
                  formatMoneyWithCurrency(price, p['currency']),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: DfColors.brandDark,
                  ),
                ),
                if (location.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.place_outlined, size: 14, color: DfColors.muted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: DfColors.muted),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (category.isNotEmpty) TagChip(category),
                    if (ownListing) const TagChip('Your listing', color: DfColors.brandDark),
                    if (badges is List)
                      ...badges
                          .map((b) => b?.toString().trim() ?? '')
                          .where((b) => b.isNotEmpty)
                          .take(3)
                          .map(TagChip.new),
                    if (commission is num && commission > 0) EarnBadge(amount: commission),
                  ],
                ),
                const Divider(height: 22),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('On store', style: TextStyle(fontSize: 12.5)),
                    VisibilityToggle(
                      value: onStorefront,
                      busy: busy,
                      onLabel: 'On',
                      offLabel: 'Off',
                      onChanged: busy ? null : (v) => _toggle(id, v),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

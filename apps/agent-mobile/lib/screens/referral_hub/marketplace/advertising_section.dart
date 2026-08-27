import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/app_theme.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceAdvertisingSection.tsx — radio/TV/outdoor packages with
/// their media type, station, custom fields and agent commission.
class AdvertisingSection extends StatefulWidget {
  const AdvertisingSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<AdvertisingSection> createState() => _AdvertisingSectionState();
}

class _AdvertisingSectionState extends State<AdvertisingSection> with MarketplaceFeedback {
  static const _mediaLabels = {
    'radio': 'Radio',
    'tv': 'TV',
    'online': 'Online',
    'print': 'Print',
    'outdoor': 'Outdoor',
    'other': 'Other',
  };

  static const _mediaIcons = {
    'radio': Icons.radio,
    'tv': Icons.tv,
    'online': Icons.public,
    'print': Icons.newspaper,
    'outdoor': Icons.place_outlined,
    'other': Icons.campaign_outlined,
  };

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _packages = [];

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
      final data = await ApiClient.instance.getAdvertisingPackages();
      final list = data['packages'];
      _packages = list is List
          ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : [];
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggle(String id, bool visible) async {
    try {
      await widget.store.setVisible(
        itemType: 'ad_package',
        itemId: id,
        visible: visible,
        customMargin: 0,
      );
      snack(visible ? 'Package visible on your store' : 'Package hidden from store');
    } catch (e) {
      snackError(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) => SectionBody(
        loading: _loading,
        error: _error,
        onRefresh: () => _load(force: true),
        children: [
          SectionHeader(
            title: 'Advertising marketplace',
            subtitle: 'Enable radio, TV and outdoor packages on your storefront. You earn '
                'commission when admin marks orders as completed.',
            icon: Icons.campaign_outlined,
          ),
          if (_packages.isEmpty)
            const EmptyState(
              'No advertising packages available yet. Check back when admin adds '
              'media partner packages.',
            )
          else
            ..._packages.map(_card),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> pkg) {
    final id = pkg['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final media = pkg['media_type']?.toString() ?? 'other';
    final onStore = pkg['is_on_storefront'] == true || widget.store.isVisible('ad_package', id);
    final busy = widget.store.isBusy('ad_package', id);
    final commission = pkg['agent_commission'];
    final fields = pkg['custom_fields'];
    final description = pkg['description']?.toString() ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: DfColors.brand.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _mediaIcons[media] ?? Icons.campaign_outlined,
                    color: DfColors.brand,
                    size: 20,
                  ),
                ),
                const Spacer(),
                if (commission is num && commission > 0) EarnBadge(amount: commission),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                TagChip(_mediaLabels[media] ?? 'Other'),
                if ((pkg['station_name']?.toString() ?? '').isNotEmpty)
                  TagChip(pkg['station_name'].toString()),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              pkg['package_name']?.toString() ?? 'Package',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: DfColors.muted),
              ),
            ],
            if (fields is Map && fields.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: fields.entries
                    .take(4)
                    .map((e) => TagChip('${e.key}: ${e.value}'))
                    .toList(),
              ),
            ],
            const SizedBox(height: 10),
            Text(
              formatGhs(pkg['price']),
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: DfColors.brandDark,
              ),
            ),
            const Divider(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('On storefront', style: TextStyle(fontSize: 12.5)),
                VisibilityToggle(
                  value: onStore,
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
    );
  }
}

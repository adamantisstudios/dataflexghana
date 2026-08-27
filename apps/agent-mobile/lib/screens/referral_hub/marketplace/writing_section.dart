import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/app_theme.dart';
import 'marketplace_common.dart';

/// Mirrors the services tab of MarketplaceWritingSection.tsx: CV, cover letter
/// and business writing packages toggled onto the storefront.
class WritingSection extends StatefulWidget {
  const WritingSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<WritingSection> createState() => _WritingSectionState();
}

class _WritingSectionState extends State<WritingSection> with MarketplaceFeedback {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _services = [];

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
      final data = await ApiClient.instance.getWritingPackages();
      final list = data['services'];
      _services = list is List
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
        itemType: 'writing_service',
        itemId: id,
        visible: visible,
        customMargin: 0,
      );
      snack(visible ? 'Service visible on your store' : 'Service hidden from store');
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
            title: 'Writing packages',
            subtitle: 'Toggle the services your customers can order from your store. You earn '
                'commission when you deliver completed orders via WhatsApp.',
            icon: Icons.edit_document,
          ),
          if (_services.isEmpty)
            const EmptyState(
              'No writing services available yet. Check back when admin adds packages.',
            )
          else
            ..._services.map(_card),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> svc) {
    final id = svc['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final onStore =
        svc['is_on_storefront'] == true || widget.store.isVisible('writing_service', id);
    final busy = widget.store.isBusy('writing_service', id);
    final commission = svc['agent_commission'];
    final description = svc['description']?.toString() ?? '';
    final turnaround = svc['turnaround_time']?.toString() ?? '';
    final category = svc['category']?.toString() ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              svc['service_name']?.toString() ?? 'Service',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            if (category.isNotEmpty) ...[
              const SizedBox(height: 6),
              TagChip(category),
            ],
            if (description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: DfColors.muted),
              ),
            ],
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  formatGhs(svc['price']),
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                if (commission is num && commission > 0) EarnBadge(amount: commission),
              ],
            ),
            if (turnaround.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                turnaround,
                style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
              ),
            ],
            const Divider(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  onStore ? 'On your storefront' : 'Hidden from storefront',
                  style: const TextStyle(fontSize: 12.5),
                ),
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

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/session_store.dart';
import '../../../theme/app_theme.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceServicesSection.tsx — searchable catalog with a
/// visibility switch, plus a Refer call-to-action that hands the agent a
/// ready-to-send message.
class ServicesSection extends StatefulWidget {
  const ServicesSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<ServicesSection> createState() => _ServicesSectionState();
}

class _ServicesSectionState extends State<ServicesSection> with MarketplaceFeedback {
  final _search = TextEditingController();
  Timer? _debounce;

  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;
  String? _error;
  String _query = '';
  String? _storeUrl;
  List<Map<String, dynamic>> _services = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  /// Website behaviour: 400ms debounce, and searching resets to page 1.
  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (!mounted || _query == value.trim()) return;
      setState(() {
        _query = value.trim();
        _page = 1;
      });
      _load();
    });
  }

  double _commissionOf(Map<String, dynamic> svc) {
    final direct = svc['agent_commission'];
    if (direct is num && direct > 0) return direct.toDouble();
    final fixed = svc['commission_amount'];
    if (fixed is num && fixed > 0) return fixed.toDouble();
    final cost = svc['product_cost'] ?? svc['cost'];
    final rate = svc['commission_rate'];
    if (cost is num && cost > 0 && rate is num && rate > 0) {
      if (rate <= 1) return (cost * rate).toDouble();
      if (rate <= 100) return (cost * (rate / 100)).toDouble();
      return rate.toDouble();
    }
    return 0;
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.store.load(force: force);
      final data = await ApiClient.instance.getStoreServices(page: _page, limit: 10);
      final list = data['services'];
      var services = list is List
          ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : <Map<String, dynamic>>[];
      // The mobile catalog route has no `search` param, so filter client-side.
      if (_query.isNotEmpty) {
        final q = _query.toLowerCase();
        services = services
            .where((s) =>
                (s['title']?.toString().toLowerCase().contains(q) ?? false) ||
                (s['description']?.toString().toLowerCase().contains(q) ?? false))
            .toList();
      }
      _services = services;
      _totalPages = (data['totalPages'] is num)
          ? (data['totalPages'] as num).toInt().clamp(1, 9999)
          : 1;
      _storeUrl ??= await _resolveStoreUrl();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _resolveStoreUrl() async {
    try {
      final profile = await ApiClient.instance.getStoreProfile();
      final raw = profile['profile'] is Map ? profile['profile'] as Map : profile;
      final slug = raw['store_slug']?.toString().trim() ?? '';
      if (slug.isEmpty) return null;
      final base = await SessionStore.instance.getBaseUrl();
      return '$base/store/$slug';
    } catch (_) {
      return null;
    }
  }

  Future<void> _toggle(String id, bool visible) async {
    try {
      await widget.store.setVisible(
        itemType: 'referral_service',
        itemId: id,
        visible: visible,
        customMargin: 0,
      );
      snack(visible ? 'Service visible on your store' : 'Service hidden from store');
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _refer(Map<String, dynamic> svc) async {
    final title = svc['title']?.toString() ?? 'this service';
    final cost = formatGhs(svc['cost'] ?? svc['product_cost']);
    final link = _storeUrl;
    final message = link == null
        ? 'Hi! I can arrange $title for you at $cost through DataFlex Ghana. '
            'Reply here and I will get it started.'
        : 'Hi! I can arrange $title for you at $cost. '
            'Order it directly on my store: $link';
    await copyToClipboard(message, message: 'Referral message copied');
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
            title: MarketplaceSection.services.title,
            subtitle: 'Search and toggle which services appear on your store, '
                'then share a referral message with your customer.',
            icon: Icons.handshake_outlined,
          ),
          TextField(
            controller: _search,
            onChanged: _onSearchChanged,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search services…',
              isDense: true,
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _search.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        _search.clear();
                        _onSearchChanged('');
                      },
                    ),
            ),
          ),
          const SizedBox(height: 12),
          if (_services.isEmpty)
            const EmptyState('No services found.')
          else
            ..._services.map(_card),
          Pager(
            page: _page,
            totalPages: _totalPages,
            onPage: (p) {
              setState(() => _page = p);
              _load();
            },
          ),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> svc) {
    final id = svc['id']?.toString() ?? '';
    if (id.isEmpty) return const SizedBox.shrink();
    final visible = widget.store.isVisible('referral_service', id);
    final busy = widget.store.isBusy('referral_service', id);
    final commission = _commissionOf(svc);
    final description = svc['description']?.toString() ?? '';

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
                    width: 64,
                    height: 64,
                    child: SafeImage(
                      url: svc['image_url']?.toString(),
                      fallbackIcon: Icons.handshake_outlined,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        svc['title']?.toString() ?? 'Service',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      if (description.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: DfColors.muted),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            formatGhs(svc['cost'] ?? svc['product_cost']),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (commission > 0) EarnBadge(amount: commission),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            // Action row on its own full-width line: the Refer CTA no longer
            // fights the switch for space inside the text column.
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 42,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(minimumSize: const Size(0, 42)),
                      onPressed: () => _refer(svc),
                      icon: const Icon(Icons.ios_share, size: 16),
                      label: const Text('Refer', style: TextStyle(fontSize: 14)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                VisibilityToggle(
                  value: visible,
                  busy: busy,
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

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../services/farmers_api.dart';
import '../../theme/app_theme.dart';
import '../../utils/display_format.dart';
import '../../widgets/image_viewer.dart';
import 'farmers/farm_listing_form_sheet.dart';

/// Farmers Friend hub — full parity with
/// `components/agent/farmersfriend/FarmersFriendHub.tsx`.
class HubFarmersTab extends StatefulWidget {
  const HubFarmersTab({super.key});

  @override
  State<HubFarmersTab> createState() => _HubFarmersTabState();
}

enum _FarmSection { create, listings, orders }

const _listingFilters = <String, String>{
  'all': 'All',
  'pending': 'Pending',
  'published': 'Published',
  'fulfilled': 'Fulfilled',
};

class _HubFarmersTabState extends State<HubFarmersTab> {
  final _search = TextEditingController();

  List<FarmListing> _listings = [];
  List<FarmOrder> _orders = [];

  _FarmSection _section = _FarmSection.listings;
  String _listingFilter = 'all';
  String _orderFilter = 'all';

  bool _loading = true;
  String? _error;
  bool _photoGated = false;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);
  final _date = DateFormat('d MMM yyyy');

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  static const _photoGateMessage =
      'Your photo verification is still pending. Verify your account photo in Profile to use Farmers Friend.';

  Future<void> _load({bool forceRefresh = false}) async {
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final listings = await FarmersApi.instance.listings(forceRefresh: forceRefresh);
      final orders = await FarmersApi.instance.orders(forceRefresh: forceRefresh);
      if (!mounted) return;
      setState(() {
        _listings = listings;
        _orders = orders;
        _photoGated = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _photoGated = e.photoGate;
        _error = e.photoGate ? _photoGateMessage : e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _photoGated = false;
        _error = 'Failed to load Farmers Friend data';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refresh() => _load(forceRefresh: true);

  // ---------------------------------------------------------------- actions

  Future<void> _openForm({FarmListing? listing}) async {
    final saved = await FarmListingFormSheet.open(context, listing: listing);
    if (saved == true) await _load(forceRefresh: true);
  }

  Future<void> _delete(FarmListing listing) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete draft listing'),
        content: Text('Delete "${listing.produceName}"? This cannot be undone.'),
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
      await FarmersApi.instance.deleteListing(listing.id);
      _snack('Deleted');
      await _load(forceRefresh: true);
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Delete failed', error: true);
    }
  }

  Future<void> _callBuyer(String phone) async {
    if (phone.trim().isEmpty) return;
    final uri = Uri(scheme: 'tel', path: phone.trim());
    if (!await launchUrl(uri)) {
      _snack('Could not start the call', error: true);
    }
  }

  // ----------------------------------------------------------------- filter

  List<FarmListing> get _filteredListings {
    final q = _search.text.trim().toLowerCase();
    return _listings.where((l) {
      switch (_listingFilter) {
        case 'pending':
          if (l.isPublished || l.isFulfilled) return false;
        case 'published':
          if (!l.isPublished || l.isFulfilled) return false;
        case 'fulfilled':
          if (!l.isFulfilled) return false;
      }
      if (q.isEmpty) return true;
      return l.produceName.toLowerCase().contains(q) ||
          l.farmerName.toLowerCase().contains(q) ||
          (l.farmerLocation ?? '').toLowerCase().contains(q) ||
          (l.notes ?? '').toLowerCase().contains(q);
    }).toList();
  }

  List<FarmOrder> get _filteredOrders {
    final q = _search.text.trim().toLowerCase();
    return _orders.where((o) {
      if (_orderFilter != 'all' && o.status != _orderFilter) return false;
      if (q.isEmpty) return true;
      return o.produceName.toLowerCase().contains(q) ||
          o.buyerName.toLowerCase().contains(q) ||
          o.buyerPhone.toLowerCase().contains(q) ||
          o.deliveryAddress.toLowerCase().contains(q);
    }).toList();
  }

  // ------------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    if (_loading && _listings.isEmpty && _orders.isEmpty && _error == null) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }

    return Scaffold(
      backgroundColor: DfColors.sand,
      // "New listing" is a tab of its own, so the FAB just jumps to it.
      floatingActionButton: _section == _FarmSection.create
          ? null
          : FloatingActionButton.extended(
              onPressed: () => setState(() => _section = _FarmSection.create),
              backgroundColor: DfColors.brand,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('New listing'),
            ),
      body: RefreshIndicator(
        color: DfColors.brand,
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
          children: [
            _header(),
            const SizedBox(height: 16),
            if (_error != null) ...[
              _errorCard(),
              const SizedBox(height: 16),
            ],
            _summaryRow(),
            const SizedBox(height: 14),
            _sectionSwitcher(),
            const SizedBox(height: 12),
            // Search and status filters only apply to the two list views.
            if (_section != _FarmSection.create) ...[
              TextField(
                controller: _search,
                decoration: InputDecoration(
                  hintText: _section == _FarmSection.listings
                      ? 'Search produce, farmer or location'
                      : 'Search buyer, produce or address',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  filled: true,
                  fillColor: Colors.white,
                  suffixIcon: _search.text.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () => _search.clear(),
                        ),
                ),
              ),
              const SizedBox(height: 10),
              _filterChips(),
              const SizedBox(height: 12),
            ],
            switch (_section) {
              _FarmSection.create => _createSection(),
              _FarmSection.listings => Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: _listingsSection(),
                ),
              _FarmSection.orders => Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: _ordersSection(),
                ),
            },
          ],
        ),
      ),
    );
  }

  /// Three tabs mirroring FarmersFriendHub.tsx: New listing / My listings /
  /// Orders. Scrolls horizontally so the labels never overflow on small phones.
  Widget _sectionSwitcher() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SegmentedButton<_FarmSection>(
        segments: [
          const ButtonSegment(
            value: _FarmSection.create,
            icon: Icon(Icons.add_circle_outline, size: 17),
            label: Text('New listing'),
          ),
          ButtonSegment(
            value: _FarmSection.listings,
            icon: const Icon(Icons.inventory_2_outlined, size: 17),
            label: Text('My listings (${_listings.length})'),
          ),
          ButtonSegment(
            value: _FarmSection.orders,
            icon: const Icon(Icons.receipt_long_outlined, size: 17),
            label: Text('Orders (${_orders.length})'),
          ),
        ],
        selected: {_section},
        showSelectedIcon: false,
        style: const ButtonStyle(
          visualDensity: VisualDensity(horizontal: -2, vertical: -2),
        ),
        onSelectionChanged: (s) => setState(() => _section = s.first),
      ),
    );
  }

  Widget _createSection() {
    if (_photoGated) {
      return const SizedBox.shrink();
    }
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: FarmListingFormSheet(
          key: const ValueKey('farm-create-inline'),
          embedded: true,
          onSaved: () {
            setState(() => _section = _FarmSection.listings);
            _load(forceRefresh: true);
          },
        ),
      ),
    );
  }

  Widget _header() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [DfColors.brand, DfColors.brandLight],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.eco_outlined, size: 30, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Farmers Friend',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Source produce from farms. Admin sets retail price — you earn commission when orders are delivered.',
                  style: TextStyle(fontSize: 12.5, color: Colors.white70, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorCard() {
    final warn = _photoGated;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: warn ? const Color(0xFFFFF7E6) : const Color(0xFFFDECEC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: warn ? const Color(0xFFF0C36D) : DfColors.danger.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            warn ? Icons.verified_user_outlined : Icons.error_outline,
            size: 20,
            color: warn ? const Color(0xFF8A6100) : DfColors.danger,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _error!,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: warn ? const Color(0xFF8A6100) : DfColors.danger,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow() {
    final published = _listings.where((l) => l.isPublished).length;
    final commission = _orders.fold<double>(0, (s, o) => s + o.agentCommission);
    return Row(
      children: [
        Expanded(child: _statCard('${_listings.length}', 'Listings', '$published published')),
        const SizedBox(width: 10),
        Expanded(child: _statCard('${_orders.length}', 'Orders', null)),
        const SizedBox(width: 10),
        Expanded(child: _statCard(_money.format(commission), 'Commission', null)),
      ],
    );
  }

  Widget _statCard(String value, String label, String? footnote) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          Text(label, style: const TextStyle(fontSize: 11, color: DfColors.muted)),
          if (footnote != null)
            Text(
              footnote,
              style: const TextStyle(fontSize: 10.5, color: DfColors.brandDark),
            ),
        ],
      ),
    );
  }

  Widget _filterChips() {
    final entries = _section == _FarmSection.listings
        ? _listingFilters.entries.toList()
        : [
            const MapEntry('all', 'All'),
            ...farmOrderStatusLabels.entries,
          ];
    final selected = _section == _FarmSection.listings ? _listingFilter : _orderFilter;

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: entries.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final e = entries[i];
          final isSelected = e.key == selected;
          return ChoiceChip(
            label: Text(e.value),
            selected: isSelected,
            labelStyle: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : DfColors.muted,
            ),
            selectedColor: DfColors.brand,
            backgroundColor: Colors.white,
            showCheckmark: false,
            onSelected: (_) => setState(() {
              if (_section == _FarmSection.listings) {
                _listingFilter = e.key;
              } else {
                _orderFilter = e.key;
              }
            }),
          );
        },
      ),
    );
  }

  // -------------------------------------------------------------- listings

  List<Widget> _listingsSection() {
    final listings = _filteredListings;
    if (listings.isEmpty) {
      return [
        _emptyState(
          Icons.grass_outlined,
          _listings.isEmpty ? 'No listings yet.' : 'No listings match your filters.',
          _listings.isEmpty
              ? 'Submit farm produce for admin pricing and it will appear here.'
              : 'Try a different status or clear the search.',
        ),
      ];
    }
    return listings.map(_listingCard).toList();
  }

  Widget _listingCard(FarmListing l) {
    final photos = l.photos.map(DisplayFormat.resolveImageUrl).where((e) => e.isNotEmpty).toList();
    final harvest = l.harvestDate == null ? null : DateTime.tryParse(l.harvestDate!);
    final statusColor = l.isFulfilled
        ? DfColors.muted
        : (l.isPublished ? DfColors.brand : const Color(0xFF8A6100));

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: photos.isEmpty
                    ? null
                    : () => FullScreenImageViewer.open(
                          context,
                          images: photos,
                          title: l.produceName,
                        ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: photos.isEmpty
                        ? _photoFallback()
                        : CachedNetworkImage(
                            imageUrl: photos.first,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(color: DfColors.sand),
                            errorWidget: (_, _, _) => _photoFallback(),
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
                      l.produceName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_qty(l.quantityAvailable)} ${l.unit} · Farmer ${_money.format(l.negotiatedPrice)}',
                      style: const TextStyle(fontSize: 12, color: DfColors.muted),
                    ),
                    Text(
                      'Retail ${_money.format(l.retailPrice)}'
                      '${l.adminMarkup > 0 ? ' (markup ${_money.format(l.adminMarkup)})' : ''}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: DfColors.brand,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _chip(l.statusLabel, statusColor),
                        _chip('${l.orderCount} orders', DfColors.muted),
                        if (photos.length > 1) _chip('${photos.length} photos', DfColors.muted),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _detailRow(Icons.person_outline, '${l.farmerName} · ${l.farmerPhone}'),
          if (l.farmerLocation != null) _detailRow(Icons.place_outlined, l.farmerLocation!),
          if (harvest != null) _detailRow(Icons.event_outlined, 'Harvest ${_date.format(harvest)}'),
          if (l.notes != null) _detailRow(Icons.notes_outlined, l.notes!),
          if (l.isEditable) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openForm(listing: l),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _delete(l),
                    style: OutlinedButton.styleFrom(foregroundColor: DfColors.danger),
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Delete'),
                  ),
                ),
              ],
            ),
          ] else ...[
            const SizedBox(height: 8),
            const Text(
              'Published listings cannot be edited. Contact admin to unpublish first.',
              style: TextStyle(fontSize: 11.5, color: DfColors.muted),
            ),
          ],
        ],
      ),
    );
  }

  String _qty(double v) => v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toString();

  // ---------------------------------------------------------------- orders

  List<Widget> _ordersSection() {
    final orders = _filteredOrders;
    if (orders.isEmpty) {
      return [
        _emptyState(
          Icons.receipt_long_outlined,
          _orders.isEmpty ? 'No orders yet.' : 'No orders match your filters.',
          _orders.isEmpty
              ? 'Orders appear here once buyers purchase your published produce.'
              : 'Try a different status or clear the search.',
        ),
      ];
    }
    return orders.map(_orderCard).toList();
  }

  Widget _orderCard(FarmOrder o) {
    final created = o.createdAt == null ? null : DateTime.tryParse(o.createdAt!);
    final statusColor = switch (o.status) {
      'delivered' => DfColors.brand,
      'cancelled' => DfColors.danger,
      'out_for_delivery' || 'picked_up' => const Color(0xFF1D4ED8),
      _ => const Color(0xFF8A6100),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  o.produceName,
                  style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
              _chip(o.statusLabel, statusColor),
            ],
          ),
          const SizedBox(height: 8),
          _detailRow(Icons.person_outline, '${o.buyerName} · ${o.buyerPhone}'),
          if (o.buyerEmail != null) _detailRow(Icons.mail_outline, o.buyerEmail!),
          _detailRow(Icons.place_outlined, o.deliveryAddress),
          _detailRow(
            Icons.scale_outlined,
            '${_qty(o.quantityOrdered)} ${o.unit} ordered',
          ),
          if (created != null) _detailRow(Icons.schedule, _date.format(created)),
          if (o.paystackReference != null)
            _detailRow(Icons.tag, 'Ref ${o.paystackReference}'),
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paid ${_money.format(o.totalPrice)}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    if (o.deliveryFee > 0)
                      Text(
                        'incl. delivery ${_money.format(o.deliveryFee)}',
                        style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Commission ${_money.format(o.agentCommission)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: DfColors.brand,
                    ),
                  ),
                  Text(
                    o.commissionCredited ? 'Credited to wallet' : 'Credited on delivery',
                    style: const TextStyle(fontSize: 11, color: DfColors.muted),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _callBuyer(o.buyerPhone),
                  icon: const Icon(Icons.call_outlined, size: 16),
                  label: const Text('Call buyer'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Order status is updated by admin as delivery progresses.',
            style: TextStyle(fontSize: 11, color: DfColors.muted),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- shared

  Widget _detailRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(icon, size: 14, color: DfColors.muted),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.35),
            ),
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

  Widget _photoFallback() => Container(
        color: DfColors.brand.withValues(alpha: 0.08),
        child: const Icon(Icons.image_outlined, color: DfColors.muted),
      );

  Widget _emptyState(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, size: 34, color: DfColors.muted),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.4),
          ),
        ],
      ),
    );
  }
}

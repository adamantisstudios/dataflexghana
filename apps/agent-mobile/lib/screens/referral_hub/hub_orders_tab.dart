import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class HubOrdersTab extends StatefulWidget {
  const HubOrdersTab({super.key});

  @override
  State<HubOrdersTab> createState() => _HubOrdersTabState();
}

class _HubOrdersTabState extends State<HubOrdersTab> {
  List<Map<String, dynamic>> _storefrontOrders = [];
  List<Map<String, dynamic>> _adOrders = [];
  double _commissionBalance = 0;
  Map<String, dynamic>? _pendingPayout;
  bool _loading = true;
  bool _requestingPayout = false;
  String? _error;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);

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

  double _num(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.getStoreSettings(),
        ApiClient.instance.getStorefrontOrders(limit: 30),
        ApiClient.instance.getAdvertisingOrders(limit: 30),
      ]);

      final settings = results[0];
      final sf = results[1]['orders'];
      final ads = results[2]['orders'];

      setState(() {
        _commissionBalance = _num(settings['storefront_commission_balance']);
        final pending = settings['pending_storefront_payout'];
        _pendingPayout = pending is Map ? Map<String, dynamic>.from(pending) : null;
        _storefrontOrders = sf is List
            ? sf.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _adOrders = ads is List
            ? ads.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestPayout() async {
    setState(() => _requestingPayout = true);
    try {
      final data = await ApiClient.instance.requestStorefrontPayout();
      final nested = data['data'];
      final msg = nested is Map
          ? nested['message']?.toString()
          : data['message']?.toString();
      _snack(msg ?? 'Payout requested');
      await _load();
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _requestingPayout = false);
    }
  }

  String _fmtDate(Object? raw) {
    if (raw == null) return '';
    final dt = DateTime.tryParse(raw.toString());
    if (dt == null) return '';
    return DateFormat('dd MMM yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _storefrontOrders.isEmpty && _adOrders.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }

    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
            ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [DfColors.brandDark, DfColors.brand],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Storefront commission',
                  style: GoogleFonts.outfit(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  _money.format(_commissionBalance),
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (_pendingPayout != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Pending payout: ${_money.format(_num(_pendingPayout!['amount']))} (${_pendingPayout!['status']})',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: DfColors.brandDark,
                    ),
                    onPressed: (_requestingPayout || _pendingPayout != null || _commissionBalance <= 0)
                        ? null
                        : _requestPayout,
                    child: _requestingPayout
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                          )
                        : const Text('Request payout'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Storefront orders',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (_storefrontOrders.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No storefront orders', style: TextStyle(color: DfColors.muted))),
            )
          else
            ..._storefrontOrders.map((o) => _orderTile(
                  title: o['customer_name']?.toString() ??
                      o['buyer_name']?.toString() ??
                      o['item_name']?.toString() ??
                      'Order',
                  subtitle:
                      '${o['status'] ?? '—'} · ${_money.format(_num(o['total_amount'] ?? o['amount'] ?? o['total_paid']))}',
                  trailing: _fmtDate(o['created_at']),
                )),
          const SizedBox(height: 20),
          Text(
            'Advertising orders',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (_adOrders.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No advertising orders', style: TextStyle(color: DfColors.muted))),
            )
          else
            ..._adOrders.map((o) => _orderTile(
                  title: o['package_name']?.toString() ?? o['customer_name']?.toString() ?? 'Ad order',
                  subtitle:
                      '${o['status'] ?? '—'} · ${_money.format(_num(o['total_paid']))} · ${o['customer_name'] ?? ''}',
                  trailing: _fmtDate(o['created_at']),
                )),
        ],
      ),
    );
  }

  Widget _orderTile({
    required String title,
    required String subtitle,
    required String trailing,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
        trailing: Text(trailing, style: const TextStyle(fontSize: 11, color: DfColors.muted)),
      ),
    );
  }
}

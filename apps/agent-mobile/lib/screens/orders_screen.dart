import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  String _status = 'all';
  String _provider = 'all';
  final _search = TextEditingController();
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  String? _error;

  static const statuses = ['all', 'pending', 'processing', 'completed', 'canceled', 'failed'];
  static const providers = ['all', 'MTN', 'AirtelTigo', 'Telecel'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = true}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.listDataOrders(
        status: _status,
        provider: _provider,
        search: _search.text,
        forceRefresh: force,
      );
      final list = data['orders'];
      setState(() {
        _orders = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Map<String, dynamic>? _bundle(Map<String, dynamic> order) {
    final b = order['data_bundles'];
    if (b is List && b.isNotEmpty && b.first is Map) {
      return Map<String, dynamic>.from(b.first as Map);
    }
    if (b is Map) return Map<String, dynamic>.from(b);
    return null;
  }

  Color _statusColor(String? s) {
    switch (s) {
      case 'completed':
        return DfColors.brand;
      case 'processing':
        return const Color(0xFF1565C0);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'canceled':
      case 'failed':
        return DfColors.danger;
      default:
        return DfColors.muted;
    }
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete order?'),
        content: const Text('This cannot be undone. Processing orders cannot be deleted.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ApiClient.instance.deleteDataOrder(id);
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: TextField(
            controller: _search,
            decoration: InputDecoration(
              hintText: 'Search phone, ref, bundle…',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_forward),
                onPressed: () => _load(),
              ),
            ),
            onSubmitted: (_) => _load(),
          ),
        ),
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: [
              ...statuses.map((s) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s),
                      selected: _status == s,
                      onSelected: (_) {
                        setState(() => _status = s);
                        _load();
                      },
                    ),
                  )),
            ],
          ),
        ),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: providers
                .map(
                  (p) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(p),
                      selected: _provider == p,
                      onSelected: (_) {
                        setState(() => _provider = p);
                        _load();
                      },
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        if (_loading) const Expanded(child: Center(child: CircularProgressIndicator(color: DfColors.brand))),
        if (!_loading && _error != null)
          Expanded(child: Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))),
        if (!_loading && _error == null)
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(force: true),
              color: DfColors.brand,
              child: _orders.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No orders yet', style: TextStyle(color: DfColors.muted))),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: _orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final o = _orders[i];
                        final bundle = _bundle(o);
                        final status = o['status']?.toString() ?? '';
                        final created = DateTime.tryParse(o['created_at']?.toString() ?? '');
                        final fmt = created == null
                            ? ''
                            : DateFormat('dd MMM · HH:mm').format(created.toLocal());
                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: DfColors.brand.withValues(alpha: 0.08)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        bundle?['name']?.toString() ?? 'Data order',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _statusColor(status).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          color: _statusColor(status),
                                          fontWeight: FontWeight.w800,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${bundle?['provider'] ?? '-'} · ${o['recipient_phone']}',
                                  style: const TextStyle(color: DfColors.muted, fontSize: 13),
                                ),
                                Text(
                                  'Ref ${o['payment_reference']} · ${o['payment_method'] ?? '-'}',
                                  style: const TextStyle(color: DfColors.muted, fontSize: 12),
                                ),
                                if (fmt.isNotEmpty)
                                  Text(fmt, style: const TextStyle(color: DfColors.muted, fontSize: 11)),
                                if ((o['admin_message']?.toString() ?? '').isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: DfColors.sand,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      o['admin_message'].toString(),
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ],
                                if (status != 'processing')
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () => _delete(o['id'].toString()),
                                      child: const Text('Delete', style: TextStyle(color: DfColors.danger)),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
      ],
    );

    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: body,
    );
  }
}

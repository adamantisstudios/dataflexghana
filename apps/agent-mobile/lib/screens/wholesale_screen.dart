import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class WholesaleScreen extends StatefulWidget {
  const WholesaleScreen({super.key});

  @override
  State<WholesaleScreen> createState() => _WholesaleScreenState();
}

class _WholesaleScreenState extends State<WholesaleScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _orders = [];
  final Map<String, int> _cartQty = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final productsRes = await ApiClient.instance.getWholesaleCatalog(limit: 50);
      final ordersRes = await ApiClient.instance.getWholesaleOrders();
      setState(() {
        _products = (productsRes['products'] is List)
            ? (productsRes['products'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _orders = (ordersRes['orders'] is List)
            ? (ordersRes['orders'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  List<MapEntry<String, int>> get _cartEntries =>
      _cartQty.entries.where((e) => e.value > 0).toList();

  double get _cartTotal {
    var t = 0.0;
    for (final e in _cartEntries) {
      Map<String, dynamic>? p;
      for (final x in _products) {
        if (x['id']?.toString() == e.key) {
          p = x;
          break;
        }
      }
      if (p != null) t += _n(p['price']) * e.value;
    }
    return t;
  }

  Future<void> _checkout() async {
    if (_cartEntries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty')));
      return;
    }
    final agent = await SessionStore.instance.getAgent();
    final addressCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: agent?['phone_number']?.toString() ?? '');
    final refCtrl = TextEditingController();
    var payMethod = 'wallet';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Checkout'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Total: GHS ${_cartTotal.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Delivery address')),
                const SizedBox(height: 8),
                TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Delivery phone')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: payMethod,
                  decoration: const InputDecoration(labelText: 'Payment'),
                  items: const [
                    DropdownMenuItem(value: 'wallet', child: Text('Wallet')),
                    DropdownMenuItem(value: 'manual', child: Text('Manual MoMo')),
                  ],
                  onChanged: (v) => setLocal(() => payMethod = v ?? 'wallet'),
                ),
                if (payMethod == 'manual') ...[
                  const SizedBox(height: 8),
                  TextField(controller: refCtrl, decoration: const InputDecoration(labelText: 'Payment reference')),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Place order')),
          ],
        ),
      ),
    );

    if (ok != true) return;
    if (addressCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Address and phone required')));
      return;
    }

    final items = <Map<String, dynamic>>[];
    var totalCommission = 0.0;
    for (final e in _cartEntries) {
      final p = _products.firstWhere((x) => x['id']?.toString() == e.key);
      final unit = _n(p['price']);
      final commission = _n(p['commission_value']);
      totalCommission += commission * e.value;
      items.add({
        'product_id': e.key,
        'quantity': e.value,
        'unit_price': unit,
        'commission_per_item': commission,
      });
    }

    try {
      await ApiClient.instance.wholesaleCheckout(
        items: items,
        paymentMethod: payMethod,
        deliveryAddress: addressCtrl.text.trim(),
        deliveryPhone: phoneCtrl.text.trim(),
        totalAmount: _cartTotal,
        totalCommission: totalCommission,
        paymentReference: payMethod == 'manual' ? refCtrl.text.trim() : null,
      );
      if (!mounted) return;
      setState(() => _cartQty.clear());
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed')));
      await _load();
      _tabs.animateTo(1);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wholesale'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'Products'), Tab(text: 'My orders')],
        ),
        actions: [
          if (_cartEntries.isNotEmpty)
            TextButton(
              onPressed: _checkout,
              child: Text('Cart (${_cartEntries.length})', style: const TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : TabBarView(
              controller: _tabs,
              children: [
                RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _error != null
                      ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                      : _products.isEmpty
                          ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No products available'))])
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _products.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, i) {
                                final p = _products[i];
                                final id = p['id']?.toString() ?? '';
                                final qty = _cartQty[id] ?? 0;
                                final imgs = p['image_urls'];
                                final img = imgs is List && imgs.isNotEmpty ? imgs.first.toString() : '';
                                return Card(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(10),
                                          child: img.isEmpty
                                              ? Container(width: 72, height: 72, color: Colors.black12, child: const Icon(Icons.inventory_2))
                                              : CachedNetworkImage(
                                                  imageUrl: DisplayFormat.resolveImageUrl(img),
                                                  width: 72,
                                                  height: 72,
                                                  fit: BoxFit.cover,
                                                ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(p['name']?.toString() ?? 'Product',
                                                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                              Text(
                                                'GHS ${_n(p['price']).toStringAsFixed(2)} · Stock ${_n(p['quantity']).toInt()}',
                                                style: const TextStyle(color: DfColors.muted, fontSize: 13),
                                              ),
                                              if (_n(p['commission_value']) > 0)
                                                Text(
                                                  'Commission GHS ${_n(p['commission_value']).toStringAsFixed(2)}/unit',
                                                  style: const TextStyle(color: DfColors.brandDark, fontSize: 12),
                                                ),
                                              Row(
                                                children: [
                                                  IconButton(
                                                    onPressed: qty <= 0
                                                        ? null
                                                        : () => setState(() => _cartQty[id] = qty - 1),
                                                    icon: const Icon(Icons.remove_circle_outline),
                                                  ),
                                                  Text('$qty', style: const TextStyle(fontWeight: FontWeight.w700)),
                                                  IconButton(
                                                    onPressed: () => setState(() => _cartQty[id] = qty + 1),
                                                    icon: const Icon(Icons.add_circle_outline),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                ),
                RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _orders.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No wholesale orders yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _orders.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final o = _orders[i];
                            final prod = o['wholesale_products'];
                            final name = prod is Map ? prod['name']?.toString() : null;
                            final when = o['created_at']?.toString();
                            String date = '—';
                            if (when != null) {
                              final d = DateTime.tryParse(when);
                              if (d != null) date = DateFormat.yMMMd().format(d.toLocal());
                            }
                            return Card(
                              child: ListTile(
                                title: Text(name ?? 'Order', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                subtitle: Text(
                                  '${o['status'] ?? '—'} · Qty ${o['quantity']} · GHS ${_n(o['total_amount']).toStringAsFixed(2)}\n$date',
                                ),
                                isThreeLine: true,
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
      floatingActionButton: _cartEntries.isEmpty
          ? null
          : FloatingActionButton.extended(
              onPressed: _checkout,
              backgroundColor: DfColors.brand,
              label: Text('Checkout GHS ${_cartTotal.toStringAsFixed(2)}'),
              icon: const Icon(Icons.shopping_cart_checkout),
            ),
    );
  }
}

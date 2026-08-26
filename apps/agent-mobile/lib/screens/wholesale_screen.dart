import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

/// Mirrors the website /agent/wholesale experience: Browse, Cart, Orders with
/// search + category + price filters, image galleries and wallet checkout.
class WholesaleScreen extends StatefulWidget {
  const WholesaleScreen({super.key});

  @override
  State<WholesaleScreen> createState() => _WholesaleScreenState();
}

class _CartLine {
  _CartLine({required this.product, required this.quantity});

  final Map<String, dynamic> product;
  int quantity;

  String get id => product['id']?.toString() ?? '';
}

const _priceBands = <String, String>{
  'all': 'Any price',
  'under50': 'Under GHS 50',
  '50-200': 'GHS 50 – 200',
  '200-500': 'GHS 200 – 500',
  'over500': 'Over GHS 500',
};

const _orderStatuses = ['All', 'pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

class _WholesaleScreenState extends State<WholesaleScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  final _search = TextEditingController();
  final _orderSearch = TextEditingController();

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _orders = [];
  List<String> _categories = ['All'];
  final Map<String, _CartLine> _cart = {};

  String _category = 'All';
  String _priceBand = 'all';
  String _orderStatus = 'All';
  int _page = 1;
  int _totalPages = 1;
  double _wallet = 0;
  String _agentPhone = '';

  bool _loading = true;
  bool _placing = false;
  String? _error;
  String? _notice;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    _orderSearch.dispose();
    super.dispose();
  }

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  List<String> _imagesOf(Map<String, dynamic> p) {
    final out = <String>[];
    final urls = p['image_urls'];
    if (urls is List) {
      for (final u in urls) {
        final s = u?.toString() ?? '';
        if (s.isNotEmpty) out.add(DisplayFormat.resolveImageUrl(s));
      }
    }
    return out;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final catalog = await ApiClient.instance.getWholesaleCatalog(
        search: _search.text.trim(),
        category: _category,
        price: _priceBand,
        page: _page,
        limit: 12,
      );
      final orders = await ApiClient.instance.getWholesaleOrders();
      if (!mounted) return;
      setState(() {
        _products = (catalog['products'] is List)
            ? (catalog['products'] as List)
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
            : [];
        _orders = (orders['orders'] is List)
            ? (orders['orders'] as List)
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
            : [];
        final cats = catalog['categories'];
        if (cats is List && cats.isNotEmpty) {
          _categories = ['All', ...cats.map((c) => c.toString())];
        }
        final pagination = catalog['pagination'];
        if (pagination is Map) {
          _totalPages = (pagination['totalPages'] is num)
              ? (pagination['totalPages'] as num).toInt().clamp(1, 9999)
              : 1;
        }
        final agent = catalog['agent'];
        if (agent is Map) {
          _wallet = _n(agent['wallet_balance']);
          _agentPhone = agent['phone_number']?.toString() ?? _agentPhone;
        }
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    setState(() => _page = 1);
    _load();
  }

  int get _cartCount => _cart.values.fold(0, (sum, l) => sum + l.quantity);

  double get _cartTotal =>
      _cart.values.fold(0.0, (sum, l) => sum + _n(l.product['price']) * l.quantity);

  double get _cartCommission =>
      _cart.values.fold(0.0, (sum, l) => sum + _n(l.product['commission_value']) * l.quantity);

  void _addToCart(Map<String, dynamic> product, int quantity) {
    final id = product['id']?.toString() ?? '';
    if (id.isEmpty || quantity <= 0) return;
    final stock = _n(product['quantity']).toInt();
    setState(() {
      final existing = _cart[id];
      final next = (existing?.quantity ?? 0) + quantity;
      _cart[id] = _CartLine(
        product: product,
        quantity: stock > 0 ? next.clamp(1, stock) : next,
      );
    });
    _tabs.animateTo(1);
  }

  void _setQuantity(String id, int quantity) {
    setState(() {
      if (quantity <= 0) {
        _cart.remove(id);
      } else {
        final line = _cart[id];
        if (line != null) {
          final stock = _n(line.product['quantity']).toInt();
          line.quantity = stock > 0 ? quantity.clamp(1, stock) : quantity;
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Wholesale Orders'),
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            const Tab(text: 'Browse'),
            Tab(text: 'Cart${_cartCount > 0 ? ' ($_cartCount)' : ''}'),
            const Tab(text: 'Orders'),
          ],
        ),
        actions: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _money.format(_wallet),
                style: const TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_notice != null)
            Container(
              width: double.infinity,
              color: DfColors.brand.withValues(alpha: 0.12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: DfColors.brand, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_notice!,
                        style: const TextStyle(color: DfColors.brandDark, fontSize: 12.5)),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () => setState(() => _notice = null),
                    icon: const Icon(Icons.close, size: 16),
                  ),
                ],
              ),
            ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [_buildBrowse(), _buildCart(), _buildOrders()],
            ),
          ),
        ],
      ),
      floatingActionButton: (_tabs.index == 0 && _cartCount > 0)
          ? FloatingActionButton.extended(
              onPressed: () => _tabs.animateTo(1),
              backgroundColor: DfColors.brand,
              icon: const Icon(Icons.shopping_cart_checkout),
              label: Text('Cart · ${_money.format(_cartTotal)}'),
            )
          : null,
    );
  }

  // ── Browse ────────────────────────────────────────────────────────────────

  Widget _buildBrowse() {
    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        children: [
          TextField(
            controller: _search,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _applyFilters(),
            decoration: InputDecoration(
              hintText: 'Search products…',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_forward),
                onPressed: _applyFilters,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _categories.contains(_category) ? _category : 'All',
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  items: _categories
                      .map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _category = v ?? 'All');
                    _applyFilters();
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _priceBand,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Price',
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  items: _priceBands.entries
                      .map((e) => DropdownMenuItem(
                            value: e.key,
                            child: Text(e.value, overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _priceBand = v ?? 'all');
                    _applyFilters();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 80),
              child: Center(child: CircularProgressIndicator(color: DfColors.brand)),
            )
          else if (_error != null)
            _ErrorBox(message: _error!, onRetry: _load)
          else if (_products.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 70),
              child: Column(
                children: [
                  Icon(Icons.inventory_2_outlined, size: 44, color: DfColors.muted),
                  SizedBox(height: 10),
                  Text('No products found', style: TextStyle(fontWeight: FontWeight.w700)),
                  SizedBox(height: 4),
                  Text(
                    'Try adjusting your search criteria or check back later.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: DfColors.muted, fontSize: 12.5),
                  ),
                ],
              ),
            )
          else ...[
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _products.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                mainAxisExtent: 262,
              ),
              itemBuilder: (_, i) => _productCard(_products[i]),
            ),
            if (_totalPages > 1) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  OutlinedButton.icon(
                    onPressed: _page <= 1
                        ? null
                        : () {
                            setState(() => _page -= 1);
                            _load();
                          },
                    icon: const Icon(Icons.chevron_left, size: 18),
                    label: const Text('Previous'),
                  ),
                  Text('Page $_page / $_totalPages',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  OutlinedButton.icon(
                    onPressed: _page >= _totalPages
                        ? null
                        : () {
                            setState(() => _page += 1);
                            _load();
                          },
                    icon: const Icon(Icons.chevron_right, size: 18),
                    label: const Text('Next'),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _productCard(Map<String, dynamic> p) {
    final images = _imagesOf(p);
    final commission = _n(p['commission_value']);
    final stock = _n(p['quantity']).toInt();

    return Card(
      margin: EdgeInsets.zero,
      elevation: 2,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => _openProduct(p),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 104,
                  width: double.infinity,
                  child: images.isEmpty
                      ? Container(
                          color: DfColors.sand,
                          child: const Icon(Icons.inventory_2_outlined, color: DfColors.muted, size: 32),
                        )
                      : CachedNetworkImage(
                          imageUrl: images.first,
                          fit: BoxFit.cover,
                          placeholder: (_, _) => Container(color: DfColors.sand),
                          errorWidget: (_, _, _) => Container(
                            color: DfColors.sand,
                            child: const Icon(Icons.image_not_supported_outlined),
                          ),
                        ),
                ),
                if (images.length > 1)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('+${images.length - 1}',
                          style: const TextStyle(color: Colors.white, fontSize: 10.5)),
                    ),
                  ),
                if (stock <= 0)
                  Positioned(
                    left: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: DfColors.danger,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('Out of stock',
                          style: TextStyle(color: Colors.white, fontSize: 10)),
                    ),
                  ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p['name']?.toString() ?? 'Product',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 13.5, height: 1.2),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      p['category']?.toString() ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: DfColors.muted, fontSize: 11),
                    ),
                    const Spacer(),
                    Text(
                      _money.format(_n(p['price'])),
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 15),
                    ),
                    if (commission > 0)
                      Text(
                        '+${_money.format(commission)} commission',
                        style: const TextStyle(color: DfColors.brand, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 32,
                      child: ElevatedButton.icon(
                        onPressed: stock <= 0 ? null : () => _openProduct(p),
                        icon: const Icon(Icons.add_shopping_cart, size: 15),
                        label: const Text('Add', style: TextStyle(fontSize: 12.5)),
                        style: ElevatedButton.styleFrom(padding: EdgeInsets.zero),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openProduct(Map<String, dynamic> p) async {
    final images = _imagesOf(p);
    var quantity = 1;
    final stock = _n(p['quantity']).toInt();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.82,
          maxChildSize: 0.95,
          builder: (_, controller) => ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.black12,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (images.isNotEmpty)
                SizedBox(
                  height: 210,
                  child: PageView.builder(
                    itemCount: images.length,
                    itemBuilder: (_, i) => ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(imageUrl: images[i], fit: BoxFit.cover),
                    ),
                  ),
                ),
              if (images.length > 1)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Swipe to view the full gallery',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: DfColors.muted, fontSize: 11.5)),
                ),
              const SizedBox(height: 14),
              Text(p['name']?.toString() ?? 'Product',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 21)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Pill(label: p['category']?.toString() ?? 'Uncategorised'),
                  _Pill(label: 'Stock: $stock'),
                  if (_n(p['commission_value']) > 0)
                    _Pill(
                      label: '+${_money.format(_n(p['commission_value']))} commission',
                      color: DfColors.brand,
                    ),
                  if ((p['delivery_time']?.toString() ?? '').isNotEmpty)
                    _Pill(label: p['delivery_time'].toString()),
                ],
              ),
              const SizedBox(height: 12),
              Text(_money.format(_n(p['price'])),
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 24, color: DfColors.brandDark)),
              if ((p['description']?.toString() ?? '').isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(p['description'].toString(),
                    style: const TextStyle(height: 1.5, color: DfColors.muted, fontSize: 13.5)),
              ],
              const SizedBox(height: 18),
              Row(
                children: [
                  const Text('Quantity', style: TextStyle(fontWeight: FontWeight.w700)),
                  const Spacer(),
                  IconButton(
                    onPressed: quantity <= 1 ? null : () => setLocal(() => quantity -= 1),
                    icon: const Icon(Icons.remove_circle_outline),
                  ),
                  Text('$quantity',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
                  IconButton(
                    onPressed: (stock > 0 && quantity >= stock)
                        ? null
                        : () => setLocal(() => quantity += 1),
                    icon: const Icon(Icons.add_circle_outline),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: stock <= 0
                    ? null
                    : () {
                        Navigator.pop(ctx);
                        _addToCart(p, quantity);
                      },
                icon: const Icon(Icons.add_shopping_cart),
                label: Text(
                  stock <= 0
                      ? 'Out of stock'
                      : 'Add ${_money.format(_n(p['price']) * quantity)} to cart',
                ),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Cart ──────────────────────────────────────────────────────────────────

  Widget _buildCart() {
    if (_cart.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 70),
          const Icon(Icons.shopping_cart_outlined, size: 52, color: DfColors.muted),
          const SizedBox(height: 12),
          const Center(
            child: Text('Your cart is empty', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          ),
          const SizedBox(height: 6),
          const Center(
            child: Text('Add products from the Browse tab to get started.',
                textAlign: TextAlign.center, style: TextStyle(color: DfColors.muted, fontSize: 13)),
          ),
          const SizedBox(height: 18),
          Center(
            child: OutlinedButton(
              onPressed: () => _tabs.animateTo(0),
              child: const Text('Browse products'),
            ),
          ),
        ],
      );
    }

    final lines = _cart.values.toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        ...lines.map((line) {
          final images = _imagesOf(line.product);
          final unit = _n(line.product['price']);
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 62,
                      height: 62,
                      child: images.isEmpty
                          ? Container(color: DfColors.sand, child: const Icon(Icons.inventory_2_outlined))
                          : CachedNetworkImage(imageUrl: images.first, fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(line.product['name']?.toString() ?? 'Product',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14)),
                        Text('${_money.format(unit)} each',
                            style: const TextStyle(color: DfColors.muted, fontSize: 12)),
                        Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              onPressed: () => _setQuantity(line.id, line.quantity - 1),
                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                            ),
                            Text('${line.quantity}',
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              onPressed: () => _setQuantity(line.id, line.quantity + 1),
                              icon: const Icon(Icons.add_circle_outline, size: 20),
                            ),
                            const Spacer(),
                            Text(_money.format(unit * line.quantity),
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              _summaryRow('Items', '$_cartCount'),
              _summaryRow('Order total', _money.format(_cartTotal), bold: true),
              _summaryRow('Your commission', _money.format(_cartCommission), color: DfColors.brand),
              const Divider(height: 22),
              _summaryRow('Wallet balance', _money.format(_wallet)),
              if (_wallet < _cartTotal)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFDBA74)),
                    ),
                    child: Text(
                      'Insufficient wallet balance. You need ${_money.format(_cartTotal - _wallet)} '
                      'more to pay from your wallet — use manual MoMo instead.',
                      style: const TextStyle(fontSize: 12, height: 1.4, color: Color(0xFF9A3412)),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ElevatedButton.icon(
          onPressed: _placing ? null : _checkout,
          icon: _placing
              ? const SizedBox(
                  width: 18, height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.shopping_cart_checkout),
          label: Text(_placing ? 'Placing order…' : 'Checkout ${_money.format(_cartTotal)}'),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 15)),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => setState(_cart.clear),
          child: const Text('Clear cart'),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: DfColors.muted, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              fontSize: bold ? 16 : 13.5,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _checkout() async {
    final agent = await SessionStore.instance.getAgent();
    if (!mounted) return;
    final addressCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(
      text: _agentPhone.isNotEmpty ? _agentPhone : (agent?['phone_number']?.toString() ?? ''),
    );
    final refCtrl = TextEditingController();
    // Wallet is not selectable when the balance cannot cover the order.
    var method = _wallet >= _cartTotal ? 'wallet' : 'manual';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Checkout'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Total ${_money.format(_cartTotal)}',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
                Text('Commission ${_money.format(_cartCommission)}',
                    style: const TextStyle(color: DfColors.brand, fontSize: 12.5)),
                const SizedBox(height: 14),
                TextField(
                  controller: addressCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Delivery address *',
                    hintText: 'Enter delivery address',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Delivery phone *',
                    hintText: 'Enter delivery phone',
                  ),
                ),
                const SizedBox(height: 12),
                RadioGroup<String>(
                  groupValue: method,
                  onChanged: (v) => setLocal(() => method = v ?? method),
                  child: Column(
                    children: [
                      RadioListTile<String>(
                        value: 'wallet',
                        contentPadding: EdgeInsets.zero,
                        enabled: _wallet >= _cartTotal,
                        title: Text('Wallet balance (${_money.format(_wallet)})',
                            style: const TextStyle(fontSize: 13.5)),
                      ),
                      const RadioListTile<String>(
                        value: 'manual',
                        contentPadding: EdgeInsets.zero,
                        title: Text('Manual MoMo payment', style: TextStyle(fontSize: 13.5)),
                      ),
                    ],
                  ),
                ),
                if (method == 'manual')
                  TextField(
                    controller: refCtrl,
                    decoration: const InputDecoration(labelText: 'Payment code / reference'),
                  ),
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

    if (confirmed != true || !mounted) return;
    if (addressCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Delivery address and phone are required')),
      );
      return;
    }

    setState(() => _placing = true);
    try {
      final items = _cart.values
          .map((l) => {
                'product_id': l.id,
                'quantity': l.quantity,
                'unit_price': _n(l.product['price']),
                'commission_per_item': _n(l.product['commission_value']),
              })
          .toList();

      await ApiClient.instance.wholesaleCheckout(
        items: items,
        paymentMethod: method,
        deliveryAddress: addressCtrl.text.trim(),
        deliveryPhone: phoneCtrl.text.trim(),
        totalAmount: _cartTotal,
        totalCommission: _cartCommission,
        paymentReference: method == 'manual' && refCtrl.text.trim().isNotEmpty
            ? refCtrl.text.trim()
            : null,
      );
      if (!mounted) return;
      setState(() {
        _cart.clear();
        _notice = 'Order placed successfully! Track it in the Orders tab.';
      });
      await _load();
      if (mounted) _tabs.animateTo(2);
    } on ApiException catch (e) {
      if (!mounted) return;
      final message = e.message.toLowerCase().contains('insufficient')
          ? 'Insufficient wallet balance. Top up or pay with manual MoMo.'
          : e.message;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  Widget _buildOrders() {
    final query = _orderSearch.text.trim().toLowerCase();
    final filtered = _orders.where((o) {
      if (_orderStatus != 'All' && (o['status']?.toString() ?? '') != _orderStatus) return false;
      if (query.isEmpty) return true;
      final prod = o['wholesale_products'];
      final name = prod is Map ? (prod['name']?.toString() ?? '') : '';
      return name.toLowerCase().contains(query) ||
          (o['id']?.toString().toLowerCase().contains(query) ?? false);
    }).toList();

    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          TextField(
            controller: _orderSearch,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'Search your orders…',
              prefixIcon: Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _orderStatuses.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final s = _orderStatuses[i];
                return ChoiceChip(
                  label: Text(s == 'All' ? 'All' : _titleCase(s), style: const TextStyle(fontSize: 12)),
                  selected: _orderStatus == s,
                  selectedColor: DfColors.brand.withValues(alpha: 0.2),
                  onSelected: (_) => setState(() => _orderStatus = s),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          if (filtered.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 60),
              child: Center(
                child: Text('No wholesale orders yet', style: TextStyle(color: DfColors.muted)),
              ),
            )
          else
            ...filtered.map(_orderCard),
        ],
      ),
    );
  }

  Widget _orderCard(Map<String, dynamic> o) {
    final prod = o['wholesale_products'];
    final name = prod is Map ? (prod['name']?.toString() ?? 'Order') : 'Order';
    final status = o['status']?.toString() ?? 'pending';
    final when = DateTime.tryParse(o['created_at']?.toString() ?? '');
    final commission = _n(o['commission_amount']);
    final images = prod is Map ? _imagesOf(Map<String, dynamic>.from(prod)) : <String>[];

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
                width: 54,
                height: 54,
                child: images.isEmpty
                    ? Container(color: DfColors.sand, child: const Icon(Icons.receipt_long_outlined))
                    : CachedNetworkImage(imageUrl: images.first, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _StatusBadge(status: status),
                      _Pill(label: 'Qty ${o['quantity'] ?? 1}'),
                      _Pill(label: (o['payment_method']?.toString() ?? 'wallet')),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_money.format(_n(o['total_amount']))}'
                    '${commission > 0 ? '  ·  +${_money.format(commission)} commission' : ''}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12.5),
                  ),
                  if (when != null)
                    Text(DateFormat.yMMMd().add_jm().format(when.toLocal()),
                        style: const TextStyle(color: DfColors.muted, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _titleCase(String s) =>
      s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1).replaceAll('_', ' ')}';
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? DfColors.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'delivered' || 'completed' => DfColors.brand,
      'cancelled' || 'rejected' => DfColors.danger,
      'processing' || 'confirmed' => const Color(0xFF2563EB),
      _ => const Color(0xFFCA8A04),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.isEmpty ? 'Pending' : '${status[0].toUpperCase()}${status.substring(1)}',
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: DfColors.danger, size: 40),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

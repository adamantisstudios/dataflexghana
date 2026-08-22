import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';
import 'fashion_product_screen.dart';

class FashionScreen extends StatefulWidget {
  const FashionScreen({super.key});

  @override
  State<FashionScreen> createState() => _FashionScreenState();
}

class _FashionScreenState extends State<FashionScreen> {
  final _search = TextEditingController();
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _products = [];
  String _assetBase = 'https://www.dataflexghana.com';
  String _selectedCategory = '';
  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  bool _fromCache = false;
  int _heroIndex = 0;

  @override
  void initState() {
    super.initState();
    _bootstrap(force: false);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _bootstrap({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
      _page = 1;
    });
    try {
      final catData = await ApiClient.instance.fashionCategories(
        forceRefresh: force,
        onUpdated: (fresh) {
          if (!mounted) return;
          setState(() {
            _categories = _parseCategories(fresh);
            _assetBase = fresh['asset_base_url']?.toString() ?? _assetBase;
          });
        },
      );
      if (!mounted) return;
      setState(() {
        _categories = _parseCategories(catData);
        _assetBase = catData['asset_base_url']?.toString() ?? _assetBase;
      });
      await _loadProducts(force: force, page: 1);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _parseCategories(Map<String, dynamic> data) {
    if (data['categories'] is! List) return [];
    return (data['categories'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> _loadProducts({bool force = false, required int page}) async {
    if (page > 1) setState(() => _loadingMore = true);
    try {
      final data = await ApiClient.instance.fashionProducts(
        search: _search.text,
        categoryId: _selectedCategory,
        page: page,
        forceRefresh: force,
        onUpdated: (fresh) {
          if (!mounted || page != 1) return;
          _applyProducts(fresh, page: 1, fromCache: false);
        },
      );
      if (!mounted) return;
      _applyProducts(data, page: page, fromCache: !force && page == 1);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _applyProducts(Map<String, dynamic> data, {required int page, required bool fromCache}) {
    final list = (data['products'] is List)
        ? (data['products'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    final pagination = data['pagination'];
    var totalPages = 1;
    if (pagination is Map && pagination['totalPages'] is num) {
      totalPages = (pagination['totalPages'] as num).toInt().clamp(1, 999);
    }
    setState(() {
      _assetBase = data['asset_base_url']?.toString() ?? _assetBase;
      if (page == 1) {
        _products = list;
        _fromCache = fromCache;
      } else {
        _products = [..._products, ...list];
      }
      _totalPages = totalPages;
      _page = page;
    });
  }

  String _productImage(Map<String, dynamic> p) {
    final urls = p['image_urls'];
    if (urls is List && urls.isNotEmpty) {
      return DisplayFormat.resolveImageUrl(urls.first?.toString(), base: _assetBase);
    }
    final paths = p['image_paths'];
    if (paths is List && paths.isNotEmpty) {
      return DisplayFormat.resolveImageUrl(paths.first?.toString(), base: _assetBase);
    }
    return '';
  }

  List<Map<String, dynamic>> get _heroProducts => _products.take(3).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fashion Avenue'),
        actions: [
          if (_fromCache)
            const Padding(
              padding: EdgeInsets.only(right: 8),
              child: Center(child: Text('Cached', style: TextStyle(fontSize: 11, color: Colors.white70))),
            ),
          IconButton(onPressed: () => _bootstrap(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : RefreshIndicator(
                  onRefresh: () => _bootstrap(force: true),
                  color: DfColors.brand,
                  child: CustomScrollView(
                    slivers: [
                      if (_heroProducts.isNotEmpty) SliverToBoxAdapter(child: _HeroCarousel(products: _heroProducts, imageFor: _productImage, index: _heroIndex, onIndex: (i) => setState(() => _heroIndex = i))),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Custom designs & agent commissions', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
                              const SizedBox(height: 4),
                              const Text('Browse catalogues from DataFlex Fashion Avenue.', style: TextStyle(color: DfColors.muted, fontSize: 13)),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _search,
                                decoration: InputDecoration(
                                  hintText: 'Search designs…',
                                  prefixIcon: const Icon(Icons.search),
                                  suffixIcon: IconButton(
                                    icon: const Icon(Icons.arrow_forward),
                                    onPressed: () {
                                      setState(() => _page = 1);
                                      _loadProducts(force: true, page: 1);
                                    },
                                  ),
                                ),
                                onSubmitted: (_) {
                                  setState(() => _page = 1);
                                  _loadProducts(force: true, page: 1);
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 44,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: FilterChip(
                                  label: const Text('All'),
                                  selected: _selectedCategory.isEmpty,
                                  onSelected: (_) {
                                    setState(() => _selectedCategory = '');
                                    _loadProducts(force: true, page: 1);
                                  },
                                ),
                              ),
                              ..._categories.map((c) {
                                final id = c['id']?.toString() ?? '';
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: FilterChip(
                                    label: Text(c['name']?.toString() ?? 'Category'),
                                    selected: _selectedCategory == id,
                                    onSelected: (_) {
                                      setState(() => _selectedCategory = id);
                                      _loadProducts(force: true, page: 1);
                                    },
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                      _products.isEmpty
                          ? const SliverFillRemaining(
                              child: Center(child: Text('No products found.', style: TextStyle(color: DfColors.muted))),
                            )
                          : SliverPadding(
                              padding: const EdgeInsets.all(16),
                              sliver: SliverGrid(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 12,
                                  crossAxisSpacing: 12,
                                  childAspectRatio: 0.72,
                                ),
                                delegate: SliverChildBuilderDelegate(
                                  (context, i) {
                                    if (i >= _products.length) return null;
                                    final p = _products[i];
                                    return _ProductCard(
                                      product: p,
                                      imageUrl: _productImage(p),
                                      onTap: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => FashionProductScreen(
                                              productId: p['id']?.toString() ?? '',
                                              assetBase: _assetBase,
                                            ),
                                          ),
                                        );
                                      },
                                    );
                                  },
                                  childCount: _products.length,
                                ),
                              ),
                            ),
                      if (_page < _totalPages)
                        SliverToBoxAdapter(
                          child: Center(
                            child: _loadingMore
                                ? const Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: DfColors.brand))
                                : TextButton(
                                    onPressed: () => _loadProducts(page: _page + 1),
                                    child: const Text('Load more designs'),
                                  ),
                          ),
                        ),
                      const SliverToBoxAdapter(child: SizedBox(height: 24)),
                    ],
                  ),
                ),
    );
  }
}

class _HeroCarousel extends StatelessWidget {
  const _HeroCarousel({
    required this.products,
    required this.imageFor,
    required this.index,
    required this.onIndex,
  });

  final List<Map<String, dynamic>> products;
  final String Function(Map<String, dynamic>) imageFor;
  final int index;
  final ValueChanged<int> onIndex;

  @override
  Widget build(BuildContext context) {
    final p = products[index.clamp(0, products.length - 1)];
    final img = imageFor(p);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            AspectRatio(
              aspectRatio: 16 / 7,
              child: img.isNotEmpty
                  ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover, width: double.infinity)
                  : Container(color: DfColors.brand.withValues(alpha: 0.15)),
            ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [Colors.black.withValues(alpha: 0.65), Colors.transparent],
                  ),
                ),
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['product_name']?.toString() ?? 'Fashion design', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
                  Text(DisplayFormat.money((p['base_price'] as num?)?.toDouble()), style: const TextStyle(color: Colors.white70)),
                ],
              ),
            ),
            if (products.length > 1)
              Positioned(
                right: 8,
                top: 8,
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => onIndex(index == 0 ? products.length - 1 : index - 1),
                      icon: const Icon(Icons.chevron_left, color: Colors.white),
                      style: IconButton.styleFrom(backgroundColor: Colors.black38),
                    ),
                    IconButton(
                      onPressed: () => onIndex((index + 1) % products.length),
                      icon: const Icon(Icons.chevron_right, color: Colors.white),
                      style: IconButton.styleFrom(backgroundColor: Colors.black38),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product, required this.imageUrl, required this.onTap});
  final Map<String, dynamic> product;
  final String imageUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final commission = product['commission_amount'];
    final comm = commission is num ? commission.toDouble() : double.tryParse('$commission') ?? 0;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: imageUrl.isNotEmpty
                  ? CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover, width: double.infinity)
                  : Container(color: DfColors.brand.withValues(alpha: 0.08), child: const Icon(Icons.checkroom, size: 40, color: DfColors.brand)),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product['product_name']?.toString() ?? 'Design', maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13)),
                  Text(product['product_code']?.toString() ?? '', style: const TextStyle(fontSize: 10, color: DfColors.muted, fontFamily: 'monospace')),
                  const SizedBox(height: 4),
                  Text(DisplayFormat.money((product['base_price'] as num?)?.toDouble()), style: const TextStyle(fontWeight: FontWeight.w700, color: DfColors.brandDark)),
                  if (comm > 0)
                    Text('+ ${DisplayFormat.money(comm)} commission', style: const TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

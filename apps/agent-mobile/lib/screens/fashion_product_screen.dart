import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class FashionProductScreen extends StatefulWidget {
  const FashionProductScreen({super.key, required this.productId, this.assetBase = 'https://www.dataflexghana.com'});
  final String productId;
  final String assetBase;

  @override
  State<FashionProductScreen> createState() => _FashionProductScreenState();
}

class _FashionProductScreenState extends State<FashionProductScreen> {
  Map<String, dynamic>? _product;
  String _assetBase = 'https://www.dataflexghana.com';
  bool _loading = true;
  String? _error;
  int _imageIndex = 0;

  @override
  void initState() {
    super.initState();
    _assetBase = widget.assetBase;
    _load(force: false);
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.fashionProduct(widget.productId, forceRefresh: force);
      final product = data['product'];
      if (product is! Map) throw ApiException('Product not found');
      if (mounted) {
        setState(() {
          _product = Map<String, dynamic>.from(product);
          _assetBase = data['asset_base_url']?.toString() ?? _assetBase;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> get _images {
    if (_product == null) return [];
    final urls = _product!['image_urls'];
    if (urls is List && urls.isNotEmpty) {
      return urls.map((e) => DisplayFormat.resolveImageUrl(e?.toString(), base: _assetBase)).where((s) => s.isNotEmpty).toList();
    }
    final paths = _product!['image_paths'];
    if (paths is List && paths.isNotEmpty) {
      return paths.map((e) => DisplayFormat.resolveImageUrl(e?.toString(), base: _assetBase)).where((s) => s.isNotEmpty).toList();
    }
    return [];
  }

  Future<void> _openWebsite() async {
    final uri = Uri.parse('https://www.dataflexghana.com/fashion-avenue/${widget.productId}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Design Details'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : _product == null
                  ? const Center(child: Text('Product not found'))
                  : Column(
                      children: [
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: [
                              _Gallery(images: _images, index: _imageIndex, onIndex: (i) => setState(() => _imageIndex = i)),
                              const SizedBox(height: 16),
                              Text(_product!['product_name']?.toString() ?? 'Design', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 22)),
                              Text(_product!['product_code']?.toString() ?? '', style: const TextStyle(color: DfColors.muted, fontFamily: 'monospace')),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Chip(label: Text(_product!['category_name']?.toString() ?? 'Fashion')),
                                  if (_product!['fabric_cost_included'] == true)
                                    const Chip(label: Text('Fabric included')),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(DisplayFormat.money((_product!['base_price'] as num?)?.toDouble()), style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 24, color: DfColors.brandDark)),
                              if (((_product!['commission_amount'] as num?) ?? 0) > 0)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'Earn ${DisplayFormat.money((_product!['commission_amount'] as num?)?.toDouble())} commission',
                                    style: const TextStyle(color: Color(0xFF15803D), fontWeight: FontWeight.w700),
                                  ),
                                ),
                              const SizedBox(height: 12),
                              _DetailRow(label: 'Completion time', value: _product!['completion_time']?.toString()),
                              _DetailRow(
                                label: 'Express charge',
                                value: DisplayFormat.money((_product!['express_charge'] as num?)?.toDouble()),
                              ),
                              const SizedBox(height: 16),
                              if (_product!['description'] != null && _product!['description'].toString().trim().isNotEmpty) ...[
                                Text('Description', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
                                const SizedBox(height: 8),
                                Text(_product!['description'].toString(), style: const TextStyle(height: 1.5)),
                              ],
                            ],
                          ),
                        ),
                        SafeArea(
                          minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          child: SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _openWebsite,
                              icon: const Icon(Icons.open_in_new),
                              label: const Text('Request project on website'),
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}

class _Gallery extends StatelessWidget {
  const _Gallery({required this.images, required this.index, required this.onIndex});
  final List<String> images;
  final int index;
  final ValueChanged<int> onIndex;

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) {
      return AspectRatio(
        aspectRatio: 1,
        child: Container(
          decoration: BoxDecoration(color: DfColors.brand.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
          child: const Icon(Icons.checkroom, size: 64, color: DfColors.brand),
        ),
      );
    }
    final safe = index.clamp(0, images.length - 1);
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AspectRatio(
            aspectRatio: 1,
            child: CachedNetworkImage(imageUrl: images[safe], fit: BoxFit.cover),
          ),
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(onPressed: () => onIndex(safe == 0 ? images.length - 1 : safe - 1), icon: const Icon(Icons.chevron_left)),
              Text('${safe + 1} / ${images.length}', style: const TextStyle(color: DfColors.muted)),
              IconButton(onPressed: () => onIndex((safe + 1) % images.length), icon: const Icon(Icons.chevron_right)),
            ],
          ),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) => GestureDetector(
                onTap: () => onIndex(i),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: CachedNetworkImage(
                      imageUrl: images[i],
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    if (value == null || value!.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: DfColors.muted))),
          Text(value!, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

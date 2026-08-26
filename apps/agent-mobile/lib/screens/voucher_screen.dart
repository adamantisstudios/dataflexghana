import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class VoucherScreen extends StatefulWidget {
  const VoucherScreen({super.key});

  @override
  State<VoucherScreen> createState() => _VoucherScreenState();
}

class _VoucherScreenState extends State<VoucherScreen> {
  List<Map<String, dynamic>> _products = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getVoucherProducts();
      setState(() {
        _products = (data['products'] is List)
            ? (data['products'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Future<void> _openWeb() async {
    final base = await SessionStore.instance.getBaseUrl();
    await launchUrl(Uri.parse('$base/voucher'), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Voucher'),
        actions: [
          TextButton(onPressed: _openWeb, child: const Text('Open web', style: TextStyle(color: Colors.white))),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: _error != null
                  ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                  : _products.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No voucher products available'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _products.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, i) {
                            final p = _products[i];
                            final img = DisplayFormat.resolveImageUrl(p['image_url']?.toString());
                            return Card(
                              child: InkWell(
                                onTap: _openWeb,
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(10),
                                        child: img.isEmpty
                                            ? Container(
                                                width: 72,
                                                height: 72,
                                                color: Colors.black12,
                                                child: const Icon(Icons.card_giftcard),
                                              )
                                            : CachedNetworkImage(
                                                imageUrl: img,
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
                                            Text(
                                              p['title']?.toString() ?? 'Product',
                                              style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                                            ),
                                            if ((p['description']?.toString() ?? '').isNotEmpty)
                                              Text(
                                                p['description'].toString(),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(color: DfColors.muted, fontSize: 12),
                                              ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'GHS ${_n(p['price']).toStringAsFixed(2)} · Stock ${_n(p['quantity']).toInt()}',
                                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.open_in_new, size: 18, color: DfColors.muted),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}

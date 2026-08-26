import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class HubQrTab extends StatefulWidget {
  const HubQrTab({super.key});

  @override
  State<HubQrTab> createState() => _HubQrTabState();
}

class _HubQrTabState extends State<HubQrTab> {
  String? _slug;
  String? _storeName;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  String get _storeUrl {
    final slug = (_slug ?? '').trim();
    if (slug.isEmpty) return '';
    return 'https://www.dataflexghana.com/store/$slug';
  }

  String get _qrImageUrl {
    final url = Uri.encodeComponent(_storeUrl);
    return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=$url';
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getStoreProfile();
      final profile = data['profile'];
      if (profile is Map) {
        setState(() {
          _slug = profile['store_slug']?.toString();
          _storeName = profile['store_name']?.toString();
        });
      } else {
        setState(() {
          _slug = null;
          _storeName = null;
        });
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copy() async {
    final url = _storeUrl;
    if (url.isEmpty) {
      _snack('Set a store slug in Profile first', error: true);
      return;
    }
    await Clipboard.setData(ClipboardData(text: url));
    _snack('Store link copied');
  }

  Future<void> _shareWhatsApp() async {
    final url = _storeUrl;
    if (url.isEmpty) {
      _snack('Set a store slug in Profile first', error: true);
      return;
    }
    final name = (_storeName ?? 'my store').trim();
    final text = Uri.encodeComponent('Shop at $name on DataFlex: $url');
    final wa = Uri.parse('https://wa.me/?text=$text');
    if (await canLaunchUrl(wa)) {
      await launchUrl(wa, mode: LaunchMode.externalApplication);
    } else {
      _snack('Could not open WhatsApp', error: true);
    }
  }

  Future<void> _openStore() async {
    final url = _storeUrl;
    if (url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final hasSlug = _storeUrl.isNotEmpty;

    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Store QR code',
            style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          const Text(
            'Share your white-label storefront with customers via QR or WhatsApp.',
            style: TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 24),
          if (!hasSlug)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Column(
                children: [
                  Icon(Icons.link_off, size: 48, color: Colors.orange.shade700),
                  const SizedBox(height: 12),
                  Text(
                    'No store slug yet',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Open the Profile tab and set a unique store slug to generate your QR code.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: DfColors.muted, fontSize: 13),
                  ),
                ],
              ),
            )
          else ...[
            if (_storeName != null && _storeName!.isNotEmpty)
              Text(
                _storeName!,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            const SizedBox(height: 8),
            InkWell(
              onTap: _openStore,
              child: Text(
                _storeUrl,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: DfColors.brand,
                  fontSize: 13,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: CachedNetworkImage(
                  imageUrl: _qrImageUrl,
                  width: 240,
                  height: 240,
                  fit: BoxFit.contain,
                  placeholder: (_, _) => const SizedBox(
                    width: 240,
                    height: 240,
                    child: Center(child: CircularProgressIndicator(color: DfColors.brand)),
                  ),
                  errorWidget: (_, _, _) => const SizedBox(
                    width: 240,
                    height: 240,
                    child: Center(
                      child: Icon(Icons.qr_code_2, size: 80, color: DfColors.muted),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _copy,
              icon: const Icon(Icons.copy),
              label: const Text('Copy store link'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _shareWhatsApp,
              icon: const Icon(Icons.chat),
              label: const Text('Share on WhatsApp'),
              style: OutlinedButton.styleFrom(
                foregroundColor: DfColors.brandDark,
                minimumSize: const Size.fromHeight(52),
                side: const BorderSide(color: DfColors.brand),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

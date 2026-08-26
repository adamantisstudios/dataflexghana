import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class HubListingsTab extends StatefulWidget {
  const HubListingsTab({super.key});

  @override
  State<HubListingsTab> createState() => _HubListingsTabState();
}

class _HubListingsTabState extends State<HubListingsTab> {
  final _title = TextEditingController();
  final _price = TextEditingController();
  final _category = TextEditingController();
  final _description = TextEditingController();
  final _momoNumber = TextEditingController();
  final _momoName = TextEditingController();
  final _picker = ImagePicker();

  String _listingType = 'product';
  bool _acceptedTerms = false;
  final List<String> _imageUrls = [];
  bool _uploadingImage = false;

  List<Map<String, dynamic>> _products = [];
  Map<String, dynamic>? _packagesInfo;
  bool _loading = true;
  bool _creating = false;
  String? _error;
  bool _showForm = false;

  bool _buyingPackage = false;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _price.dispose();
    _category.dispose();
    _description.dispose();
    _momoNumber.dispose();
    _momoName.dispose();
    super.dispose();
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
      final results = await Future.wait([
        ApiClient.instance.getListingProducts(),
        ApiClient.instance.getListingPackages(),
      ]);
      final productsRaw = results[0]['products'];
      setState(() {
        _products = productsRaw is List
            ? productsRaw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _packagesInfo = results[1];
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickImages() async {
    try {
      final files = await _picker.pickMultiImage(imageQuality: 85);
      if (files.isEmpty) return;
      setState(() => _uploadingImage = true);
      for (final file in files) {
        final url = await ApiClient.instance.uploadListingImage(file);
        if (url.isNotEmpty) {
          setState(() => _imageUrls.add(url));
        }
      }
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _uploadingImage = false);
    }
  }

  Future<void> _create() async {
    final title = _title.text.trim();
    final price = double.tryParse(_price.text.trim());
    if (title.isEmpty || price == null || price <= 0) {
      _snack('Title and valid price are required', error: true);
      return;
    }
    if (_momoNumber.text.trim().isEmpty || _momoName.text.trim().isEmpty) {
      _snack('MoMo number and name are required', error: true);
      return;
    }
    if (_imageUrls.isEmpty) {
      _snack('Add at least one image', error: true);
      return;
    }
    if (!_acceptedTerms) {
      _snack('Accept the listing terms to continue', error: true);
      return;
    }

    setState(() => _creating = true);
    try {
      await ApiClient.instance.createListingProduct({
        'listing_type': _listingType,
        'title': title,
        'price': price,
        'category': _category.text.trim().isEmpty ? null : _category.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'momo_number': _momoNumber.text.trim(),
        'momo_name': _momoName.text.trim(),
        'images': _imageUrls,
      });
      _snack('Listing created');
      _title.clear();
      _price.clear();
      _category.clear();
      _description.clear();
      _imageUrls.clear();
      _acceptedTerms = false;
      setState(() => _showForm = false);
      await _load();
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _products.isEmpty) {
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
          _buildPackagesCard(),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Your listings',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              TextButton.icon(
                onPressed: () => setState(() => _showForm = !_showForm),
                icon: Icon(_showForm ? Icons.close : Icons.add),
                label: Text(_showForm ? 'Cancel' : 'Add'),
              ),
            ],
          ),
          if (_showForm) ...[
            const SizedBox(height: 8),
            _buildCreateForm(),
            const SizedBox(height: 16),
          ],
          if (_products.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text('No listings yet', style: TextStyle(color: DfColors.muted)),
              ),
            )
          else
            ..._products.map(_productTile),
        ],
      ),
    );
  }

  Future<void> _buyPackage(Map package) async {
    final id = package['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final accepted = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Buy listing package'),
        content: Text(
          'Purchase "${package['name'] ?? 'package'}" for ${_money.format(package['price'] is num ? package['price'] : 0)} via Paystack?\n\n'
          'You confirm you accept DataFlex listing terms.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Continue to Paystack')),
        ],
      ),
    );
    if (accepted != true) return;
    setState(() => _buyingPackage = true);
    try {
      final res = await ApiClient.instance.initializeListingPackage(packageId: id, termsAccepted: true);
      final url = res['authorization_url']?.toString();
      if (url == null || url.isEmpty) throw ApiException('No Paystack URL returned');
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      _snack('Complete payment in the browser, then pull to refresh this tab.');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _buyingPackage = false);
    }
  }

  Widget _buildPackagesCard() {
    final info = _packagesInfo;
    final packages = info?['packages'];
    final used = info?['listings_used'];
    final max = info?['max_listings'];
    final canList = info?['can_list_products'] != false;
    final days = info?['days_remaining'];
    final sub = info?['subscription'];
    final features = info?['features'];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Listing package',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          const SizedBox(height: 6),
          Text(
            canList
                ? 'Used $used / $max listings${days != null ? ' · $days days left' : ''}'
                : 'Buy a package below to list products on your storefront',
            style: const TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          if (sub is Map) ...[
            const SizedBox(height: 6),
            Text(
              'Subscription: ${sub['status'] ?? '—'}'
              '${sub['expires_at'] != null ? ' · expires ${sub['expires_at']}' : ''}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: DfColors.brandDark),
            ),
          ],
          if (features is List && features.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Includes: ${features.map((e) => e.toString()).join(', ')}',
              style: const TextStyle(fontSize: 11, color: DfColors.muted),
            ),
          ],
          if (packages is List && packages.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...packages.whereType<Map>().map((p) {
              final name = p['name']?.toString() ?? p['package_name']?.toString() ?? 'Package';
              final price = p['price'];
              final priceStr = price is num ? _money.format(price) : (price?.toString() ?? '');
              final maxListings = p['max_listings'];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                          Text(
                            '$priceStr${maxListings != null ? ' · up to $maxListings listings' : ''}',
                            style: const TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _buyingPackage ? null : () => _buyPackage(p),
                      child: const Text('Buy'),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildCreateForm() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('New listing', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'product', label: Text('Product')),
              ButtonSegment(value: 'service', label: Text('Service')),
            ],
            selected: {_listingType},
            onSelectionChanged: (s) => setState(() => _listingType = s.first),
          ),
          const SizedBox(height: 12),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title *')),
          const SizedBox(height: 10),
          TextField(
            controller: _price,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Price (GHS) *'),
          ),
          const SizedBox(height: 10),
          TextField(controller: _category, decoration: const InputDecoration(labelText: 'Category')),
          const SizedBox(height: 10),
          TextField(
            controller: _description,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _momoNumber,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'MoMo number *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _momoName,
            decoration: const InputDecoration(labelText: 'MoMo account name *'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._imageUrls.map((url) {
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(url, width: 72, height: 72, fit: BoxFit.cover),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: InkWell(
                        onTap: () => setState(() => _imageUrls.remove(url)),
                        child: const CircleAvatar(
                          radius: 10,
                          backgroundColor: Colors.black54,
                          child: Icon(Icons.close, size: 12, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              }),
              OutlinedButton.icon(
                onPressed: _uploadingImage ? null : _pickImages,
                icon: _uploadingImage
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                      )
                    : const Icon(Icons.add_photo_alternate_outlined),
                label: const Text('Images'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _acceptedTerms,
            onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text(
              'I confirm this listing is accurate and I accept DataFlex listing terms',
              style: TextStyle(fontSize: 13),
            ),
          ),
          ElevatedButton(
            onPressed: _creating ? null : _create,
            child: _creating
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create listing'),
          ),
        ],
      ),
    );
  }

  Widget _productTile(Map<String, dynamic> p) {
    final images = p['images'];
    final firstImage = images is List && images.isNotEmpty ? images.first.toString() : null;
    final price = p['price'];
    final priceNum = price is num ? price.toDouble() : double.tryParse(price?.toString() ?? '') ?? 0;
    final active = p['is_active'] != false;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 52,
              height: 52,
              child: firstImage != null
                  ? Image.network(firstImage, fit: BoxFit.cover, errorBuilder: (_, _, _) => _imgFallback())
                  : _imgFallback(),
            ),
          ),
          title: Text(
            p['title']?.toString() ?? 'Listing',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            '${p['listing_type'] ?? 'product'} · ${_money.format(priceNum)}${active ? '' : ' · inactive'}',
            style: const TextStyle(fontSize: 12, color: DfColors.muted),
          ),
        ),
      ),
    );
  }

  Widget _imgFallback() => Container(
        color: DfColors.sand,
        child: const Icon(Icons.inventory_2_outlined, color: DfColors.muted),
      );
}

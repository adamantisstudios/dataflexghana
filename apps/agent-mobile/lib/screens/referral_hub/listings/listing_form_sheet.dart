import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../services/api_client.dart';
import '../../../services/listings_api.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/display_format.dart';
import '../../../widgets/image_viewer.dart';

/// Create / edit sheet for a storefront listing.
///
/// Mirrors the "Add listing" card in
/// `components/agent/referralhub/MarketplaceMyListingsSection.tsx`, including
/// the per-package image quota and the server-side validation messages.
class ListingFormSheet extends StatefulWidget {
  const ListingFormSheet({
    super.key,
    required this.maxImages,
    this.product,
  });

  final int maxImages;
  final Map<String, dynamic>? product;

  static Future<bool?> open(
    BuildContext context, {
    required int maxImages,
    Map<String, dynamic>? product,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ListingFormSheet(maxImages: maxImages, product: product),
    );
  }

  @override
  State<ListingFormSheet> createState() => _ListingFormSheetState();
}

class _ListingFormSheetState extends State<ListingFormSheet> {
  final _title = TextEditingController();
  final _price = TextEditingController();
  final _category = TextEditingController();
  final _description = TextEditingController();
  final _momoNumber = TextEditingController();
  final _momoName = TextEditingController();
  final _picker = ImagePicker();

  String _listingType = 'product';
  bool _isActive = true;
  final List<String> _images = [];

  bool _uploading = false;
  bool _saving = false;

  bool get _isEdit => widget.product != null;

  /// The PATCH route stores at most two images, so editing a listing that was
  /// created on a larger plan must not silently drop the extras.
  int get _imageSlots {
    final cap = widget.maxImages < 1 ? 1 : widget.maxImages;
    if (!_isEdit) return cap;
    return cap < 2 ? cap : 2;
  }

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    if (p != null) {
      _title.text = p['title']?.toString() ?? '';
      final price = p['price'];
      _price.text = price is num ? price.toString() : (price?.toString() ?? '');
      _category.text = p['category']?.toString() ?? '';
      _description.text = p['description']?.toString() ?? '';
      _momoNumber.text = p['momo_number']?.toString() ?? '';
      _momoName.text = p['momo_name']?.toString() ?? '';
      _listingType = p['listing_type']?.toString() == 'service' ? 'service' : 'product';
      _isActive = p['is_active'] != false;
      final images = p['images'];
      if (images is List) {
        _images.addAll(images.map((e) => e.toString()).where((e) => e.isNotEmpty));
      }
    }
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

  Future<void> _pickImage() async {
    if (_images.length >= _imageSlots) {
      _snack('Maximum $_imageSlots image${_imageSlots == 1 ? '' : 's'} on your plan', error: true);
      return;
    }
    try {
      final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (file == null) return;
      setState(() => _uploading = true);
      final url = await ListingsApi.instance.uploadImage(file);
      if (!mounted) return;
      setState(() => _images.add(url));
      _snack('Image uploaded');
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Upload failed', error: true);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  static const _photoGateMessage =
      'Verify your account with a photo in Profile before you can manage listings.';

  Future<void> _save() async {
    final title = _title.text.trim();
    final price = double.tryParse(_price.text.trim());
    if (title.isEmpty || price == null || price <= 0) {
      _snack('Title and valid price are required', error: true);
      return;
    }
    if (_momoNumber.text.trim().isEmpty || _momoName.text.trim().isEmpty) {
      _snack('MoMo number and account name are required', error: true);
      return;
    }
    if (_images.isEmpty) {
      _snack('At least one product image is required', error: true);
      return;
    }

    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'title': title,
        'price': price,
        'category': _category.text.trim().isEmpty ? null : _category.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'listing_type': _listingType,
        'momo_number': _momoNumber.text.trim(),
        'momo_name': _momoName.text.trim(),
        'images': _images,
      };
      if (_isEdit) {
        body['is_active'] = _isActive;
        await ListingsApi.instance.updateProduct(widget.product!['id'].toString(), body);
      } else {
        await ListingsApi.instance.createProduct(body);
      }
      if (!mounted) return;
      final noun = _listingType == 'service' ? 'Service' : 'Product';
      _snack(_isEdit ? '$noun updated' : '$noun added');
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Save failed', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, controller) => Container(
          decoration: const BoxDecoration(
            color: DfColors.sand,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: DfColors.muted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                _isEdit ? 'Edit listing' : 'Add listing',
                style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                'Max $_imageSlots image${_imageSlots != 1 ? 's' : ''} per listing. '
                'Customers pay you directly via MoMo.',
                style: const TextStyle(fontSize: 13, color: DfColors.muted),
              ),
              const SizedBox(height: 16),
              _label('Type'),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(child: _typeButton('product', 'Product')),
                  const SizedBox(width: 10),
                  Expanded(child: _typeButton('service', 'Service')),
                ],
              ),
              const SizedBox(height: 14),
              _field(_title, 'Title *'),
              const SizedBox(height: 12),
              _field(
                _price,
                'Price (GHS) *',
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 12),
              _field(_category, 'Category'),
              const SizedBox(height: 12),
              _field(_description, 'Description', maxLines: 3),
              const SizedBox(height: 12),
              _field(_momoNumber, 'MoMo number *', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              _field(_momoName, 'MoMo account name *'),
              const SizedBox(height: 16),
              _label('Photos'),
              const SizedBox(height: 8),
              _imageGrid(),
              if (_isEdit) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isActive ? 'Published' : 'Hidden',
                              style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                            ),
                            const Text(
                              'Hidden listings stay in your account but are removed from your storefront.',
                              style: TextStyle(fontSize: 12, color: DfColors.muted),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _isActive,
                        activeThumbColor: DfColors.brand,
                        onChanged: (v) => setState(() => _isActive = v),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _isEdit
                              ? 'Save changes'
                              : 'Save ${_listingType == 'service' ? 'service' : 'product'}',
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600),
      );

  Widget _typeButton(String value, String label) {
    final selected = _listingType == value;
    return SizedBox(
      height: 46,
      child: selected
          ? ElevatedButton(onPressed: () {}, child: Text(label))
          : OutlinedButton(
              onPressed: () => setState(() => _listingType = value),
              child: Text(label),
            ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        alignLabelWithHint: maxLines > 1,
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }

  Widget _imageGrid() {
    final resolved = _images.map(DisplayFormat.resolveImageUrl).toList();
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < _images.length; i++)
          Stack(
            children: [
              GestureDetector(
                onTap: () => FullScreenImageViewer.open(
                  context,
                  images: resolved,
                  initialIndex: i,
                  title: _title.text.trim().isEmpty ? 'Listing photo' : _title.text.trim(),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: resolved[i],
                    width: 84,
                    height: 84,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(width: 84, height: 84, color: DfColors.sand),
                    errorWidget: (_, _, _) => Container(
                      width: 84,
                      height: 84,
                      color: DfColors.sand,
                      child: const Icon(Icons.broken_image_outlined, color: DfColors.muted),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 2,
                top: 2,
                child: InkWell(
                  onTap: () => setState(() => _images.removeAt(i)),
                  child: const CircleAvatar(
                    radius: 11,
                    backgroundColor: Colors.black54,
                    child: Icon(Icons.close, size: 13, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        if (_images.length < _imageSlots)
          InkWell(
            onTap: _uploading ? null : _pickImage,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: DfColors.brand.withValues(alpha: 0.35)),
              ),
              child: _uploading
                  ? const Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                      ),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.add_a_photo_outlined, color: DfColors.brand, size: 22),
                        const SizedBox(height: 4),
                        Text(
                          'Add photo',
                          style: TextStyle(fontSize: 10, color: DfColors.brand.withValues(alpha: 0.9)),
                        ),
                      ],
                    ),
            ),
          ),
      ],
    );
  }
}

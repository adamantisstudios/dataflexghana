import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../../services/api_client.dart';
import '../../../services/farmers_api.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/display_format.dart';
import '../../../widgets/image_viewer.dart';

/// Create / edit sheet for a Farmers Friend produce listing.
///
/// Mirrors the "List farm produce" form in
/// `components/agent/farmersfriend/FarmersFriendHub.tsx`.
class FarmListingFormSheet extends StatefulWidget {
  const FarmListingFormSheet({
    super.key,
    this.listing,
    this.embedded = false,
    this.onSaved,
  });

  final FarmListing? listing;

  /// When true the form renders as a plain column for the "New listing" tab
  /// instead of a modal sheet, matching the website's inline form.
  final bool embedded;

  /// Called after a successful save in [embedded] mode, where there is no
  /// route to pop.
  final VoidCallback? onSaved;

  static Future<bool?> open(BuildContext context, {FarmListing? listing}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FarmListingFormSheet(listing: listing),
    );
  }

  @override
  State<FarmListingFormSheet> createState() => _FarmListingFormSheetState();
}

class _FarmListingFormSheetState extends State<FarmListingFormSheet> {
  final _produceName = TextEditingController();
  final _quantity = TextEditingController();
  final _price = TextEditingController();
  final _farmerName = TextEditingController();
  final _farmerPhone = TextEditingController();
  final _farmerLocation = TextEditingController();
  final _notes = TextEditingController();
  final _picker = ImagePicker();

  String _unit = 'kg';
  DateTime? _harvestDate;
  final List<String> _photos = [];

  bool _uploading = false;
  bool _saving = false;

  final _isoDate = DateFormat('yyyy-MM-dd');
  final _readableDate = DateFormat('d MMM yyyy');

  bool get _isEdit => widget.listing != null;

  @override
  void initState() {
    super.initState();
    final l = widget.listing;
    if (l != null) {
      _produceName.text = l.produceName;
      _quantity.text = _trimNumber(l.quantityAvailable);
      _price.text = _trimNumber(l.negotiatedPrice);
      _farmerName.text = l.farmerName;
      _farmerPhone.text = l.farmerPhone;
      _farmerLocation.text = l.farmerLocation ?? '';
      _notes.text = l.notes ?? '';
      _unit = farmUnits.contains(l.unit) ? l.unit : 'kg';
      _harvestDate = l.harvestDate == null ? null : DateTime.tryParse(l.harvestDate!);
      _photos.addAll(l.photos);
    }
  }

  String _trimNumber(double v) =>
      v == v.roundToDouble() ? v.toStringAsFixed(0) : v.toString();

  @override
  void dispose() {
    _produceName.dispose();
    _quantity.dispose();
    _price.dispose();
    _farmerName.dispose();
    _farmerPhone.dispose();
    _farmerLocation.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  static const _photoGateMessage =
      'Verify your account with a photo in Profile before you can manage farm listings.';

  Future<void> _pickHarvestDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _harvestDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _harvestDate = picked);
  }

  Future<void> _pickPhoto() async {
    if (_photos.length >= FarmersApi.maxPhotos) {
      _snack('Maximum ${FarmersApi.maxPhotos} photos per listing', error: true);
      return;
    }
    try {
      final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (file == null) return;
      setState(() => _uploading = true);
      final url = await FarmersApi.instance.uploadPhoto(file);
      if (!mounted) return;
      setState(() => _photos.add(url));
      _snack('Photo uploaded');
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Upload failed', error: true);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _reset() {
    _produceName.clear();
    _quantity.clear();
    _price.clear();
    _farmerName.clear();
    _farmerPhone.clear();
    _farmerLocation.clear();
    _notes.clear();
    setState(() {
      _unit = 'kg';
      _harvestDate = null;
      _photos.clear();
    });
  }

  Future<void> _save() async {
    final produce = _produceName.text.trim();
    final farmer = _farmerName.text.trim();
    final phone = _farmerPhone.text.trim();
    final quantity = double.tryParse(_quantity.text.trim());
    final price = double.tryParse(_price.text.trim());

    if (produce.isEmpty || farmer.isEmpty || phone.isEmpty) {
      _snack('Produce, farmer name, and phone are required', error: true);
      return;
    }
    if (price == null || price <= 0) {
      _snack('Valid negotiated price is required', error: true);
      return;
    }
    if (quantity == null || quantity <= 0) {
      _snack('Valid quantity is required', error: true);
      return;
    }

    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'produce_name': produce,
        'quantity_available': quantity,
        'unit': _unit,
        'negotiated_price': price,
        'farmer_name': farmer,
        'farmer_phone': phone,
        'farmer_location': _farmerLocation.text.trim().isEmpty ? null : _farmerLocation.text.trim(),
        'harvest_date': _harvestDate == null ? null : _isoDate.format(_harvestDate!),
        'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        'photos': _photos,
      };
      if (_isEdit) {
        await FarmersApi.instance.updateListing(widget.listing!.id, body);
      } else {
        await FarmersApi.instance.createListing(body);
      }
      if (!mounted) return;
      _snack(_isEdit ? 'Listing updated' : 'Listing submitted for admin pricing');
      if (widget.embedded) {
        _reset();
        widget.onSaved?.call();
      } else {
        Navigator.of(context).pop(true);
      }
    } on ApiException catch (e) {
      _snack(e.photoGate ? _photoGateMessage : e.message, error: true);
    } catch (e) {
      _snack('Submit failed', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: _formChildren(),
      );
    }
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
              ..._formChildren(),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _formChildren() {
    return [
              Text(
                _isEdit ? 'Edit farm listing' : 'List farm produce',
                style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              const Text(
                'Farmer details are private — only admin sees them until logistics are arranged.',
                style: TextStyle(fontSize: 13, color: DfColors.muted, height: 1.4),
              ),
              const SizedBox(height: 16),
              _field(_produceName, 'Produce name *'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _field(
                      _quantity,
                      'Quantity available *',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _unit,
                      decoration: const InputDecoration(
                        labelText: 'Unit',
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      items: farmUnits
                          .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                          .toList(),
                      onChanged: (v) => setState(() => _unit = v ?? 'kg'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _field(
                _price,
                "Farmer's price (GHS) *",
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 4),
              const Text(
                'Admin adds a markup on top of this price to set the retail price buyers pay.',
                style: TextStyle(fontSize: 11.5, color: DfColors.muted),
              ),
              const SizedBox(height: 12),
              _field(_farmerName, 'Farmer name *'),
              const SizedBox(height: 12),
              _field(_farmerPhone, 'Farmer phone *', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              _field(_farmerLocation, 'Farmer location'),
              const SizedBox(height: 12),
              InkWell(
                onTap: _pickHarvestDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Harvest date',
                    filled: true,
                    fillColor: Colors.white,
                    suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
                  ),
                  child: Text(
                    _harvestDate == null ? 'Not set' : _readableDate.format(_harvestDate!),
                    style: TextStyle(
                      color: _harvestDate == null ? DfColors.muted : DfColors.ink,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _field(_notes, 'Notes', maxLines: 3),
              const SizedBox(height: 16),
              Text(
                'Photos (max ${FarmersApi.maxPhotos}, compressed automatically)',
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              _photoGrid(),
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
                      : Text(_isEdit ? 'Save changes' : 'Submit for admin review'),
                ),
              ),
    ];
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

  Widget _photoGrid() {
    final resolved = _photos.map(DisplayFormat.resolveImageUrl).toList();
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < _photos.length; i++)
          Stack(
            children: [
              GestureDetector(
                onTap: () => FullScreenImageViewer.open(
                  context,
                  images: resolved,
                  initialIndex: i,
                  title: _produceName.text.trim().isEmpty ? 'Produce' : _produceName.text.trim(),
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
                  onTap: () => setState(() => _photos.removeAt(i)),
                  child: const CircleAvatar(
                    radius: 11,
                    backgroundColor: Colors.black54,
                    child: Icon(Icons.close, size: 13, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        if (_photos.length < FarmersApi.maxPhotos)
          InkWell(
            onTap: _uploading ? null : _pickPhoto,
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
                  : const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo_outlined, color: DfColors.brand, size: 22),
                        SizedBox(height: 4),
                        Text('Add photo', style: TextStyle(fontSize: 10, color: DfColors.brand)),
                      ],
                    ),
            ),
          ),
      ],
    );
  }
}

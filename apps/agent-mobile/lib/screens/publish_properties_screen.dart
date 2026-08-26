import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class PublishPropertiesScreen extends StatefulWidget {
  const PublishPropertiesScreen({super.key});

  @override
  State<PublishPropertiesScreen> createState() => _PublishPropertiesScreenState();
}

class _PublishPropertiesScreenState extends State<PublishPropertiesScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _location = TextEditingController();
  final _bedrooms = TextEditingController();
  final _bathrooms = TextEditingController();
  final _sqft = TextEditingController();
  final _commission = TextEditingController(text: '0');
  String _category = 'For Sale';
  String _currency = 'GHS';
  final _images = <String>[];
  bool _uploading = false;
  bool _submitting = false;

  static const _categories = ['For Sale', 'For Rent', 'Land', 'Commercial', 'Other'];

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    _location.dispose();
    _bedrooms.dispose();
    _bathrooms.dispose();
    _sqft.dispose();
    _commission.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final url = await ApiClient.instance.uploadImage(file);
      if (url.isEmpty) throw ApiException('Upload failed');
      setState(() => _images.add(url));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submit() async {
    final agent = await SessionStore.instance.getAgent();
    if (!mounted) return;
    final agentId = agent?['id']?.toString() ?? '';
    if (_title.text.trim().isEmpty || _price.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title and price are required')));
      return;
    }
    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one property image')));
      return;
    }
    setState(() => _submitting = true);
    try {
      await ApiClient.instance.submitProperty({
        'title': _title.text.trim(),
        'description': _description.text.trim(),
        'category': _category,
        'price': double.tryParse(_price.text.trim()) ?? 0,
        'currency': _currency,
        'location': _location.text.trim(),
        'bedrooms': int.tryParse(_bedrooms.text.trim()) ?? 0,
        'bathrooms': int.tryParse(_bathrooms.text.trim()) ?? 0,
        'square_feet': int.tryParse(_sqft.text.trim()) ?? 0,
        'commission': double.tryParse(_commission.text.trim()) ?? 0,
        'image_urls': _images,
        'agent_id': agentId,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property submitted for review')),
      );
      _title.clear();
      _description.clear();
      _price.clear();
      _location.clear();
      setState(() => _images.clear());
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Publish Properties')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('List a property', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
          const SizedBox(height: 6),
          const Text('Listings stay pending until admin approves.',
              style: TextStyle(color: DfColors.muted, fontSize: 13)),
          const SizedBox(height: 14),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title *')),
          const SizedBox(height: 10),
          TextField(controller: _description, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            value: _category,
            decoration: const InputDecoration(labelText: 'Category'),
            items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (v) => setState(() => _category = v ?? _category),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _price,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                  decoration: const InputDecoration(labelText: 'Price *'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _currency,
                  decoration: const InputDecoration(labelText: 'Currency'),
                  items: const [
                    DropdownMenuItem(value: 'GHS', child: Text('GHS')),
                    DropdownMenuItem(value: 'USD', child: Text('USD')),
                  ],
                  onChanged: (v) => setState(() => _currency = v ?? 'GHS'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _bedrooms,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Bedrooms'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _bathrooms,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Bathrooms'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _sqft,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Sq ft'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _commission,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Commission'),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._images.map((u) => Chip(
                    label: Text(u.split('/').last, overflow: TextOverflow.ellipsis),
                    onDeleted: () => setState(() => _images.remove(u)),
                  )),
              ActionChip(
                avatar: _uploading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.add_a_photo),
                label: Text(_uploading ? 'Uploading…' : 'Add image'),
                onPressed: _uploading ? null : _pickImage,
              ),
            ],
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Submit property'),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class PublishProductsScreen extends StatefulWidget {
  const PublishProductsScreen({super.key});

  @override
  State<PublishProductsScreen> createState() => _PublishProductsScreenState();
}

class _PublishProductsScreenState extends State<PublishProductsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _qty = TextEditingController();
  final _commission = TextEditingController(text: '0');
  final _delivery = TextEditingController(text: '3-5 business days');
  String _category = 'Electronics';
  final _images = <String>[];
  bool _uploading = false;
  bool _submitting = false;
  List<Map<String, dynamic>> _mine = [];
  bool _loadingMine = true;

  static const _categories = [
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Beauty',
    'Food & Grocery',
    'Health',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadMine();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _name.dispose();
    _description.dispose();
    _price.dispose();
    _qty.dispose();
    _commission.dispose();
    _delivery.dispose();
    super.dispose();
  }

  Future<void> _loadMine() async {
    setState(() => _loadingMine = true);
    try {
      final data = await ApiClient.instance.getMyWholesaleProducts();
      setState(() {
        _mine = (data['products'] is List)
            ? (data['products'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } catch (_) {
      setState(() => _mine = []);
    } finally {
      if (mounted) setState(() => _loadingMine = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
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
    if (agentId.isEmpty) return;
    if (_name.text.trim().isEmpty || _price.text.trim().isEmpty || _qty.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name, price and quantity are required')));
      return;
    }
    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one product image')));
      return;
    }
    setState(() => _submitting = true);
    try {
      await ApiClient.instance.submitWholesaleProduct({
        'name': _name.text.trim(),
        'description': _description.text.trim(),
        'category': _category,
        'price': double.tryParse(_price.text.trim()) ?? 0,
        'commission_value': double.tryParse(_commission.text.trim()) ?? 0,
        'quantity': int.tryParse(_qty.text.trim()) ?? 1,
        'delivery_time': _delivery.text.trim(),
        'image_urls': _images,
        'agent_id': agentId,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product submitted for review')),
      );
      _name.clear();
      _description.clear();
      _price.clear();
      _qty.clear();
      setState(() => _images.clear());
      await _loadMine();
      _tabs.animateTo(1);
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
      appBar: AppBar(
        title: const Text('Publish Products'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'Submit'), Tab(text: 'My products')]),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Wholesale product', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
              const SizedBox(height: 6),
              const Text('Submitted products stay unpublished until admin approves.',
                  style: TextStyle(color: DfColors.muted, fontSize: 13)),
              const SizedBox(height: 14),
              TextField(controller: _name, decoration: const InputDecoration(labelText: 'Product name *')),
              const SizedBox(height: 10),
              TextField(
                controller: _description,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
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
                    child: TextField(
                      controller: _price,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                      decoration: const InputDecoration(labelText: 'Price (GHS) *'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _qty,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(labelText: 'Quantity *'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _commission,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Commission per unit'),
              ),
              const SizedBox(height: 10),
              TextField(controller: _delivery, decoration: const InputDecoration(labelText: 'Delivery time')),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ..._images.map((u) => Chip(label: Text(u.split('/').last, overflow: TextOverflow.ellipsis), onDeleted: () => setState(() => _images.remove(u)))),
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
                    : const Text('Submit product'),
              ),
            ],
          ),
          _loadingMine
              ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
              : RefreshIndicator(
                  onRefresh: _loadMine,
                  color: DfColors.brand,
                  child: _mine.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No submitted products yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _mine.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final p = _mine[i];
                            final published = p['is_active'] == true || p['is_published'] == true;
                            return Card(
                              child: ListTile(
                                title: Text(p['name']?.toString() ?? p['product_name']?.toString() ?? 'Product',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                subtitle: Text(
                                  'GHS ${p['price']} · Qty ${p['quantity']} · ${published ? 'Published' : 'Pending'}',
                                ),
                              ),
                            );
                          },
                        ),
                ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class HubFarmersTab extends StatefulWidget {
  const HubFarmersTab({super.key});

  @override
  State<HubFarmersTab> createState() => _HubFarmersTabState();
}

class _HubFarmersTabState extends State<HubFarmersTab> {
  final _produceName = TextEditingController();
  final _quantity = TextEditingController();
  final _unit = TextEditingController(text: 'kg');
  final _negotiatedPrice = TextEditingController();
  final _farmerName = TextEditingController();
  final _farmerPhone = TextEditingController();
  final _farmerLocation = TextEditingController();
  final _harvestDate = TextEditingController();
  final _notes = TextEditingController();

  List<Map<String, dynamic>> _listings = [];
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  bool _creating = false;
  bool _showForm = false;
  String? _error;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _produceName.dispose();
    _quantity.dispose();
    _unit.dispose();
    _negotiatedPrice.dispose();
    _farmerName.dispose();
    _farmerPhone.dispose();
    _farmerLocation.dispose();
    _harvestDate.dispose();
    _notes.dispose();
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
        ApiClient.instance.getFarmListings(),
        ApiClient.instance.getFarmOrders(),
      ]);
      final listings = results[0]['listings'];
      final orders = results[1]['orders'];
      setState(() {
        _listings = listings is List
            ? listings.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _orders = orders is List
            ? orders.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Future<void> _pickHarvestDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) {
      _harvestDate.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  Future<void> _create() async {
    final produce = _produceName.text.trim();
    final qty = double.tryParse(_quantity.text.trim());
    final price = double.tryParse(_negotiatedPrice.text.trim());
    final farmer = _farmerName.text.trim();
    final phone = _farmerPhone.text.trim();

    if (produce.isEmpty || farmer.isEmpty || phone.isEmpty) {
      _snack('Produce, farmer name, and phone are required', error: true);
      return;
    }
    if (qty == null || qty <= 0) {
      _snack('Enter a valid quantity', error: true);
      return;
    }
    if (price == null || price <= 0) {
      _snack('Enter a valid negotiated price', error: true);
      return;
    }

    setState(() => _creating = true);
    try {
      await ApiClient.instance.createFarmListing({
        'produce_name': produce,
        'quantity_available': qty,
        'unit': _unit.text.trim().isEmpty ? 'kg' : _unit.text.trim(),
        'negotiated_price': price,
        'farmer_name': farmer,
        'farmer_phone': phone,
        'farmer_location': _farmerLocation.text.trim().isEmpty ? null : _farmerLocation.text.trim(),
        'harvest_date': _harvestDate.text.trim().isEmpty ? null : _harvestDate.text.trim(),
        'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      });
      _snack('Farm listing submitted');
      _produceName.clear();
      _quantity.clear();
      _negotiatedPrice.clear();
      _farmerName.clear();
      _farmerPhone.clear();
      _farmerLocation.clear();
      _harvestDate.clear();
      _notes.clear();
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

  String _fmt(Object? v) {
    if (v is num) return _money.format(v);
    final n = double.tryParse(v?.toString() ?? '');
    return n != null ? _money.format(n) : '—';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _listings.isEmpty && _orders.isEmpty) {
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
          Row(
            children: [
              Expanded(
                child: Text(
                  'Farm listings',
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
            _buildForm(),
            const SizedBox(height: 16),
          ],
          if (_listings.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No farm listings', style: TextStyle(color: DfColors.muted))),
            )
          else
            ..._listings.map((l) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  title: Text(
                    l['produce_name']?.toString() ?? 'Produce',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    '${l['quantity_available']} ${l['unit'] ?? 'kg'} · ${_fmt(l['negotiated_price'])}\n'
                    '${l['farmer_name'] ?? ''} · ${l['farmer_phone'] ?? ''}',
                    style: const TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                  isThreeLine: true,
                  trailing: Text(
                    l['is_published'] == true ? 'Live' : 'Pending',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: l['is_published'] == true ? DfColors.brand : Colors.orange.shade700,
                    ),
                  ),
                ),
              );
            }),
          const SizedBox(height: 20),
          Text('Farm orders', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (_orders.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No farm orders', style: TextStyle(color: DfColors.muted))),
            )
          else
            ..._orders.map((o) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  title: Text(
                    o['produce_name']?.toString() ?? o['customer_name']?.toString() ?? 'Order',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    '${o['status'] ?? '—'} · ${_fmt(o['total_amount'] ?? o['amount'])}',
                    style: const TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildForm() {
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
          Text('New farm listing', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          TextField(
            controller: _produceName,
            decoration: const InputDecoration(labelText: 'Produce name *'),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _quantity,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Quantity *'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _unit,
                  decoration: const InputDecoration(labelText: 'Unit'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _negotiatedPrice,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Negotiated price (GHS) *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _farmerName,
            decoration: const InputDecoration(labelText: 'Farmer name *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _farmerPhone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Farmer phone *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _farmerLocation,
            decoration: const InputDecoration(labelText: 'Farmer location'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _harvestDate,
            readOnly: true,
            onTap: _pickHarvestDate,
            decoration: const InputDecoration(
              labelText: 'Harvest date',
              suffixIcon: Icon(Icons.calendar_today_outlined),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _notes,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: _creating ? null : _create,
            child: _creating
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Submit listing'),
          ),
        ],
      ),
    );
  }
}

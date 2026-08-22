import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class OrderBundleScreen extends StatefulWidget {
  const OrderBundleScreen({super.key, required this.bundle});
  final Map<String, dynamic> bundle;

  @override
  State<OrderBundleScreen> createState() => _OrderBundleScreenState();
}

class _OrderBundleScreenState extends State<OrderBundleScreen> {
  final _phone = TextEditingController();
  String _method = 'manual';
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.createDataOrder(
        bundleId: widget.bundle['id'].toString(),
        recipientPhone: _phone.text,
        paymentMethod: _method,
      );
      setState(() => _result = data);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _num(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.bundle;
    final price = _num(b['price']);
    final payment = _result?['payment'] as Map?;
    final ref = payment?['reference']?.toString();
    final momo = payment?['momo'] as Map?;
    final method = payment?['method']?.toString() ?? _method;

    return Scaffold(
      appBar: AppBar(title: Text(b['name']?.toString() ?? 'Order')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [DfColors.brandDark, DfColors.brand]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${b['provider']} · ${b['size_gb']}GB',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 6),
                Text(
                  'GHS ${price.toStringAsFixed(2)}',
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (_result == null) ...[
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: const InputDecoration(
                labelText: 'Beneficiary phone',
                hintText: '024XXXXXXX',
                counterText: '',
                prefixIcon: Icon(Icons.smartphone),
              ),
            ),
            const SizedBox(height: 12),
            Text('Pay with', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'manual', label: Text('MoMo'), icon: Icon(Icons.phone_android)),
                ButtonSegment(value: 'wallet', label: Text('Wallet'), icon: Icon(Icons.account_balance_wallet)),
              ],
              selected: {_method},
              onSelectionChanged: (s) => setState(() => _method = s.first),
            ),
            const SizedBox(height: 8),
            Text(
              _method == 'wallet'
                  ? 'Wallet is deducted instantly and the order goes to processing.'
                  : 'You will get a payment reference. Send MoMo to the business number, then wait for confirmation.',
              style: const TextStyle(color: DfColors.muted, fontSize: 13),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: DfColors.danger)),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_method == 'wallet' ? 'Pay from wallet' : 'Place order (Manual MoMo)'),
            ),
          ] else ...[
            const Icon(Icons.check_circle, color: DfColors.brand, size: 56),
            const SizedBox(height: 8),
            Text('Order placed', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (method == 'manual') ...[
              _InfoTile(label: 'Pay to', value: '${momo?['number']} (${momo?['name']})'),
              _InfoTile(label: 'Amount', value: 'GHS ${price.toStringAsFixed(2)}'),
              _InfoTile(
                label: 'Reference',
                value: ref ?? '-',
                trailing: IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: ref == null
                      ? null
                      : () {
                          Clipboard.setData(ClipboardData(text: ref));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Reference copied')),
                          );
                        },
                ),
              ),
            ] else ...[
              _InfoTile(label: 'Status', value: _result?['order']?['status']?.toString() ?? 'processing'),
              _InfoTile(label: 'Reference', value: ref ?? '-'),
              if (payment?['remaining_wallet'] != null)
                _InfoTile(
                  label: 'Wallet left',
                  value: 'GHS ${_num(payment?['remaining_wallet']).toStringAsFixed(2)}',
                ),
            ],
            const SizedBox(height: 8),
            Text(
              payment?['instructions']?.toString() ?? '',
              style: const TextStyle(color: DfColors.muted),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Done'),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.label, required this.value, this.trailing});
  final String label;
  final String value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        title: Text(label, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
        subtitle: Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
        trailing: trailing,
      ),
    );
  }
}

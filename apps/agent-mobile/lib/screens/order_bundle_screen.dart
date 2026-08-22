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

  @override
  Widget build(BuildContext context) {
    final b = widget.bundle;
    final price = (b['price'] is num) ? (b['price'] as num).toDouble() : double.tryParse('${b['price']}') ?? 0;
    final payment = _result?['payment'] as Map?;
    final ref = payment?['reference']?.toString();
    final momo = payment?['momo'] as Map?;

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
                  : const Text('Place order (Manual MoMo)'),
            ),
          ] else ...[
            const Icon(Icons.check_circle, color: DfColors.brand, size: 56),
            const SizedBox(height: 8),
            Text('Order placed', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
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

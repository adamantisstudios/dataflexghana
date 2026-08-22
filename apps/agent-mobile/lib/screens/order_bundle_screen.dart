import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class OrderBundleScreen extends StatefulWidget {
  const OrderBundleScreen({
    super.key,
    required this.bundle,
    this.walletBalance = 0,
  });
  final Map<String, dynamic> bundle;
  final double walletBalance;

  @override
  State<OrderBundleScreen> createState() => _OrderBundleScreenState();
}

class _OrderBundleScreenState extends State<OrderBundleScreen> {
  final _phone = TextEditingController();
  String _method = 'manual';
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;
  late double _walletBalance;
  Map<String, dynamic>? _momo;

  @override
  void initState() {
    super.initState();
    _walletBalance = widget.walletBalance;
    _refreshWallet();
  }

  Future<void> _refreshWallet() async {
    try {
      final w = await ApiClient.instance.wallet(forceRefresh: true);
      if (!mounted) return;
      final bal = w['wallet_balance'];
      setState(() {
        _walletBalance = bal is num ? bal.toDouble() : double.tryParse('$bal') ?? _walletBalance;
        _momo = w['momo'] is Map ? Map<String, dynamic>.from(w['momo'] as Map) : null;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '');
    if (phone.length != 10) {
      setState(() => _error = 'Enter a valid 10-digit Ghana phone number');
      return;
    }
    final price = _num(widget.bundle['price']);
    if (_method == 'wallet' && _walletBalance < price) {
      setState(() => _error = 'Insufficient wallet. Top up first or pay with MoMo.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.createDataOrder(
        bundleId: widget.bundle['id'].toString(),
        recipientPhone: phone,
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
    final momo = payment?['momo'] as Map? ?? _momo;
    final method = payment?['method']?.toString() ?? _method;
    final canWallet = _walletBalance >= price;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/dataflex_logo.png', height: 26),
            const SizedBox(width: 8),
            Expanded(child: Text(b['name']?.toString() ?? 'Order', overflow: TextOverflow.ellipsis)),
          ],
        ),
      ),
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
                  '${b['provider'] ?? b['network']} · ${b['size_gb']}GB',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 6),
                Text(
                  'GHS ${price.toStringAsFixed(2)}',
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your wallet: GHS ${_walletBalance.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
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
            const SizedBox(height: 16),
            Text('Payment method', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 10),
            _PayOption(
              selected: _method == 'manual',
              title: 'Manual MoMo',
              subtitle: 'Pay ${momo?['number'] ?? '0557943392'} — get a reference after placing order',
              icon: Icons.phone_android,
              onTap: () => setState(() => _method = 'manual'),
            ),
            const SizedBox(height: 10),
            _PayOption(
              selected: _method == 'wallet',
              title: 'Wallet',
              subtitle: canWallet
                  ? 'Instant deduct · order goes to processing'
                  : 'Need GHS ${price.toStringAsFixed(2)} — balance too low',
              icon: Icons.account_balance_wallet,
              enabled: true,
              onTap: () => setState(() => _method = 'wallet'),
            ),
            if (_method == 'manual') ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
                ),
                child: Text(
                  'After you place the order, send GHS ${price.toStringAsFixed(2)} to '
                  '${momo?['number'] ?? '0557943392'} (${momo?['name'] ?? 'Adamantis Solutions'}) '
                  'using the payment reference shown next.',
                  style: const TextStyle(fontSize: 13, height: 1.35),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: DfColors.danger)),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_method == 'wallet' ? 'Pay GHS ${price.toStringAsFixed(2)} from wallet' : 'Place MoMo order'),
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
                label: 'Reference (use this on MoMo)',
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
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Done'),
            ),
          ],
        ],
      ),
    );
  }
}

class _PayOption extends StatelessWidget {
  const _PayOption({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.enabled = true,
  });

  final bool selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? DfColors.brand.withValues(alpha: 0.1) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? DfColors.brand : DfColors.brand.withValues(alpha: 0.15),
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: selected ? DfColors.brandDark : DfColors.muted),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(subtitle, style: const TextStyle(color: DfColors.muted, fontSize: 12)),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? DfColors.brand : DfColors.muted,
              ),
            ],
          ),
        ),
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

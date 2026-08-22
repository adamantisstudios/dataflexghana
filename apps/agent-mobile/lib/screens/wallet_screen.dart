import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  final _amount = TextEditingController();
  final _ref = TextEditingController();
  bool _topupLoading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amount.dispose();
    _ref.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = true}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.wallet(forceRefresh: force);
      setState(() => _data = data);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitTopup() async {
    final amount = double.tryParse(_amount.text.trim());
    if (amount == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount')));
      return;
    }
    setState(() => _topupLoading = true);
    try {
      final res = await ApiClient.instance.walletTopup(
        amount: amount,
        paymentReference: _ref.text.trim(),
      );
      if (!mounted) return;
      final payment = res['payment'] as Map?;
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Top-up submitted'),
          content: Text(payment?['instructions']?.toString() ?? 'Admin will credit after MoMo verification.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        ),
      );
      _amount.clear();
      _ref.clear();
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _topupLoading = false);
    }
  }

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final momo = _data?['momo'] as Map?;
    final txs = (_data?['transactions'] is List)
        ? (_data!['transactions'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];

    final body = _loading
        ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
        : _error != null
            ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
            : RefreshIndicator(
                onRefresh: () => _load(force: true),
                color: DfColors.brand,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(22),
                        gradient: const LinearGradient(
                          colors: [DfColors.brandDark, DfColors.brand],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Wallet balance', style: TextStyle(color: Colors.white70)),
                          Text(
                            'GHS ${_n(_data?['wallet_balance']).toStringAsFixed(2)}',
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Commission available  GHS ${_n(_data?['commission_balance']).toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text('Manual MoMo top-up', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                    const SizedBox(height: 6),
                    Text(
                      'Min GHS ${_n(_data?['topup_min_manual']).toStringAsFixed(0)}. Send to ${momo?['number'] ?? '0557943392'} (${momo?['name'] ?? 'Adamantis Solutions'}).',
                      style: const TextStyle(color: DfColors.muted, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _amount,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Amount (GHS)', prefixIcon: Icon(Icons.payments)),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _ref,
                      decoration: InputDecoration(
                        labelText: 'MoMo transaction reference',
                        prefixIcon: const Icon(Icons.tag),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.content_paste),
                          onPressed: () async {
                            final data = await Clipboard.getData(Clipboard.kTextPlain);
                            if (data?.text != null) _ref.text = data!.text!.trim();
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _topupLoading ? null : _submitTopup,
                      child: _topupLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Submit top-up'),
                    ),
                    const SizedBox(height: 24),
                    Text('Recent transactions', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                    const SizedBox(height: 10),
                    if (txs.isEmpty)
                      const Text('No transactions yet', style: TextStyle(color: DfColors.muted))
                    else
                      ...txs.map((t) {
                        final created = DateTime.tryParse(t['created_at']?.toString() ?? '');
                        final when = created == null
                            ? ''
                            : DateFormat('dd MMM · HH:mm').format(created.toLocal());
                        final amt = _n(t['amount']);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      t['description']?.toString() ?? t['transaction_type']?.toString() ?? 'Txn',
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      '${t['status']} · ${t['reference_code'] ?? ''} · $when',
                                      style: const TextStyle(color: DfColors.muted, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                'GHS ${amt.toStringAsFixed(2)}',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              );

    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: body,
    );
  }
}

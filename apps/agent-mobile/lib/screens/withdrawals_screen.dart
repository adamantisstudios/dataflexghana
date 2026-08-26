import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class WithdrawalsScreen extends StatefulWidget {
  const WithdrawalsScreen({super.key});

  @override
  State<WithdrawalsScreen> createState() => _WithdrawalsScreenState();
}

class _WithdrawalsScreenState extends State<WithdrawalsScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  final _amount = TextEditingController();
  final _momo = TextEditingController();

  static const _minAmount = 10.0;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _amount.dispose();
    _momo.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final agent = await SessionStore.instance.getAgent();
    final momo = agent?['momo_number']?.toString() ?? agent?['payment_line']?.toString() ?? '';
    if (momo.isNotEmpty && _momo.text.isEmpty) _momo.text = momo;
    await _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getWithdrawals();
      setState(() => _data = data);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amount.text.trim());
    final momo = _momo.text.trim();
    if (amount == null || amount < _minAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Minimum withdrawal is GHS ${_minAmount.toStringAsFixed(0)}')),
      );
      return;
    }
    if (momo.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid MoMo number')));
      return;
    }
    setState(() => _submitting = true);
    try {
      final res = await ApiClient.instance.requestWithdraw(amount: amount, momoNumber: momo);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']?.toString() ?? 'Withdrawal submitted')),
      );
      _amount.clear();
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = _data?['summary'] is Map
        ? Map<String, dynamic>.from(_data!['summary'] as Map)
        : <String, dynamic>{};
    final available = _n(summary['availableForWithdrawal']);
    final hasPending = _data?['hasPendingWithdrawal'] == true;
    final monthly = (_data?['monthlyWithdrawalCount'] is num)
        ? (_data!['monthlyWithdrawalCount'] as num).toInt()
        : 0;
    final list = (_data?['withdrawals'] is List)
        ? (_data!['withdrawals'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    final breakdown = (_data?['breakdown'] is List)
        ? (_data!['breakdown'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];

    return Scaffold(
      appBar: AppBar(title: const Text('Withdrawals')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                    ),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFB71C1C), Color(0xFFE53935)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Available to withdraw', style: TextStyle(color: Colors.white70)),
                        Text(
                          'GHS ${available.toStringAsFixed(2)}',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'This month: $monthly request(s) · Min GHS ${_minAmount.toStringAsFixed(0)}',
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  if (breakdown.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text('Commission breakdown', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...breakdown.map((b) {
                      final type = b['source_type']?.toString().replaceAll('_', ' ') ?? 'Other';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(type, style: const TextStyle(color: DfColors.muted)),
                            Text('GHS ${_n(b['total_amount']).toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                      );
                    }),
                  ],
                  const SizedBox(height: 18),
                  Text('Request withdrawal', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                  if (hasPending)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        'You already have a pending withdrawal. Wait for admin to process it.',
                        style: TextStyle(color: DfColors.danger, fontSize: 13),
                      ),
                    ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _amount,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                    decoration: const InputDecoration(labelText: 'Amount (GHS)', hintText: 'e.g. 50'),
                    enabled: !hasPending,
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _momo,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'MoMo number', hintText: '0XXXXXXXXX'),
                    enabled: !hasPending,
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: (hasPending || _submitting) ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Submit withdrawal'),
                  ),
                  const SizedBox(height: 24),
                  Text('History', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                  const SizedBox(height: 8),
                  if (list.isEmpty)
                    const Text('No withdrawals yet.', style: TextStyle(color: DfColors.muted))
                  else
                    ...list.map((w) {
                      final status = w['status']?.toString() ?? '—';
                      final when = w['requested_at']?.toString();
                      String dateLabel = '—';
                      if (when != null) {
                        final d = DateTime.tryParse(when);
                        if (d != null) dateLabel = DateFormat.yMMMd().add_jm().format(d.toLocal());
                      }
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          title: Text(
                            'GHS ${_n(w['amount']).toStringAsFixed(2)}',
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text('$status · ${w['momo_number'] ?? ''} · $dateLabel'),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class SavingsScreen extends StatefulWidget {
  const SavingsScreen({super.key});

  @override
  State<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends State<SavingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _plans = [];
  List<Map<String, dynamic>> _accounts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final plansRes = await ApiClient.instance.getSavingsPlans();
      final savRes = await ApiClient.instance.getSavings();
      setState(() {
        _plans = (plansRes['plans'] is List)
            ? (plansRes['plans'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _accounts = (savRes['savings'] is List)
            ? (savRes['savings'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Future<void> _openPlan(Map<String, dynamic> plan) async {
    final amountCtrl = TextEditingController(text: _n(plan['minimum_amount']).toStringAsFixed(0));
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(plan['name']?.toString() ?? 'Open savings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${plan['formattedInterestRate'] ?? '${plan['interest_rate']}%'} · ${plan['durationText'] ?? '${plan['duration_months']} months'}',
              style: const TextStyle(color: DfColors.muted),
            ),
            const SizedBox(height: 8),
            Text(
              'Min ${plan['formattedMinAmount'] ?? 'GHS ${_n(plan['minimum_amount']).toStringAsFixed(0)}'} · paid from wallet',
              style: const TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              decoration: const InputDecoration(labelText: 'Deposit amount (GHS)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Activate')),
        ],
      ),
    );
    if (ok != true) return;
    final amount = double.tryParse(amountCtrl.text.trim());
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount')));
      return;
    }
    try {
      await ApiClient.instance.createSavings(savingsPlanId: plan['id'].toString(), amount: amount);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Savings activated')));
      await _load();
      _tabs.animateTo(1);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _withdraw(Map<String, dynamic> account) async {
    final agent = await SessionStore.instance.getAgent();
    final amountCtrl = TextEditingController(text: _n(account['current_balance']).toStringAsFixed(2));
    final momoCtrl = TextEditingController(
      text: agent?['momo_number']?.toString() ?? agent?['phone_number']?.toString() ?? '',
    );
    var network = 'MTN';
    var type = account['isMatured'] == true ? 'full' : 'early';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Withdraw savings'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Amount'),
                ),
                const SizedBox(height: 8),
                TextField(controller: momoCtrl, decoration: const InputDecoration(labelText: 'MoMo number')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: network,
                  decoration: const InputDecoration(labelText: 'Network'),
                  items: const [
                    DropdownMenuItem(value: 'MTN', child: Text('MTN')),
                    DropdownMenuItem(value: 'Vodafone', child: Text('Vodafone')),
                    DropdownMenuItem(value: 'AirtelTigo', child: Text('AirtelTigo')),
                  ],
                  onChanged: (v) => setLocal(() => network = v ?? 'MTN'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: const [
                    DropdownMenuItem(value: 'full', child: Text('Full')),
                    DropdownMenuItem(value: 'partial', child: Text('Partial')),
                    DropdownMenuItem(value: 'early', child: Text('Early')),
                  ],
                  onChanged: (v) => setLocal(() => type = v ?? 'full'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Request')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    final amount = double.tryParse(amountCtrl.text.trim());
    if (amount == null || amount <= 0) return;
    try {
      await ApiClient.instance.savingsWithdraw(
        savingsId: account['id'].toString(),
        amount: amount,
        withdrawalType: type,
        mobileMoneyNumber: momoCtrl.text.trim(),
        mobileMoneyNetwork: network,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal requested')));
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Savings Plans'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'Plans'), Tab(text: 'My savings')]),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : TabBarView(
              controller: _tabs,
              children: [
                RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _error != null
                      ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _plans.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final p = _plans[i];
                            return Card(
                              child: ListTile(
                                title: Text(p['name']?.toString() ?? 'Plan',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                subtitle: Text(
                                  '${p['description'] ?? ''}\n'
                                  '${p['formattedInterestRate'] ?? '${p['interest_rate']}%'} · '
                                  '${p['durationText'] ?? ''} · Min ${p['formattedMinAmount'] ?? ''}',
                                ),
                                isThreeLine: true,
                                trailing: ElevatedButton(
                                  onPressed: () => _openPlan(p),
                                  style: ElevatedButton.styleFrom(minimumSize: const Size(72, 40)),
                                  child: const Text('Open'),
                                ),
                              ),
                            );
                          },
                        ),
                ),
                RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _accounts.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No active savings yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _accounts.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final a = _accounts[i];
                            final plan = a['savings_plans'];
                            final planName = plan is Map ? plan['name']?.toString() : 'Savings';
                            final progress = (a['progress'] is num) ? (a['progress'] as num).toDouble() : 0.0;
                            final maturity = a['maturity_date']?.toString();
                            String matLabel = '—';
                            if (maturity != null) {
                              final d = DateTime.tryParse(maturity);
                              if (d != null) matLabel = DateFormat.yMMMd().format(d.toLocal());
                            }
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(planName ?? 'Savings',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
                                    Text(
                                      'Balance GHS ${_n(a['current_balance']).toStringAsFixed(2)} · ${a['status']}',
                                      style: const TextStyle(color: DfColors.muted),
                                    ),
                                    const SizedBox(height: 8),
                                    LinearProgressIndicator(
                                      value: (progress / 100).clamp(0, 1),
                                      color: DfColors.brand,
                                      backgroundColor: DfColors.brand.withValues(alpha: 0.15),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      '${progress.toStringAsFixed(0)}% · ${a['daysRemaining'] ?? '—'} days left · Matures $matLabel',
                                      style: const TextStyle(fontSize: 12, color: DfColors.muted),
                                    ),
                                    const SizedBox(height: 10),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton(
                                        onPressed: a['status']?.toString() == 'active' ? () => _withdraw(a) : null,
                                        child: const Text('Withdraw'),
                                      ),
                                    ),
                                  ],
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

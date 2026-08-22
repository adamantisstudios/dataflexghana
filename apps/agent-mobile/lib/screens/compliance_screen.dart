import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'compliance_form_screen.dart';

class ComplianceScreen extends StatefulWidget {
  const ComplianceScreen({super.key});

  @override
  State<ComplianceScreen> createState() => _ComplianceScreenState();
}

class _ComplianceScreenState extends State<ComplianceScreen> {
  Map<String, dynamic>? _payload;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.compliance(forceRefresh: force);
      setState(() => _payload = data);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _fee(Map<String, dynamic> form) {
    final p = form['pricing'];
    if (p is Map && p['default_fee'] is num) return (p['default_fee'] as num).toDouble();
    return 0;
  }

  double _commission(Map<String, dynamic> form) {
    final p = form['pricing'];
    if (p is Map && p['default_commission'] is num) return (p['default_commission'] as num).toDouble();
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final forms = (_payload?['forms'] is List)
        ? (_payload!['forms'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    final submissions = (_payload?['submissions'] is List)
        ? (_payload!['submissions'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compliance'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : RefreshIndicator(
                  onRefresh: () => _load(force: true),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text('Available forms', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      const Text(
                        'Full forms with pricing from the platform. Fill all steps and upload documents.',
                        style: TextStyle(color: DfColors.muted, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      ...forms.map((f) {
                        final fee = _fee(f);
                        final comm = _commission(f);
                        final tiers = (f['pricing'] is Map) ? (f['pricing']['tiers'] as List?) : null;
                        final feeLabel = tiers != null && tiers.isNotEmpty
                            ? 'From GHS ${((tiers.first as Map)['default_amount'] as num?)?.toStringAsFixed(2) ?? '—'}'
                            : fee > 0
                                ? 'GHS ${fee.toStringAsFixed(2)}'
                                : 'Free';
                        return Card(
                          elevation: 0,
                          margin: const EdgeInsets.only(bottom: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(color: DfColors.brand.withValues(alpha: 0.15)),
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: DfColors.brand.withValues(alpha: 0.12),
                              child: const Icon(Icons.description_outlined, color: DfColors.brandDark),
                            ),
                            title: Text(f['form_name']?.toString() ?? 'Form', style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(
                              '${f['form_description'] ?? ''}\n$feeLabel${comm > 0 ? ' · Earn GHS ${comm.toStringAsFixed(2)}' : ''}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            isThreeLine: true,
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () async {
                              final ok = await Navigator.of(context).push<bool>(
                                MaterialPageRoute(builder: (_) => ComplianceFormScreen(formSummary: f)),
                              );
                              if (ok == true) _load(force: true);
                            },
                          ),
                        );
                      }),
                      const SizedBox(height: 18),
                      Text('Your submissions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      if (submissions.isEmpty)
                        const Text('No submissions yet.', style: TextStyle(color: DfColors.muted)),
                      ...submissions.map((s) {
                        final created = DateTime.tryParse(s['created_at']?.toString() ?? '');
                        final when = created == null ? '' : DateFormat('dd MMM · HH:mm').format(created.toLocal());
                        return Card(
                          elevation: 0,
                          child: ListTile(
                            title: Text(s['form_id']?.toString() ?? 'Form'),
                            subtitle: Text('${s['status']} · $when'),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}

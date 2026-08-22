import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'compliance_submit_screen.dart';

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
                      const SizedBox(height: 10),
                      ...forms.map((f) {
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
                            subtitle: Text(f['form_description']?.toString() ?? ''),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () async {
                              final ok = await Navigator.of(context).push<bool>(
                                MaterialPageRoute(
                                  builder: (_) => ComplianceSubmitScreen(form: f),
                                ),
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
                        return Card(
                          elevation: 0,
                          child: ListTile(
                            title: Text(s['form_id']?.toString() ?? 'Form'),
                            subtitle: Text('${s['status']} · ${s['created_at']}'),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}

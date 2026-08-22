import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class ComplianceSubmitScreen extends StatefulWidget {
  const ComplianceSubmitScreen({super.key, required this.form});
  final Map<String, dynamic> form;

  @override
  State<ComplianceSubmitScreen> createState() => _ComplianceSubmitScreenState();
}

class _ComplianceSubmitScreenState extends State<ComplianceSubmitScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _notes = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.submitCompliance(
        formId: widget.form['id']?.toString() ?? widget.form['form_type']?.toString() ?? '',
        clientName: _name.text,
        clientPhone: _phone.text,
        notes: _notes.text,
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
    final title = widget.form['form_name']?.toString() ?? 'Compliance form';
    final payment = _result?['payment'] as Map?;
    final momo = payment?['momo'] as Map?;

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_result == null) ...[
            Text(widget.form['form_description']?.toString() ?? '', style: const TextStyle(color: DfColors.muted)),
            const SizedBox(height: 16),
            TextField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Client full name', prefixIcon: Icon(Icons.person_outline)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: const InputDecoration(
                labelText: 'Client phone',
                counterText: '',
                prefixIcon: Icon(Icons.phone_iphone),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Notes (optional)', alignLabelWithHint: true),
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
                  : const Text('Submit for processing'),
            ),
          ] else ...[
            const Icon(Icons.verified, color: DfColors.brand, size: 56),
            const SizedBox(height: 8),
            Text('Submitted', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(payment?['instructions']?.toString() ?? '', style: const TextStyle(color: DfColors.muted)),
            const SizedBox(height: 12),
            ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              title: const Text('MoMo number'),
              subtitle: Text('${momo?['number']} · ${momo?['name']}'),
              trailing: IconButton(
                icon: const Icon(Icons.copy),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: '${momo?['number']}'));
                },
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Back to compliance'),
            ),
          ],
        ],
      ),
    );
  }
}

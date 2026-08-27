import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

const _measurementGuide = [
  'Neck — around the base of the neck',
  'Bust / Chest — around the fullest part',
  'Under bust — directly beneath the bust',
  'Waist — around the natural waistline',
  'Hip — around the fullest part of the hips',
  'Thigh — around the fullest part of one thigh',
  'Upper arm — around the fullest part',
  'Shoulder to waist',
  'Shoulder to floor',
  'Shoulder width — across the back',
  'Inner arm length',
];

/// Native version of the website's "Request This Design" form. The submission
/// is stored server-side, but the designer is only notified once the returned
/// WhatsApp link is opened, so we always hand off to WhatsApp on success.
class FashionRequestScreen extends StatefulWidget {
  const FashionRequestScreen({
    super.key,
    required this.productId,
    required this.productCode,
    required this.productName,
    this.referMode = false,
  });

  final String productId;
  final String productCode;
  final String productName;
  final bool referMode;

  @override
  State<FashionRequestScreen> createState() => _FashionRequestScreenState();
}

class _FashionRequestScreenState extends State<FashionRequestScreen> {
  final _formKey = GlobalKey<FormState>();

  final _name = TextEditingController();
  final _whatsapp = TextEditingController();
  final _location = TextEditingController();
  final _timeline = TextEditingController();
  final _measurements = TextEditingController();
  final _notes = TextEditingController();
  final _friendWhatsapp = TextEditingController();

  bool _submitting = false;
  bool _guideOpen = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _prefill();
  }

  Future<void> _prefill() async {
    final agent = await SessionStore.instance.getAgent();
    if (agent == null || !mounted) return;
    setState(() {
      _name.text = (agent['full_name'] ?? agent['agent_name'] ?? '').toString();
      _whatsapp.text = (agent['phone_number'] ?? '').toString();
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _whatsapp.dispose();
    _location.dispose();
    _timeline.dispose();
    _measurements.dispose();
    _notes.dispose();
    _friendWhatsapp.dispose();
    super.dispose();
  }

  String? _validatePhone(String? v) {
    final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return 'WhatsApp number is required';
    if (digits.length < 10 || digits.length > 15) {
      return 'Enter a valid number (10–15 digits, include country code)';
    }
    return null;
  }

  Future<void> _openWhatsApp(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final Map<String, dynamic> res;
      if (widget.referMode) {
        res = await ApiClient.instance.fashionReferral(
          productId: widget.productId,
          productCode: widget.productCode,
          productName: widget.productName,
          referrerName: _name.text.trim(),
          referrerWhatsapp: _whatsapp.text.trim(),
          friendWhatsapp: _friendWhatsapp.text.trim(),
        );
      } else {
        res = await ApiClient.instance.fashionProjectRequest(
          productId: widget.productId,
          productCode: widget.productCode,
          productName: widget.productName,
          clientName: _name.text.trim(),
          clientWhatsapp: _whatsapp.text.trim(),
          clientLocation: _location.text,
          timelinePreference: _timeline.text,
          measurements: _measurements.text,
          additionalNotes: _notes.text,
        );
      }

      final data = res['data'];
      final waUrl = data is Map ? data['whatsappUrl']?.toString() : null;
      final adminUrl = data is Map ? data['adminNotificationUrl']?.toString() : null;

      if (!mounted) return;
      await _showSuccess(waUrl: waUrl, adminUrl: adminUrl);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _showSuccess({String? waUrl, String? adminUrl}) async {
    final refer = widget.referMode;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: Color(0xFF15803D)),
            const SizedBox(width: 8),
            Text(refer ? 'Referral saved' : 'Request sent',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
          ],
        ),
        content: Text(
          refer
              ? 'Your referral has been recorded. Send the message on WhatsApp so your friend receives the design.'
              : 'Your request has been recorded. Finish by sending it to the designer on WhatsApp — that is how they receive your measurements.',
          style: const TextStyle(height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Later'),
          ),
          ElevatedButton.icon(
            onPressed: waUrl == null
                ? null
                : () async {
                    Navigator.of(ctx).pop();
                    await _openWhatsApp(waUrl);
                    if (adminUrl != null) {
                      await Future<void>.delayed(const Duration(seconds: 1));
                      await _openWhatsApp(adminUrl);
                    }
                  },
            icon: const Icon(Icons.chat),
            label: Text(refer ? 'Send to friend' : 'Send on WhatsApp'),
          ),
        ],
      ),
    );
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final refer = widget.referMode;
    return Scaffold(
      appBar: AppBar(title: Text(refer ? 'Refer This Design' : 'Request This Design')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: DfColors.brand.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.checkroom, color: DfColors.brand),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.productName,
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                        Text(widget.productCode,
                            style: const TextStyle(
                                color: DfColors.muted, fontFamily: 'monospace', fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            _field(_name, refer ? 'Your name *' : 'Your full name *',
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Name is required' : null),
            _field(_whatsapp, 'Your WhatsApp (with country code) *',
                keyboard: TextInputType.phone, validator: _validatePhone),

            if (refer)
              _field(_friendWhatsapp, "Friend's WhatsApp (with country code) *",
                  keyboard: TextInputType.phone, validator: _validatePhone)
            else ...[
              _field(_location, 'Your location'),
              _field(_timeline, 'Timeline (e.g. 2 weeks)'),
              const SizedBox(height: 4),
              _guideCard(),
              const SizedBox(height: 12),
              _field(_measurements, 'Your measurements', maxLines: 6),
              _field(_notes, 'Additional notes', maxLines: 3),
            ],

            if (_error != null) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: DfColors.danger.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
              ),
            ],

            const SizedBox(height: 20),
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.send),
                label: Text(_submitting
                    ? 'Sending…'
                    : refer
                        ? 'Refer & earn'
                        : 'Submit request'),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _guideCard() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.25)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: _guideOpen,
          onExpansionChanged: (v) => setState(() => _guideOpen = v),
          leading: const Icon(Icons.straighten, color: DfColors.brand),
          title: Text('Measurement guide',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15)),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          children: [
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Measure over light clothing and keep the tape snug but not tight. '
                'Include the unit (inches or cm) for every value.',
                style: TextStyle(color: DfColors.muted, height: 1.45, fontSize: 13),
              ),
            ),
            const SizedBox(height: 10),
            ..._measurementGuide.map(
              (m) => Padding(
                padding: const EdgeInsets.only(bottom: 5),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('•  ', style: TextStyle(color: DfColors.brand)),
                    Expanded(child: Text(m, style: const TextStyle(fontSize: 13, height: 1.35))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    int maxLines = 1,
    TextInputType? keyboard,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: c,
        maxLines: maxLines,
        keyboardType: keyboard,
        validator: validator,
        decoration: InputDecoration(labelText: label, alignLabelWithHint: maxLines > 1),
      ),
    );
  }
}

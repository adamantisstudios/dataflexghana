import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

const _commitmentGhs = 20;
const _paymentStorageKey = 'grocery_paystack_reference';

class GroceriesScreen extends StatefulWidget {
  const GroceriesScreen({super.key});

  @override
  State<GroceriesScreen> createState() => _GroceriesScreenState();
}

class _GroceriesScreenState extends State<GroceriesScreen> {
  final _payerName = TextEditingController();
  final _payerEmail = TextEditingController();
  final _payerPhone = TextEditingController();

  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _landmark = TextEditingController();
  final _deliveryTime = TextEditingController();
  final _shoppingList = TextEditingController();
  final _notes = TextEditingController();

  final _picker = ImagePicker();
  final _pickedFiles = <XFile>[];
  final _uploadedUrls = <String>[];

  bool _paymentVerified = false;
  String? _paystackReference;
  bool _paying = false;
  bool _verifying = false;
  bool _submitting = false;
  bool _uploading = false;
  final _manualRef = TextEditingController();

  @override
  void initState() {
    super.initState();
    _restorePayment();
  }

  @override
  void dispose() {
    _payerName.dispose();
    _payerEmail.dispose();
    _payerPhone.dispose();
    _fullName.dispose();
    _phone.dispose();
    _whatsapp.dispose();
    _email.dispose();
    _address.dispose();
    _landmark.dispose();
    _deliveryTime.dispose();
    _shoppingList.dispose();
    _notes.dispose();
    _manualRef.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: error ? DfColors.danger : null,
      ),
    );
  }

  Future<void> _restorePayment() async {
    final prefs = await SharedPreferences.getInstance();
    final ref = prefs.getString(_paymentStorageKey);
    if (ref != null && ref.isNotEmpty) {
      await _verifyReference(ref);
    }
  }

  Future<void> _verifyReference(String reference) async {
    setState(() => _verifying = true);
    try {
      final data = await ApiClient.instance.groceryVerifyPayment(reference);
      if (data['verified'] != true) {
        throw ApiException(data['error']?.toString() ?? 'Payment could not be verified');
      }
      if (data['alreadyUsed'] == true) {
        throw ApiException('This payment has already been used for a request');
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_paymentStorageKey, reference);
      if (!mounted) return;
      setState(() {
        _paystackReference = reference;
        _paymentVerified = true;
        if (_fullName.text.isEmpty) _fullName.text = _payerName.text;
        if (_phone.text.isEmpty) _phone.text = _payerPhone.text;
        if (_email.text.isEmpty) _email.text = _payerEmail.text;
      });
      _snack('Payment confirmed! Now fill your shopping list.');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _payCommitment() async {
    if (_payerName.text.trim().isEmpty ||
        _payerEmail.text.trim().isEmpty ||
        _payerPhone.text.trim().isEmpty) {
      _snack('Enter your name, email, and phone before paying', error: true);
      return;
    }
    setState(() => _paying = true);
    try {
      final data = await ApiClient.instance.groceryPayCommitment(
        fullName: _payerName.text,
        email: _payerEmail.text,
        phone: _payerPhone.text,
      );
      final url = data['authorizationUrl']?.toString() ?? data['authorization_url']?.toString();
      final ref = data['reference']?.toString();
      if (url == null || url.isEmpty) {
        throw ApiException(data['error']?.toString() ?? 'Could not start payment');
      }
      if (ref != null && ref.isNotEmpty) {
        _manualRef.text = ref;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_paymentStorageKey, ref);
      }
      final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!ok) throw ApiException('Could not open Paystack');
      if (!mounted) return;
      _snack('Complete payment in the browser, then tap Verify with your reference.');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  Future<void> _pickImages() async {
    if (_pickedFiles.length >= 5) {
      _snack('Maximum 5 images', error: true);
      return;
    }
    final files = await _picker.pickMultiImage(imageQuality: 85);
    if (files.isEmpty) return;
    setState(() {
      for (final f in files) {
        if (_pickedFiles.length < 5) _pickedFiles.add(f);
      }
    });
  }

  Future<List<String>> _uploadFiles() async {
    if (_pickedFiles.isEmpty) return List<String>.from(_uploadedUrls);
    setState(() => _uploading = true);
    final urls = <String>[..._uploadedUrls];
    try {
      for (final file in _pickedFiles) {
        if (_uploadedUrls.any((u) => u.contains(file.name))) continue;
        final url = await ApiClient.instance.groceryUploadImage(file);
        if (url.isNotEmpty) urls.add(url);
      }
      return urls;
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submitRequest() async {
    if (!_paymentVerified || _paystackReference == null) {
      _snack('Please pay the commitment fee first', error: true);
      return;
    }
    if (_fullName.text.trim().isEmpty ||
        _phone.text.trim().isEmpty ||
        _shoppingList.text.trim().isEmpty) {
      _snack('Please fill in your name, phone, and shopping list', error: true);
      return;
    }

    setState(() => _submitting = true);
    try {
      final attachments = await _uploadFiles();
      await ApiClient.instance.grocerySubmitRequest({
        'full_name': _fullName.text.trim(),
        'phone': _phone.text.trim(),
        'whatsapp': _whatsapp.text.trim(),
        'email': _email.text.trim(),
        'address': _address.text.trim(),
        'landmark': _landmark.text.trim(),
        'delivery_time': _deliveryTime.text.trim(),
        'shopping_list': _shoppingList.text.trim(),
        'notes': _notes.text.trim(),
        'attachments': attachments,
        'paystack_reference': _paystackReference,
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_paymentStorageKey);
      if (!mounted) return;
      setState(() {
        _paymentVerified = false;
        _paystackReference = null;
        _pickedFiles.clear();
        _shoppingList.clear();
        _notes.clear();
      });
      _snack('Grocery request submitted successfully!');
      Navigator.of(context).maybePop();
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _submitting || _uploading || _paying || _verifying;
    final formLocked = !_paymentVerified || busy;

    return Scaffold(
      appBar: AppBar(title: const Text('Food & Groceries')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Submit Your Grocery Request',
            style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pay the GHS 20 commitment fee first, then complete your shopping list.',
            style: TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: DfColors.brand.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.credit_card, color: DfColors.brand),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Commitment Fee: GHS $_commitmentGhs',
                        style: GoogleFonts.dmSans(fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Secures your request slot. Non-refundable once shopping begins.',
                  style: TextStyle(color: DfColors.muted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                if (_paymentVerified) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Payment confirmed! Ref: $_paystackReference',
                      style: const TextStyle(color: DfColors.brandDark, fontWeight: FontWeight.w600),
                    ),
                  ),
                ] else ...[
                  _field(_payerName, 'Full name *', enabled: !busy),
                  const SizedBox(height: 10),
                  _field(_payerEmail, 'Email *', type: TextInputType.emailAddress, enabled: !busy),
                  const SizedBox(height: 10),
                  _field(_payerPhone, 'Phone *', type: TextInputType.phone, enabled: !busy),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: busy ? null : _payCommitment,
                    child: Text(_paying ? 'Starting payment…' : 'Pay GHS $_commitmentGhs with Paystack'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'After paying, paste your Paystack reference to verify:',
                    style: TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualRef,
                          enabled: !busy,
                          decoration: const InputDecoration(
                            labelText: 'Payment reference',
                            hintText: 'e.g. Txxxxx',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: busy
                            ? null
                            : () {
                                final r = _manualRef.text.trim();
                                if (r.isEmpty) {
                                  _snack('Enter reference', error: true);
                                  return;
                                }
                                _verifyReference(r);
                              },
                        style: FilledButton.styleFrom(backgroundColor: DfColors.brandDark),
                        child: Text(_verifying ? '…' : 'Verify'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Step 2 — Shopping request',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          _field(_fullName, 'Full name *', enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_phone, 'Phone *', type: TextInputType.phone, enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_whatsapp, 'WhatsApp', type: TextInputType.phone, enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_email, 'Email', type: TextInputType.emailAddress, enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_address, 'Delivery address', enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_landmark, 'Landmark', enabled: !formLocked),
          const SizedBox(height: 10),
          _field(_deliveryTime, 'Preferred delivery time', enabled: !formLocked),
          const SizedBox(height: 10),
          TextField(
            controller: _shoppingList,
            enabled: !formLocked,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Shopping list *',
              alignLabelWithHint: true,
              hintText: 'List items, quantities, brand preferences…',
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _notes,
            enabled: !formLocked,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notes',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: formLocked ? null : _pickImages,
            icon: const Icon(Icons.photo_library_outlined),
            label: Text('Attach images (${_pickedFiles.length}/5)'),
          ),
          if (_pickedFiles.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: _pickedFiles
                    .map(
                      (f) => Chip(
                        label: Text(f.name, style: const TextStyle(fontSize: 11)),
                        onDeleted: formLocked
                            ? null
                            : () => setState(() => _pickedFiles.remove(f)),
                      ),
                    )
                    .toList(),
              ),
            ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: formLocked ? null : _submitRequest,
            child: Text(
              _submitting || _uploading ? 'Submitting…' : 'Submit grocery request',
            ),
          ),
          const SizedBox(height: 28),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label, {
    TextInputType type = TextInputType.text,
    bool enabled = true,
  }) {
    return TextField(
      controller: c,
      keyboardType: type,
      enabled: enabled,
      decoration: InputDecoration(labelText: label),
    );
  }
}

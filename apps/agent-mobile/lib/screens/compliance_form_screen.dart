import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'compliance_signature_pad.dart';

/// Turns `a.b.0.c` keys into nested maps/lists for website-compatible form_data.
Map<String, dynamic> unflattenFormData(Map<String, dynamic> flat) {
  final root = <String, dynamic>{};
  for (final entry in flat.entries) {
    final key = entry.key;
    final value = entry.value;
    if (!key.contains('.')) {
      root[key] = value;
      continue;
    }
    final parts = key.split('.');
    dynamic cursor = root;
    for (var i = 0; i < parts.length; i++) {
      final part = parts[i];
      final last = i == parts.length - 1;
      final index = int.tryParse(part);
      if (index != null) {
        if (cursor is! List) break;
        while (cursor.length <= index) {
          cursor.add(<String, dynamic>{});
        }
        if (last) {
          cursor[index] = value;
        } else {
          final nextIsIndex = int.tryParse(parts[i + 1]) != null;
          if (cursor[index] == null || cursor[index] is! Map && !nextIsIndex) {
            cursor[index] = nextIsIndex ? <dynamic>[] : <String, dynamic>{};
          }
          cursor = cursor[index];
        }
      } else if (cursor is Map) {
        if (last) {
          cursor[part] = value;
        } else {
          final nextIsIndex = int.tryParse(parts[i + 1]) != null;
          cursor.putIfAbsent(part, () => nextIsIndex ? <dynamic>[] : <String, dynamic>{});
          cursor = cursor[part];
        }
      }
    }
  }
  return root;
}

class ComplianceFormScreen extends StatefulWidget {
  const ComplianceFormScreen({super.key, required this.formSummary});
  final Map<String, dynamic> formSummary;

  @override
  State<ComplianceFormScreen> createState() => _ComplianceFormScreenState();
}

class _ComplianceFormScreenState extends State<ComplianceFormScreen> {
  Map<String, dynamic>? _schema;
  bool _loading = true;
  String? _error;
  int _step = 0;
  final _values = <String, String>{};
  final _controllers = <String, TextEditingController>{};
  final _imageUrls = <String, String>{};
  final _localPreviews = <String, String>{};
  String? _selectedTier;
  double? _selectedCost;
  bool _submitting = false;
  bool _uploading = false;
  Map<String, dynamic>? _result;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadSchema();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  bool _hasEmbeddedSchema(Map<String, dynamic> summary) {
    final steps = summary['steps'];
    return steps is List && steps.isNotEmpty;
  }

  Future<void> _loadSchema() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final summary = Map<String, dynamic>.from(widget.formSummary);
      if (_hasEmbeddedSchema(summary)) {
        setState(() => _schema = summary);
        return;
      }

      final id = summary['id']?.toString() ?? summary['form_type']?.toString() ?? '';
      if (id.isEmpty) throw ApiException('Unknown form');

      final data = await ApiClient.instance.complianceForm(id);
      final form = data['form'];
      if (form is Map && _hasEmbeddedSchema(Map<String, dynamic>.from(form))) {
        setState(() => _schema = Map<String, dynamic>.from(form));
        return;
      }

      throw ApiException('Form schema not available. Pull to refresh the forms list and try again.');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _steps {
    final steps = _schema?['steps'];
    if (steps is! List) return [];
    return steps.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  List<Map<String, dynamic>> get _requiredImages {
    final imgs = _schema?['required_images'];
    if (imgs is! List) return [];
    return imgs.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Map<String, dynamic>? get _pricing {
    final p = _schema?['pricing'];
    return p is Map ? Map<String, dynamic>.from(p) : null;
  }

  TextEditingController _ctrl(String key) {
    return _controllers.putIfAbsent(key, () => TextEditingController(text: _values[key] ?? ''));
  }

  bool _isSignatureKey(String key) => key.contains('signature');

  Future<void> _uploadFile(String key, XFile file) async {
    setState(() => _uploading = true);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Uploading ${ _labelForKey(key)}…')));
    }
    try {
      final url = await ApiClient.instance.uploadComplianceImage(file, key);
      setState(() {
        _imageUrls[key] = url;
        _localPreviews[key] = file.path;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${_labelForKey(key)} uploaded')));
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  String _labelForKey(String key) {
    for (final img in _requiredImages) {
      if (img['key']?.toString() == key) return img['label']?.toString() ?? key;
    }
    return key;
  }

  Future<void> _openUploadOptions(String key, String label) async {
    if (_uploading) return;
    final isSignature = _isSignatureKey(key);

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 12),
              if (isSignature)
                ListTile(
                  leading: const Icon(Icons.draw, color: DfColors.brand),
                  title: const Text('Draw signature on screen'),
                  subtitle: const Text('Same as signing on the website'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final file = await Navigator.push<File>(
                      context,
                      MaterialPageRoute(builder: (_) => ComplianceSignaturePad(title: label)),
                    );
                    if (file != null) await _uploadFile(key, XFile(file.path));
                  },
                ),
              ListTile(
                leading: const Icon(Icons.photo_camera, color: DfColors.brand),
                title: Text(isSignature ? 'Take photo of signature' : 'Take photo with camera'),
                onTap: () async {
                  Navigator.pop(ctx);
                  final file = await _picker.pickImage(source: ImageSource.camera, maxWidth: 2000, imageQuality: 88);
                  if (file != null) await _uploadFile(key, file);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: DfColors.brand),
                title: const Text('Choose from gallery'),
                onTap: () async {
                  Navigator.pop(ctx);
                  final file = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 2000, imageQuality: 88);
                  if (file != null) await _uploadFile(key, file);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _validateStep(int stepIndex) {
    if (stepIndex >= _steps.length) return true;
    final fields = (_steps[stepIndex]['fields'] as List?) ?? [];
    for (final raw in fields) {
      if (raw is! Map) continue;
      final field = Map<String, dynamic>.from(raw);
      if (field['required'] != true) continue;
      final key = field['key']?.toString() ?? '';
      if (field['type']?.toString() == 'tier') {
        if (_selectedTier == null) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a processing tier')));
          return false;
        }
        continue;
      }
      final val = _ctrl(key).text.trim();
      if (val.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${field['label']} is required')));
        return false;
      }
    }
    return true;
  }

  Future<void> _submit() async {
    for (final img in _requiredImages) {
      if (img['required'] == true && !_imageUrls.containsKey(img['key'])) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please upload: ${img['label']}')),
        );
        return;
      }
    }

    final flat = <String, dynamic>{};
    for (final step in _steps) {
      for (final raw in (step['fields'] as List?) ?? []) {
        if (raw is! Map) continue;
        final field = Map<String, dynamic>.from(raw);
        final key = field['key']?.toString() ?? '';
        if (key.isEmpty || field['type']?.toString() == 'tier') continue;
        // Selects may live in _values rather than controllers.
        final fromValues = _values[key];
        final text = _ctrl(key).text.trim();
        flat[key] = (fromValues != null && fromValues.isNotEmpty) ? fromValues : text;
      }
    }
    if (_selectedTier != null) flat['selected_cost_tier'] = _selectedTier;
    if (_selectedCost != null) flat['selected_cost'] = _selectedCost;

    // Expand dotted keys (e.g. director1.first_name) into nested maps for website parity.
    final formData = unflattenFormData(flat);

    setState(() => _submitting = true);
    try {
      final id = _schema?['id']?.toString() ?? '';
      final data = await ApiClient.instance.submitComplianceForm(
        formId: id,
        formData: formData,
        images: _imageUrls.entries.map((e) => {'image_type': e.key, 'image_url': e.value}).toList(),
        selectedCost: _selectedCost,
        selectedCostTier: _selectedTier,
      );
      if (mounted) setState(() => _result = data);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _buildField(Map<String, dynamic> field) {
    final key = field['key']?.toString() ?? '';
    final type = field['type']?.toString() ?? 'text';
    final label = field['label']?.toString() ?? key;

    if (type == 'tier') {
      final tiers = (_pricing?['tiers'] as List?) ?? [];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: tiers.whereType<Map>().map((t) {
          final tier = Map<String, dynamic>.from(t);
          final id = tier['id']?.toString() ?? '';
          final amount = (tier['default_amount'] is num) ? (tier['default_amount'] as num).toDouble() : 0.0;
          final selected = _selectedTier == id;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: selected ? DfColors.brand.withValues(alpha: 0.1) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => setState(() {
                  _selectedTier = id;
                  _selectedCost = amount;
                }),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(tier['label']?.toString() ?? id, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text('${tier['days']} · ${tier['description']}', style: const TextStyle(color: DfColors.muted, fontSize: 12)),
                          ],
                        ),
                      ),
                      Text('GHS ${amount.toStringAsFixed(2)}', style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      );
    }

    if (type == 'select') {
      final options = (field['options'] as List?) ?? [];
      return DropdownButtonFormField<String>(
        initialValue: _values[key]?.isNotEmpty == true ? _values[key] : null,
        decoration: InputDecoration(labelText: label),
        items: options
            .whereType<Map>()
            .map((o) => DropdownMenuItem(value: o['value']?.toString(), child: Text(o['label']?.toString() ?? '')))
            .toList(),
        onChanged: (v) => setState(() => _values[key] = v ?? ''),
      );
    }

    if (type == 'textarea') {
      return TextField(controller: _ctrl(key), maxLines: 3, decoration: InputDecoration(labelText: label));
    }

    return TextField(
      controller: _ctrl(key),
      keyboardType: type == 'phone'
          ? TextInputType.phone
          : type == 'email'
              ? TextInputType.emailAddress
              : type == 'number'
                  ? const TextInputType.numberWithOptions(decimal: true)
                  : TextInputType.text,
      maxLength: type == 'phone' ? 10 : null,
      decoration: InputDecoration(labelText: label, counterText: type == 'phone' ? '' : null),
    );
  }

  Widget _buildUploadCard(Map<String, dynamic> img) {
    final key = img['key']?.toString() ?? '';
    final label = img['label']?.toString() ?? key;
    final required = img['required'] == true;
    final uploaded = _imageUrls.containsKey(key);
    final previewPath = _localPreviews[key];
    final isSignature = _isSignatureKey(key);

    IconData icon;
    if (isSignature) {
      icon = Icons.draw;
    } else if (key.contains('back')) {
      icon = Icons.credit_card;
    } else if (key.contains('front') || key.contains('id_')) {
      icon = Icons.badge_outlined;
    } else {
      icon = Icons.upload_file;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _uploading ? null : () => _openUploadOptions(key, label),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: uploaded ? DfColors.brand : DfColors.muted),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  if (required)
                    Text('*', style: TextStyle(color: DfColors.danger, fontWeight: FontWeight.w800)),
                  if (uploaded)
                    const Padding(
                      padding: EdgeInsets.only(left: 8),
                      child: Icon(Icons.check_circle, color: DfColors.brand, size: 20),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                uploaded
                    ? 'Uploaded · tap to replace'
                    : isSignature
                        ? 'Draw signature, snap with camera, or pick from gallery'
                        : 'Snap Ghana Card / ID with camera or pick from gallery',
                style: const TextStyle(color: DfColors.muted, fontSize: 12),
              ),
              if (previewPath != null && File(previewPath).existsSync()) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.file(File(previewPath), height: 120, width: double.infinity, fit: BoxFit.cover),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = _schema?['form_name']?.toString() ?? widget.formSummary['form_name']?.toString() ?? 'Form';

    if (_loading) {
      return Scaffold(appBar: AppBar(title: Text(title)), body: const Center(child: CircularProgressIndicator()));
    }
    if (_error != null) {
      return Scaffold(appBar: AppBar(title: Text(title)), body: Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger))));
    }

    if (_result != null) {
      final payment = _result!['payment'] as Map?;
      final momo = payment?['momo'] as Map?;
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Icon(Icons.verified, color: DfColors.brand, size: 56),
            Text('Submitted', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(payment?['instructions']?.toString() ?? '', style: const TextStyle(color: DfColors.muted)),
            ListTile(
              tileColor: Colors.white,
              title: const Text('MoMo'),
              subtitle: Text('${momo?['number']} · ${momo?['name']}'),
              trailing: IconButton(
                icon: const Icon(Icons.copy),
                onPressed: () => Clipboard.setData(ClipboardData(text: '${momo?['number']}')),
              ),
            ),
            ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Done')),
          ],
        ),
      );
    }

    final totalSteps = _steps.length + 1;
    final onDocsStep = _step >= _steps.length;
    final signatures = _requiredImages.where((i) => _isSignatureKey(i['key']?.toString() ?? '')).toList();
    final ids = _requiredImages.where((i) => !_isSignatureKey(i['key']?.toString() ?? '')).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: (_step + 1) / totalSteps, color: Colors.white, backgroundColor: Colors.white24),
        ),
      ),
      body: Column(
        children: [
          if (_pricing != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedCost != null
                        ? 'Fee: GHS ${_selectedCost!.toStringAsFixed(2)}'
                        : 'Fee: GHS ${(_pricing!['default_fee'] is num ? (_pricing!['default_fee'] as num).toDouble() : 0).toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  if (_pricing!['default_commission'] != null)
                    Text('Commission: GHS ${(_pricing!['default_commission'] as num).toStringAsFixed(2)}', style: const TextStyle(color: DfColors.muted, fontSize: 12)),
                ],
              ),
            ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              children: [
                if (!onDocsStep) ...[
                  Text(_steps[_step]['title']?.toString() ?? 'Step ${_step + 1}', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  ...(((_steps[_step]['fields'] as List?) ?? []).whereType<Map>().map((f) {
                    return Padding(padding: const EdgeInsets.only(bottom: 12), child: _buildField(Map<String, dynamic>.from(f)));
                  })),
                ] else ...[
                  Text('Signatures & documents', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  const Text(
                    'Upload each signature and Ghana Card front/back exactly as on the website. Required items are marked *.',
                    style: TextStyle(color: DfColors.muted, fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  if (signatures.isNotEmpty) ...[
                    Text('Signatures', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    ...signatures.map(_buildUploadCard),
                    const SizedBox(height: 12),
                  ],
                  if (ids.isNotEmpty) ...[
                    Text('Ghana Card / ID photos', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    ...ids.map(_buildUploadCard),
                  ],
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_step > 0)
                  Expanded(child: OutlinedButton(onPressed: () => setState(() => _step -= 1), child: const Text('Back'))),
                if (_step > 0) const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: (_submitting || _uploading)
                        ? null
                        : () async {
                            if (!onDocsStep) {
                              if (!_validateStep(_step)) return;
                              setState(() => _step += 1);
                            } else {
                              await _submit();
                            }
                          },
                    child: _submitting
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(onDocsStep ? 'Submit form' : 'Next'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

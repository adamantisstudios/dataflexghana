import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'professional_writing_screen.dart';

const _cvTypes = [
  'Europass CV – EUcountries',
  'American CV / Resume – United States',
  'Canadian Resume – Canada',
  'UK CV – United Kingdom',
  'Australian Resume – Australia Etc',
  'Singaporean CV – Singapore, Etc',
  'Swiss CV – Switzerland',
  'Chinese CV – China',
  'Middle Eastern CV – UAE, Qatar, Etc',
  'South African CV – South Africa Etc',
  'Others',
];

class ProfessionalWritingFormScreen extends StatefulWidget {
  const ProfessionalWritingFormScreen({super.key, required this.service});

  final WritingService service;

  @override
  State<ProfessionalWritingFormScreen> createState() => _ProfessionalWritingFormScreenState();
}

class _ProfessionalWritingFormScreenState extends State<ProfessionalWritingFormScreen> {
  bool _uploadMethodForm = true;
  bool _submitting = false;
  bool _costAcknowledged = false;

  final _controllers = <String, TextEditingController>{};
  String? _cvType;
  String? _documentPath;
  String? _documentName;
  String? _imagePath;
  String? _imageName;

  final _picker = ImagePicker();

  bool get _isBusiness => widget.service.id == 'business-presentation';
  bool get _isInternational => widget.service.id == 'international-resume';

  List<String> get _formKeys {
    if (_isBusiness) {
      return const [
        'businessName',
        'businessType',
        'businessDescription',
        'targetAudience',
        'keyPoints',
        'callToAction',
        'additionalNotes',
        'specialRequests',
      ];
    }
    final keys = <String>[
      'fullName',
      'email',
      'phone',
      'address',
      'country',
      'educationHistory',
      'workHistory',
      'skills',
      'certifications',
      'projects',
      'publications',
      'awards',
      'affiliations',
      'interests',
      'references',
      'specialRequests',
    ];
    if (_isInternational) keys.insert(5, 'countryIfOthers');
    return keys;
  }

  @override
  void initState() {
    super.initState();
    for (final k in _formKeys) {
      _controllers[k] = TextEditingController();
    }
    if (!_isInternational) _costAcknowledged = true;
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _c(String key) =>
      _controllers.putIfAbsent(key, TextEditingController.new);

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  Future<void> _pickDocument() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: _isBusiness
          ? const ['pdf', 'ppt', 'pptx', 'doc', 'docx']
          : const ['pdf', 'doc', 'docx'],
    );
    if (result == null || result.files.isEmpty) return;
    final f = result.files.single;
    if (f.path == null) {
      _snack('Could not read file path', error: true);
      return;
    }
    setState(() {
      _documentPath = f.path;
      _documentName = f.name;
    });
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() {
      _imagePath = file.path;
      _imageName = file.name;
    });
  }

  Map<String, dynamic> _buildFormData() {
    final map = <String, dynamic>{};
    for (final e in _controllers.entries) {
      map[e.key] = e.value.text.trim();
    }
    if (_isInternational) {
      map['cvType'] = _cvType ?? '';
    }
    return map;
  }

  Future<void> _submit() async {
    if (_isInternational) {
      if (_cvType == null || _cvType!.isEmpty) {
        _snack('Please select a CV type', error: true);
        return;
      }
      if (_cvType == 'Others' && _c('countryIfOthers').text.trim().isEmpty) {
        _snack('Please specify the country for Others', error: true);
        return;
      }
    }

    setState(() => _submitting = true);
    try {
      final formData = _buildFormData();
      String? cvType;
      if (_isInternational) {
        cvType = _cvType == 'Others' ? _c('countryIfOthers').text.trim() : _cvType;
      }

      await ApiClient.instance.submitWriting(
        serviceType: widget.service.id,
        formData: formData,
        cvType: cvType,
        documentPath: _uploadMethodForm ? null : _documentPath,
        imagePath: _uploadMethodForm && !_isBusiness ? _imagePath : null,
      );

      if (!mounted) return;
      _snack('${widget.service.title} request submitted successfully!');
      Navigator.of(context).pop(true);
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
    if (_isInternational && !_costAcknowledged) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.service.title)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.credit_card, color: Colors.blue, size: 36),
                  const SizedBox(height: 12),
                  Text(
                    'International Resume Fee',
                    style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.blue),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Processing Cost: ₵${widget.service.price}',
                    style: GoogleFonts.dmSans(fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  const Text('Duration: 2 Hours · Delivery: Email or WhatsApp'),
                  const SizedBox(height: 12),
                  const Text(
                    'Professional international CV written for your specific destination country, delivered within 2 hours of payment confirmation.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => setState(() => _costAcknowledged = true),
                    child: const Text('I Understand, Continue'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(widget.service.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Text('Fill Form'),
                  selected: _uploadMethodForm,
                  onSelected: (_) => setState(() => _uploadMethodForm = true),
                  selectedColor: DfColors.brand.withValues(alpha: 0.2),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Text('Upload Document'),
                  selected: !_uploadMethodForm,
                  onSelected: (_) => setState(() => _uploadMethodForm = false),
                  selectedColor: DfColors.brand.withValues(alpha: 0.2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Fee: ₵${widget.service.price}',
            style: GoogleFonts.dmSans(fontWeight: FontWeight.w700, color: const Color(0xFFBE185D)),
          ),
          const SizedBox(height: 16),
          if (_uploadMethodForm) ..._buildFormFields() else _buildDocumentUpload(),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _submitting ? null : () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDB2777)),
                  child: Text(_submitting ? 'Submitting…' : 'Submit Request'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
        ],
      ),
    );
  }

  List<Widget> _buildFormFields() {
    if (_isBusiness) {
      return [
        _section('Business Information', [
          _field('businessName', 'Business Name'),
          _field('businessType', 'Business Type', hint: 'e.g., Technology, Retail, Services'),
          _field('businessDescription', 'Business Description', lines: 3),
        ]),
        _section('Presentation Details', [
          _field('targetAudience', 'Target Audience', lines: 2),
          _field('keyPoints', 'Key Points', lines: 2),
          _field('callToAction', 'Call to Action', lines: 2),
          _field('additionalNotes', 'Additional Notes', lines: 2),
        ]),
        _section('Special Request Section', [
          _field(
            'specialRequests',
            'Special Requests',
            lines: 4,
            hint: 'Presentation style, focus areas, branding guidelines…',
          ),
        ]),
      ];
    }

    return [
      if (_isInternational)
        _section('CV Type Selection', [
          DropdownButtonFormField<String>(
            value: _cvType,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Select International CV Type *'),
            items: _cvTypes
                .map((t) => DropdownMenuItem(value: t, child: Text(t, overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: (v) => setState(() => _cvType = v),
          ),
          if (_cvType == 'Others') ...[
            const SizedBox(height: 10),
            _field('countryIfOthers', 'Specify Country/Region *'),
          ],
        ]),
      _section('Personal Information', [
        _field('fullName', 'Full Name'),
        _field('email', 'Email Address', type: TextInputType.emailAddress),
        _field('phone', 'Phone Number', type: TextInputType.phone),
        _field('address', 'Address'),
        _field('country', 'Country'),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _pickImage,
          icon: const Icon(Icons.image_outlined),
          label: Text(_imageName == null ? 'Profile Image' : 'Image: $_imageName'),
        ),
      ]),
      _section('Education History', [_field('educationHistory', 'Education History', lines: 3)]),
      _section('Work History', [_field('workHistory', 'Work History', lines: 3)]),
      _section('Skills', [_field('skills', 'Skills', lines: 2)]),
      _section('Certifications & Training', [_field('certifications', 'Certifications', lines: 2)]),
      _section('Projects', [_field('projects', 'Projects', lines: 2)]),
      _section('Publications & Presentations', [_field('publications', 'Publications', lines: 2)]),
      _section('Awards & Honors', [_field('awards', 'Awards', lines: 2)]),
      _section('Professional Affiliations', [_field('affiliations', 'Affiliations', lines: 2)]),
      _section('Interests & Hobbies', [_field('interests', 'Interests', lines: 2)]),
      _section('References', [_field('references', 'References', lines: 2)]),
      _section('Special Request Section', [
        _field(
          'specialRequests',
          'Special Requests',
          lines: 4,
          hint: _isInternational
              ? 'Any special formatting or style preferences…'
              : 'Tailoring notes, format preferences, etc.',
        ),
      ]),
    ];
  }

  Widget _buildDocumentUpload() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DfColors.muted.withValues(alpha: 0.3), style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          const Icon(Icons.upload_file, size: 40, color: DfColors.muted),
          const SizedBox(height: 10),
          Text(
            _isBusiness
                ? 'Upload your presentation document'
                : 'Upload your resume / CV document',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            _isBusiness ? 'PDF, PPT, PPTX, DOC, DOCX' : 'PDF, DOC, DOCX',
            style: const TextStyle(fontSize: 12, color: DfColors.muted),
          ),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: _pickDocument, child: const Text('Choose file')),
          if (_documentName != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('Selected: $_documentName', style: const TextStyle(color: DfColors.brand)),
            ),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    final spaced = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      spaced.add(children[i]);
      if (i < children.length - 1) spaced.add(const SizedBox(height: 10));
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: GoogleFonts.dmSans(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 10),
          ...spaced,
        ],
      ),
    );
  }

  Widget _field(
    String key,
    String label, {
    int lines = 1,
    String? hint,
    TextInputType type = TextInputType.text,
  }) {
    return TextField(
      controller: _c(key),
      maxLines: lines,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        alignLabelWithHint: lines > 1,
      ),
    );
  }
}

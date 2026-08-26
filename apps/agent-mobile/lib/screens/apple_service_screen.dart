import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

const _whatsAppNumber = '233246827049';

const _appleDevices = <String, List<String>>{
  'iPhone SE (2020/2022)': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone X / XR / XS / XS Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 11 / 11 Pro / 11 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 12 / 12 mini / 12 Pro / 12 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 13 / 13 mini / 13 Pro / 13 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max': [
    'Cracked Screen',
    'Battery Issues',
    'Face ID Not Working',
    'Charging Port Problem',
    'Camera Not Working',
    'Speaker Problem',
    'Water Damage',
    'Other Issue',
  ],
  'iPad (Standard)': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Port Problem',
    'Touch Not Working',
    'Software Issue',
    'Other Issue',
  ],
  'iPad Air / iPad Pro': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Port Problem',
    'Apple Pencil Issues',
    'Touch Not Working',
    'Other Issue',
  ],
  'iPad mini': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Port Problem',
    'Touch Not Working',
    'Other Issue',
  ],
  'MacBook Air': [
    'Screen Damage',
    'Keyboard Problem',
    'Battery Issues',
    'Trackpad Issue',
    'Overheating',
    'Software Issue',
    'Other Issue',
  ],
  'MacBook Pro': [
    'Screen Damage',
    'Keyboard Problem',
    'Battery Issues',
    'Trackpad Issue',
    'Overheating',
    'Logic Board Issue',
    'Other Issue',
  ],
  'iMac / Mac mini / Mac Studio': [
    'No Power',
    'Display Issue',
    'Overheating',
    'Software Issue',
    'Port / Cable Issue',
    'Other Issue',
  ],
  'Apple Watch (Series / SE / Ultra)': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Problem',
    'Crown / Button Issue',
    'Water Damage',
    'Other Issue',
  ],
  'AirPods / AirPods Pro / AirPods Max': [
    'Not Charging',
    'One Side Not Working',
    'Case Issue',
    'Connectivity Problem',
    'Sound Quality Issue',
    'Other Issue',
  ],
  'Other Apple Device': [
    'Cracked Screen',
    'Battery Issues',
    'Charging Problem',
    'Software Issue',
    'Hardware Malfunction',
    'Other Issue',
  ],
};

const _categoryData = <String, Map<String, List<String>>>{
  'Android Phones': {
    'devices': [
      'Samsung Galaxy',
      'Google Pixel',
      'OnePlus',
      'Lenovo Phone',
      'Motorola',
      'Infinix',
      'Tecno',
      'Other Android Phone',
    ],
    'issues': [
      'Cracked Screen',
      'Battery Issues',
      'Charging Port Problem',
      'Camera Not Working',
      'Software Issue',
      'Water Damage',
      'Speaker Problem',
      'Microphone Issue',
      'Power Button Problem',
      'Other Issue',
    ],
  },
  'Laptops & Computers': {
    'devices': [
      'HP Laptop',
      'Dell Laptop',
      'Lenovo Laptop',
      'ASUS Laptop',
      'MacBook Pro/Air',
      'Other Laptop',
    ],
    'issues': [
      'Screen Damage',
      'Keyboard Problem',
      'Battery Issues',
      'Hard Drive Failure',
      'Overheating',
      'Software Issue',
      'RAM Problem',
      'Power Issue',
      'Trackpad Issue',
      'Motherboard Problem',
      'Other Issue',
    ],
  },
  'Home Appliances': {
    'devices': [
      'Television (TV)',
      'Refrigerator',
      'Microwave',
      'Washing Machine',
      'Air Conditioner',
      'Gas Cooker',
      'Electric Heater',
      'Radio',
      'Fan',
      'Water Heater',
      'Other Appliance',
    ],
    'issues': [
      'No Power',
      'Screen/Display Issue',
      'Not Cooling/Heating',
      'Strange Noise',
      'Leaking',
      'Controls Not Working',
      'Overheating',
      'Water Supply Issue',
      'Ice Formation Problem',
      'Remote Not Working',
      'Other Issue',
    ],
  },
  'Other Electronics': {
    'devices': [
      'Gaming Console',
      'Printer',
      'Scanner',
      'External Hard Drive',
      'Monitor',
      'Keyboard',
      'Mouse',
      'Speaker System',
      'Projector',
      'Other Device',
    ],
    'issues': [
      'Not Turning On',
      'Connection Issues',
      'Screen/Display Problem',
      'Hardware Malfunction',
      'Software Issue',
      'Overheating',
      'Power Supply Problem',
      'Cable/Port Issue',
      'Sensor Problem',
      'Other Issue',
    ],
  },
};

const _conditions = [
  'Like New',
  'Good - Minor Cosmetic Damage',
  'Fair - Moderate Damage',
  'Poor - Severe Damage',
  'Water Damaged',
  'Physically Damaged',
];

const _categories = [
  'Apple Devices',
  'Android Phones',
  'Laptops & Computers',
  'Home Appliances',
  'Other Electronics',
];

class AppleServiceScreen extends StatefulWidget {
  const AppleServiceScreen({super.key});

  @override
  State<AppleServiceScreen> createState() => _AppleServiceScreenState();
}

class _AppleServiceScreenState extends State<AppleServiceScreen> {
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _whatsapp = TextEditingController();
  final _location = TextEditingController();
  final _otherDevice = TextEditingController();
  final _otherIssue = TextEditingController();
  final _description = TextEditingController();

  String? _category;
  String? _device;
  String? _issue;
  String? _condition;
  bool _acceptPolicy = false;
  bool _submitting = false;

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _whatsapp.dispose();
    _location.dispose();
    _otherDevice.dispose();
    _otherIssue.dispose();
    _description.dispose();
    super.dispose();
  }

  List<String> get _devices {
    if (_category == null) return [];
    if (_category == 'Apple Devices') return _appleDevices.keys.toList();
    return _categoryData[_category]?['devices'] ?? [];
  }

  List<String> get _issues {
    if (_category == null || _device == null) return [];
    if (_category == 'Apple Devices') {
      return _appleDevices[_device] ?? [];
    }
    return _categoryData[_category]?['issues'] ?? [];
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _submit() async {
    final name = _fullName.text.trim();
    final email = _email.text.trim();
    final phone = _whatsapp.text.trim();
    final location = _location.text.trim();

    if (name.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        location.isEmpty ||
        _category == null ||
        _device == null ||
        _issue == null) {
      _snack('Please fill in all required fields');
      return;
    }
    if (!_acceptPolicy) {
      _snack('Please accept the follow-up policy');
      return;
    }

    final finalDevice = _device!.contains('Other') ? _otherDevice.text.trim() : _device!;
    final finalIssue = _issue == 'Other Issue' ? _otherIssue.text.trim() : _issue!;
    if (finalDevice.isEmpty || finalIssue.isEmpty) {
      _snack('Please specify device and issue details');
      return;
    }

    setState(() => _submitting = true);
    final message = '''
*Dataflex Service Repair Center - Repair Request*

*CLIENT INFORMATION*
Name: $name
Email: $email
Location: $location
Contact Number: $phone

*DEVICE & ISSUE*
Category: $_category
Device: $finalDevice
Issue: $finalIssue
Device Condition: ${_condition ?? 'Not specified'}

*ADDITIONAL DETAILS*
${_description.text.trim().isEmpty ? 'No additional information provided' : _description.text.trim()}

Timestamp: ${DateTime.now().toLocal()}
'''.trim();

    final uri = Uri.parse('https://wa.me/$_whatsAppNumber?text=${Uri.encodeComponent(message)}');
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) _snack('Could not open WhatsApp');
    } catch (e) {
      _snack('Could not open WhatsApp: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Apple Service Center')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Request Device Repair',
            style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            'Tell us about your device and we’ll get back to you with a quote. All electronics welcome.',
            style: TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          _section(
            title: 'Your Contact Information',
            child: Column(
              children: [
                _field(_fullName, 'Full Name *', TextInputType.name),
                const SizedBox(height: 10),
                _field(_email, 'Email Address *', TextInputType.emailAddress),
                const SizedBox(height: 10),
                _field(_whatsapp, 'WhatsApp Number *', TextInputType.phone),
                const SizedBox(height: 10),
                _field(_location, 'Location (Area/Address) *', TextInputType.streetAddress),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _dropdown<String>(
            label: 'Device Category *',
            value: _category,
            items: _categories,
            onChanged: (v) => setState(() {
              _category = v;
              _device = null;
              _issue = null;
              _otherDevice.clear();
              _otherIssue.clear();
            }),
          ),
          if (_devices.isNotEmpty) ...[
            const SizedBox(height: 12),
            _dropdown<String>(
              label: 'Select Device *',
              value: _device,
              items: _devices,
              onChanged: (v) => setState(() {
                _device = v;
                _issue = null;
                _otherIssue.clear();
                if (v == null || !v.contains('Other')) _otherDevice.clear();
              }),
            ),
          ],
          if (_device != null && _device!.contains('Other')) ...[
            const SizedBox(height: 12),
            _field(_otherDevice, 'Specify Your Device *', TextInputType.text),
          ],
          if (_issues.isNotEmpty) ...[
            const SizedBox(height: 12),
            _dropdown<String>(
              label: 'Select Issue *',
              value: _issue,
              items: _issues,
              onChanged: (v) => setState(() {
                _issue = v;
                if (v != 'Other Issue') _otherIssue.clear();
              }),
            ),
          ],
          if (_issue == 'Other Issue') ...[
            const SizedBox(height: 12),
            _field(_otherIssue, 'Describe the Issue *', TextInputType.text),
          ],
          const SizedBox(height: 12),
          _dropdown<String>(
            label: 'Device Condition',
            value: _condition,
            items: _conditions,
            onChanged: (v) => setState(() => _condition = v),
            hint: 'Select condition...',
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Additional Details',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Follow-up Policy & Service Agreement',
                  style: GoogleFonts.dmSans(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 8),
                const Text(
                  'After your device is repaired, we will follow up to collect your experience and satisfaction with the repair. Please cooperate to help us serve you better. Future repairs should still be reported via this form for quality tracking.',
                  style: TextStyle(fontSize: 12, height: 1.4),
                ),
                const SizedBox(height: 8),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _acceptPolicy,
                  onChanged: (v) => setState(() => _acceptPolicy = v ?? false),
                  title: const Text(
                    'I understand and accept the follow-up policy *',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: DfColors.brand,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.chat),
            label: Text(_submitting ? 'Opening WhatsApp…' : 'Send Repair Request via WhatsApp'),
          ),
          const SizedBox(height: 28),
        ],
      ),
    );
  }

  Widget _section({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.dmSans(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, TextInputType type) {
    return TextField(
      controller: c,
      keyboardType: type,
      decoration: InputDecoration(labelText: label),
    );
  }

  Widget _dropdown<T>({
    required String label,
    required T? value,
    required List<T> items,
    required ValueChanged<T?> onChanged,
    String? hint,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      hint: Text(hint ?? 'Choose...'),
      items: items
          .map((e) => DropdownMenuItem<T>(value: e, child: Text('$e', overflow: TextOverflow.ellipsis)))
          .toList(),
      onChanged: onChanged,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class DomesticWorkerHireScreen extends StatefulWidget {
  const DomesticWorkerHireScreen({super.key, this.worker});

  /// When null, this is a general hire request.
  final Map<String, dynamic>? worker;

  @override
  State<DomesticWorkerHireScreen> createState() => _DomesticWorkerHireScreenState();
}

class _DomesticWorkerHireScreenState extends State<DomesticWorkerHireScreen> {
  final _clientName = TextEditingController();
  final _clientPhone = TextEditingController();
  final _clientEmail = TextEditingController();
  final _clientLocation = TextEditingController();
  final _message = TextEditingController();
  final _budget = TextEditingController();
  final _hours = TextEditingController();

  String _serviceType = '';
  String _workerType = '';
  String _people = '';
  String _personNeeding = '';
  String _faith = '';
  String _faithPref = '';
  String _startDate = '';
  bool _submitting = false;

  bool get _specific => widget.worker != null;

  static const _services = [
    ('housekeeper', 'Housekeeper'),
    ('nanny', 'Nanny/Childcare'),
    ('cook', 'Cook'),
    ('cleaner', 'Cleaner'),
    ('gardener', 'Gardener'),
    ('driver', 'Driver'),
    ('security', 'Security Guard'),
    ('elderly-care', 'Elderly Care'),
    ('personal-nurse', 'Personal Nurse'),
    ('personal-aide', 'Personal Aide'),
    ('hospital-support', 'Hospital Support Worker'),
    ('other', 'Other'),
  ];

  @override
  void dispose() {
    _clientName.dispose();
    _clientPhone.dispose();
    _clientEmail.dispose();
    _clientLocation.dispose();
    _message.dispose();
    _budget.dispose();
    _hours.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_clientName.text.trim().isEmpty ||
        _clientPhone.text.trim().isEmpty ||
        _clientLocation.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name, phone and location are required')),
      );
      return;
    }
    if (_specific && _serviceType.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select the type of service needed')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      if (_specific) {
        await ApiClient.instance.submitDomesticWorkerHire({
          'action': 'hire_specific',
          'clientName': _clientName.text.trim(),
          'clientPhone': _clientPhone.text.trim(),
          'clientEmail': _clientEmail.text.trim(),
          'clientLocation': _clientLocation.text.trim(),
          'serviceType': _serviceType,
          'message': _message.text.trim(),
          'budgetRange': _budget.text.trim(),
          'startDate': _startDate,
          'preferredWorkerId': widget.worker!['id'],
          'candidateName': widget.worker!['full_name'],
          'numberOfPeopleNeedingSupport': _people,
          'personNeedingSupport': _personNeeding,
          'religiousFaith': _faith,
          'workingHoursDays': _hours.text.trim(),
          'workerType': _workerType,
          'faithPreference': _faithPref,
        });
      } else {
        await ApiClient.instance.submitDomesticWorkerHire({
          'action': 'hire_general',
          'client_full_name': _clientName.text.trim(),
          'client_phone': _clientPhone.text.trim(),
          'client_email': _clientEmail.text.trim(),
          'exact_location': _clientLocation.text.trim(),
          'number_of_people_needing_support': _people.isEmpty ? null : _people,
          'person_needing_support': _personNeeding,
          'religious_faith': _faith,
          'salary_estimation': _budget.text.trim(),
          'working_hours_days': _hours.text.trim(),
          'worker_type': _workerType,
          'faith_preference': _faithPref,
          'start_date_preference': _startDate,
          'additional_info': _message.text.trim(),
        });
      }
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Request submitted'),
          content: Text(
            _specific
                ? 'Your hire request for ${widget.worker!['full_name']} was sent. Admin will follow up.'
                : 'Your general hire request was sent. Admin will match a worker.',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        ),
      );
      if (!mounted) return;
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _dropdown({
    required String label,
    required String value,
    required List<(String, String)> items,
    required ValueChanged<String?> onChanged,
    bool required = false,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value.isEmpty ? null : value,
      decoration: InputDecoration(labelText: required ? '$label *' : label),
      items: items.map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2))).toList(),
      onChanged: onChanged,
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = _specific
        ? 'Hire ${widget.worker!['full_name']}'
        : 'General hire request';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_specific) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: DfColors.brand.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Requesting: ${widget.worker!['full_name']} · ${widget.worker!['years_of_experience']} yrs · ${widget.worker!['current_location'] ?? ''}',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 14),
          ],
          Text('Client details', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 10),
          TextField(controller: _clientName, decoration: const InputDecoration(labelText: 'Client full name *')),
          const SizedBox(height: 10),
          TextField(
            controller: _clientPhone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Client phone *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _clientEmail,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Client email'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _clientLocation,
            decoration: const InputDecoration(labelText: 'Exact location / area *'),
          ),
          const SizedBox(height: 16),
          Text('Job preferences', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 10),
          if (_specific) ...[
            _dropdown(
              label: 'Type of service needed',
              value: _serviceType,
              items: _services,
              required: true,
              onChanged: (v) => setState(() => _serviceType = v ?? ''),
            ),
            const SizedBox(height: 10),
          ],
          _dropdown(
            label: 'Worker type',
            value: _workerType,
            items: const [
              ('live-in', 'Live-in'),
              ('live-out', 'Live-out'),
              ('part-time', 'Part-time'),
              ('full-time', 'Full-time'),
              ('flexible', 'Flexible'),
            ],
            onChanged: (v) => setState(() => _workerType = v ?? ''),
          ),
          const SizedBox(height: 10),
          _dropdown(
            label: 'People needing support',
            value: _people,
            items: const [
              ('1', '1 person'),
              ('2', '2 people'),
              ('3', '3 people'),
              ('4', '4 people'),
              ('5+', '5+ people'),
            ],
            onChanged: (v) => setState(() => _people = v ?? ''),
          ),
          const SizedBox(height: 10),
          _dropdown(
            label: 'Who needs support',
            value: _personNeeding,
            items: const [
              ('elderly', 'Elderly person'),
              ('children', 'Children'),
              ('disabled', 'Person with disability'),
              ('patient', 'Patient/Sick person'),
              ('family', 'General family support'),
              ('household', 'Household management'),
            ],
            onChanged: (v) => setState(() => _personNeeding = v ?? ''),
          ),
          const SizedBox(height: 10),
          _dropdown(
            label: 'Client faith',
            value: _faith,
            items: const [
              ('christian', 'Christian'),
              ('muslim', 'Muslim'),
              ('traditional', 'Traditional'),
              ('other', 'Other'),
              ('none', 'No preference'),
            ],
            onChanged: (v) => setState(() => _faith = v ?? ''),
          ),
          const SizedBox(height: 10),
          _dropdown(
            label: 'Faith preference for worker',
            value: _faithPref,
            items: const [
              ('same-faith', 'Same faith as mine'),
              ('christian', 'Christian'),
              ('muslim', 'Muslim'),
              ('traditional', 'Traditional'),
              ('no-preference', 'No preference'),
            ],
            onChanged: (v) => setState(() => _faithPref = v ?? ''),
          ),
          const SizedBox(height: 10),
          _dropdown(
            label: 'Start date preference',
            value: _startDate,
            items: const [
              ('immediately', 'Immediately'),
              ('within-1-week', 'Within 1 week'),
              ('within-2-weeks', 'Within 2 weeks'),
              ('within-1-month', 'Within 1 month'),
              ('flexible', 'Flexible'),
            ],
            onChanged: (v) => setState(() => _startDate = v ?? ''),
          ),
          const SizedBox(height: 10),
          TextField(controller: _budget, decoration: const InputDecoration(labelText: 'Budget / salary range')),
          const SizedBox(height: 10),
          TextField(controller: _hours, decoration: const InputDecoration(labelText: 'Working hours / days')),
          const SizedBox(height: 10),
          TextField(
            controller: _message,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Additional notes'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(_specific ? 'Submit hire request' : 'Submit general request'),
          ),
        ],
      ),
    );
  }
}

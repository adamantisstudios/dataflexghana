import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

/// 8-step domestic worker registration → WhatsApp admin (mirrors website).
class DomesticWorkerRegisterScreen extends StatefulWidget {
  const DomesticWorkerRegisterScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<DomesticWorkerRegisterScreen> createState() => _DomesticWorkerRegisterScreenState();
}

class _DomesticWorkerRegisterScreenState extends State<DomesticWorkerRegisterScreen> {
  int _step = 1;
  final _c = <String, TextEditingController>{};
  String _marital = '';
  String _education = '';
  String _relocate = '';
  String _jobType = '';

  TextEditingController _ctrl(String key) => _c.putIfAbsent(key, TextEditingController.new);

  @override
  void dispose() {
    for (final c in _c.values) {
      c.dispose();
    }
    super.dispose();
  }

  String get _message {
    final g = (String k) => _ctrl(k).text.trim().isEmpty ? '—' : _ctrl(k).text.trim();
    return '''--- New Candidate Application ---

📝 Candidate Information
Full Name: ${g('fullName')}
Age: ${g('age')}
Date of Birth: ${g('dob')}
Tribe: ${g('tribe')}
Religion: ${g('religion')}
Years of Experience: ${g('experience')}
Marital Status: ${_marital.isEmpty ? '—' : _marital}
Number of Children: ${g('children')}

⚕️ Health Information
Physical Disabilities: ${g('disabilities')}
Health Conditions: ${g('health')}
Allergies: ${g('allergies')}

📍 Location & Language
Current Location: ${g('location')}
Primary Language: ${g('primaryLanguage')}
Other Languages: ${g('otherLanguages')}

🎓 Education
Highest Education Level: ${_education.isEmpty ? '—' : _education}
Field of Study: ${g('fieldOfStudy')}

📱 Contact Information
WhatsApp Number: ${g('whatsappNumber')}
Mobile Line: ${g('mobileLine')}

💡 Additional Information
Key Skills: ${g('skills')}
Hobbies: ${g('hobbies')}
Additional Info: ${g('additional')}

👨‍👩‍👧 References
Reference 1: ${g('ref1Name')} (${g('ref1Contact')})
Reference 2: ${g('ref2Name')} (${g('ref2Contact')})

🏠 Work Preferences
Willing To Relocate: ${_relocate.isEmpty ? '—' : _relocate}
Job Type: ${_jobType.isEmpty ? '—' : _jobType}

⚠️ Reminders
📸 Attach at least one professional image of yourself before sending.
👨‍👩‍👧 References must be relatives, not friends.

Submitted via DataFlex Agent App''';
  }

  Future<void> _submit() async {
    final uri = Uri.parse('https://wa.me/233546460945?text=${Uri.encodeComponent(_message)}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _field(String key, String label, {TextInputType? keyboard, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: _ctrl(key),
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  Widget _stepBody() {
    switch (_step) {
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Candidate information', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            _field('fullName', 'Full name'),
            _field('age', 'Age', keyboard: TextInputType.number),
            _field('dob', 'Date of birth (YYYY-MM-DD)', keyboard: TextInputType.datetime),
            _field('tribe', 'Tribe'),
            _field('religion', 'Religion'),
            _field('experience', 'Years of experience', keyboard: TextInputType.number),
            DropdownButtonFormField<String>(
              initialValue: _marital.isEmpty ? null : _marital,
              decoration: const InputDecoration(labelText: 'Marital status'),
              items: const [
                DropdownMenuItem(value: 'Single', child: Text('Single')),
                DropdownMenuItem(value: 'Married', child: Text('Married')),
                DropdownMenuItem(value: 'Divorced', child: Text('Divorced')),
              ],
              onChanged: (v) => setState(() => _marital = v ?? ''),
            ),
            const SizedBox(height: 10),
            _field('children', 'Number of children', keyboard: TextInputType.number),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Health information', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            _field('disabilities', 'Physical disabilities', maxLines: 2),
            _field('health', 'Health conditions', maxLines: 2),
            _field('allergies', 'Allergies', maxLines: 2),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Location & language', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            _field('location', 'Current location'),
            _field('primaryLanguage', 'Primary language'),
            _field('otherLanguages', 'Other languages'),
          ],
        );
      case 4:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Education', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _education.isEmpty ? null : _education,
              decoration: const InputDecoration(labelText: 'Highest education level'),
              items: const [
                DropdownMenuItem(value: 'Primary', child: Text('Primary')),
                DropdownMenuItem(value: 'JHS', child: Text('JHS')),
                DropdownMenuItem(value: 'SHS', child: Text('SHS')),
                DropdownMenuItem(value: 'Vocational', child: Text('Vocational')),
                DropdownMenuItem(value: 'Diploma', child: Text('Diploma')),
                DropdownMenuItem(value: "Bachelor's", child: Text("Bachelor's")),
                DropdownMenuItem(value: "Master's", child: Text("Master's")),
                DropdownMenuItem(value: 'Other', child: Text('Other')),
              ],
              onChanged: (v) => setState(() => _education = v ?? ''),
            ),
            const SizedBox(height: 10),
            _field('fieldOfStudy', 'Field of study'),
          ],
        );
      case 5:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Contact', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            _field('whatsappNumber', 'WhatsApp number', keyboard: TextInputType.phone),
            _field('mobileLine', 'Mobile line', keyboard: TextInputType.phone),
          ],
        );
      case 6:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Skills & extras', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            _field('skills', 'Key skills', maxLines: 3),
            _field('hobbies', 'Hobbies', maxLines: 2),
            _field('additional', 'Additional information', maxLines: 3),
          ],
        );
      case 7:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Work preferences', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _relocate.isEmpty ? null : _relocate,
              decoration: const InputDecoration(labelText: 'Willing to relocate'),
              items: const [
                DropdownMenuItem(value: 'Yes', child: Text('Yes')),
                DropdownMenuItem(value: 'No', child: Text('No')),
              ],
              onChanged: (v) => setState(() => _relocate = v ?? ''),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: _jobType.isEmpty ? null : _jobType,
              decoration: const InputDecoration(labelText: 'Job type'),
              items: const [
                DropdownMenuItem(value: 'Live-In', child: Text('Live-In')),
                DropdownMenuItem(value: 'Live-Out', child: Text('Live-Out')),
                DropdownMenuItem(value: 'Live-In or Live-Out', child: Text('Live-In or Live-Out')),
              ],
              onChanged: (v) => setState(() => _jobType = v ?? ''),
            ),
          ],
        );
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('References', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 6),
            const Text(
              'References must be relatives, not friends. Remind the candidate to attach a photo in WhatsApp.',
              style: TextStyle(color: DfColors.muted, fontSize: 13),
            ),
            const SizedBox(height: 12),
            _field('ref1Name', 'Reference 1 name'),
            _field('ref1Contact', 'Reference 1 contact', keyboard: TextInputType.phone),
            _field('ref2Name', 'Reference 2 name'),
            _field('ref2Contact', 'Reference 2 contact', keyboard: TextInputType.phone),
          ],
        );
    }
  }

  Widget _body() {
    return Column(
      children: [
        LinearProgressIndicator(
          value: _step / 8,
          color: DfColors.brand,
          backgroundColor: DfColors.brand.withValues(alpha: 0.15),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Step $_step of 8', style: const TextStyle(color: DfColors.muted, fontSize: 12)),
              const SizedBox(height: 8),
              _stepBody(),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (_step > 1)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _step -= 1),
                    child: const Text('Back'),
                  ),
                ),
              if (_step > 1) const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () {
                    if (_step < 8) {
                      setState(() => _step += 1);
                    } else {
                      _submit();
                    }
                  },
                  child: Text(_step < 8 ? 'Continue' : 'Send via WhatsApp'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) return _body();
    return Scaffold(
      appBar: AppBar(title: const Text('Register domestic worker')),
      body: _body(),
    );
  }
}

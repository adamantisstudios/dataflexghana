import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import 'dating_common.dart';
import 'dating_constants.dart';
import 'photo_manager_screen.dart';

/// Full dating profile editor — every field the `/api/agent/dating/profile`
/// route accepts, plus discovery preferences, the live completeness meter, the
/// photo manager and permanent account deletion.
class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key, required this.onProfileChanged});

  /// Fired after a successful save/delete so discover + matches can reload.
  final VoidCallback onProfileChanged;

  @override
  State<ProfileTab> createState() => ProfileTabState();
}

class ProfileTabState extends State<ProfileTab> {
  final _displayName = TextEditingController();
  final _bio = TextEditingController();
  final _age = TextEditingController();
  final _location = TextEditingController();
  final _occupation = TextEditingController();
  final _heightCm = TextEditingController();

  String _intentions = 'serious_relationship';
  String _gender = 'male';
  String _interestedIn = 'female';
  String? _relationshipStatus;
  String? _education;
  String? _religion;
  String? _drinking;
  String? _smoking;
  String? _children;
  String? _weeklyAvailability;
  List<String> _interests = [];
  List<String> _languages = [];
  List<String> _traits = [];
  bool _ladiesFirst = false;
  bool _terms = false;

  int _minAge = 18;
  int _maxAge = 60;
  int _maxDistanceKm = 100;
  List<String> _preferredGenders = [];

  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _photos = [];
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    _displayName.dispose();
    _bio.dispose();
    _age.dispose();
    _location.dispose();
    _occupation.dispose();
    _heightCm.dispose();
    super.dispose();
  }

  String? _oneOf(List<String> options, Object? raw) {
    final value = raw?.toString().trim() ?? '';
    return options.contains(value) ? value : null;
  }

  Future<void> load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await DatingApi.instance.getProfile();
      if (!mounted) return;
      final profile = res['profile'];
      final prefs = res['preferences'];
      setState(() {
        _profile = profile is Map ? Map<String, dynamic>.from(profile) : null;
        _photos = asMapList(_profile?['photos']);
        final p = _profile;
        if (p != null) {
          _displayName.text = p['display_name']?.toString() ?? '';
          _bio.text = p['bio']?.toString() ?? '';
          _age.text = asInt(p['age'])?.toString() ?? '';
          _location.text = p['location']?.toString() ?? '';
          _occupation.text = p['occupation']?.toString() ?? '';
          _heightCm.text = asInt(p['height_cm'])?.toString() ?? '';
          _intentions = datingIntentions.containsKey(p['intentions']?.toString())
              ? p['intentions'].toString()
              : _intentions;
          _gender = genderOptions.containsKey(p['gender']?.toString())
              ? p['gender'].toString()
              : _gender;
          _interestedIn = interestedInOptions.containsKey(p['interested_in']?.toString())
              ? p['interested_in'].toString()
              : _interestedIn;
          _relationshipStatus = _oneOf(relationshipStatusOptions, p['relationship_status']);
          _education = _oneOf(educationOptions, p['education']);
          _religion = _oneOf(religionOptions, p['religion']);
          _drinking = _oneOf(lifestyleOptions, p['drinking']);
          _smoking = _oneOf(lifestyleOptions, p['smoking']);
          _children = _oneOf(childrenOptions, p['children']);
          _weeklyAvailability = _oneOf(weeklyAvailabilityOptions, p['weekly_availability']);
          _interests = asStringList(p['interests']);
          _languages = asStringList(p['languages']);
          _traits = asStringList(p['personality_traits']);
          _ladiesFirst = p['ladies_first'] == true;
          _terms = p['terms_accepted_at'] != null;
        }
        if (prefs is Map) {
          _minAge = asInt(prefs['min_age']) ?? _minAge;
          _maxAge = asInt(prefs['max_age']) ?? _maxAge;
          _maxDistanceKm = asInt(prefs['max_distance_km']) ?? _maxDistanceKm;
          _preferredGenders = asStringList(prefs['preferred_genders']);
        }
      });
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _completeness => calculateProfileCompleteness(
        displayName: _displayName.text,
        bio: _bio.text,
        age: int.tryParse(_age.text.trim()),
        relationshipStatus: _relationshipStatus,
        intentions: _intentions,
        location: _location.text,
        occupation: _occupation.text,
        interests: _interests,
        photoCount: _photos.length,
        heightCm: int.tryParse(_heightCm.text.trim()),
        education: _education,
        religion: _religion,
        drinking: _drinking,
        smoking: _smoking,
        children: _children,
        languages: _languages,
        personalityTraits: _traits,
        weeklyAvailability: _weeklyAvailability,
      );

  Future<void> _save({required bool draft}) async {
    if (_displayName.text.trim().isEmpty) {
      showDatingSnack(context, 'Display name is required', danger: true);
      return;
    }
    // Real submits are rejected server-side without terms + a photo; drafts are
    // exempt from both.
    if (!draft && !_terms) {
      showDatingSnack(context, 'Accept the Dating Terms to submit', danger: true);
      return;
    }
    if (!draft && _photos.isEmpty) {
      showDatingSnack(context, 'Add at least one dating photo before submitting', danger: true);
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await DatingApi.instance.saveProfile({
        'display_name': _displayName.text.trim(),
        'bio': _bio.text.trim(),
        'age': int.tryParse(_age.text.trim()),
        'gender': _gender,
        'interested_in': _interestedIn,
        'relationship_status': _relationshipStatus,
        'intentions': _intentions,
        'location': _location.text.trim(),
        'occupation': _occupation.text.trim(),
        'interests': _interests,
        'height_cm': int.tryParse(_heightCm.text.trim()),
        'education': _education,
        'religion': _religion,
        'drinking': _drinking,
        'smoking': _smoking,
        'children': _children,
        'languages': _languages,
        'personality_traits': _traits,
        'weekly_availability': _weeklyAvailability,
        'ladies_first': _ladiesFirst,
        'terms_accepted': _terms,
        'save_draft': draft,
        'preferences': {
          'min_age': _minAge,
          'max_age': _maxAge,
          'preferred_genders': _preferredGenders,
          'max_distance_km': _maxDistanceKm,
        },
      });
      if (!mounted) return;
      final profile = res['profile'];
      if (profile is Map) {
        setState(() {
          _profile = Map<String, dynamic>.from(profile);
          _photos = asMapList(_profile?['photos']);
        });
      }
      showDatingSnack(context, draft ? 'Draft saved' : 'Profile submitted for approval');
      widget.onProfileChanged();
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openPhotos() async {
    final result = await Navigator.push<List<Map<String, dynamic>>>(
      context,
      MaterialPageRoute(builder: (_) => PhotoManagerScreen(photos: _photos)),
    );
    if (!mounted) return;
    if (result != null) setState(() => _photos = result);
    // Completeness is recalculated server-side on upload/delete.
    await load();
  }

  Future<void> _deleteAccount() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete dating profile?'),
        content: const Text(
          'This permanently removes your dating profile, photos, matches and messages. '
          'Your DataFlex agent account is not affected. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Delete permanently', style: TextStyle(color: DfColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _saving = true);
    try {
      await DatingApi.instance.deleteProfile();
      if (!mounted) return;
      showDatingSnack(context, 'Dating profile deleted');
      widget.onProfileChanged();
      await load();
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }

    return RefreshIndicator(
      onRefresh: load,
      color: DfColors.brand,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
            ),
          _statusCard(),
          DatingSection(
            title: 'Progress',
            child: CompletenessMeter(percent: _completeness, photoCount: _photos.length),
          ),
          DatingSection(
            title: 'Photos',
            subtitle: 'Your first photo is what people see in discover.',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _photos.isEmpty
                      ? 'No photos yet — one is required to submit.'
                      : '${_photos.length} of $maxDatingPhotos photos added.',
                  style: TextStyle(
                    color: _photos.isEmpty ? DfColors.danger : DfColors.muted,
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _profile == null ? null : _openPhotos,
                  icon: const Icon(Icons.photo_library_outlined, size: 18),
                  label: Text(_photos.isEmpty ? 'Add photos' : 'Manage photos'),
                ),
                if (_profile == null)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'Save a draft first — photos attach to an existing profile.',
                      style: TextStyle(color: DfColors.muted, fontSize: 12),
                    ),
                  ),
              ],
            ),
          ),
          DatingSection(
            title: 'About you',
            child: Column(
              children: [
                TextField(
                  controller: _displayName,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(labelText: 'Display name *'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _bio,
                  maxLines: 4,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Bio',
                    hintText: 'What matters to you, and what you are looking for.',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _age,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(labelText: 'Age'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _heightCm,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(labelText: 'Height (cm)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _dropdownMap('Gender', genderOptions, _gender,
                    (v) => setState(() => _gender = v ?? _gender)),
                const SizedBox(height: 10),
                _dropdownMap('Interested in', interestedInOptions, _interestedIn,
                    (v) => setState(() => _interestedIn = v ?? _interestedIn)),
                const SizedBox(height: 10),
                _dropdownMap('Intentions *', datingIntentions, _intentions,
                    (v) => setState(() => _intentions = v ?? _intentions)),
                const SizedBox(height: 10),
                _dropdownList('Relationship status', relationshipStatusOptions,
                    _relationshipStatus, (v) => setState(() => _relationshipStatus = v)),
                const SizedBox(height: 10),
                TextField(
                  controller: _location,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(labelText: 'Location (city / area)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _occupation,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(labelText: 'Occupation'),
                ),
              ],
            ),
          ),
          DatingSection(
            title: 'Lifestyle',
            child: Column(
              children: [
                _dropdownList('Education', educationOptions, _education,
                    (v) => setState(() => _education = v)),
                const SizedBox(height: 10),
                _dropdownList('Religion', religionOptions, _religion,
                    (v) => setState(() => _religion = v)),
                const SizedBox(height: 10),
                _dropdownList('Drinking', lifestyleOptions, _drinking,
                    (v) => setState(() => _drinking = v)),
                const SizedBox(height: 10),
                _dropdownList('Smoking', lifestyleOptions, _smoking,
                    (v) => setState(() => _smoking = v)),
                const SizedBox(height: 10),
                _dropdownList('Children', childrenOptions, _children,
                    (v) => setState(() => _children = v)),
                const SizedBox(height: 10),
                _dropdownList('Weekly availability', weeklyAvailabilityOptions,
                    _weeklyAvailability, (v) => setState(() => _weeklyAvailability = v)),
              ],
            ),
          ),
          DatingSection(
            title: 'Interests',
            subtitle: 'Pick everything that genuinely describes you.',
            child: MultiSelectChips(
              options: interestSuggestions,
              selected: _interests,
              onToggle: (v) => setState(() => _toggle(_interests, v)),
            ),
          ),
          DatingSection(
            title: 'Languages',
            child: MultiSelectChips(
              options: languageSuggestions,
              selected: _languages,
              onToggle: (v) => setState(() => _toggle(_languages, v)),
            ),
          ),
          DatingSection(
            title: 'Personality',
            child: MultiSelectChips(
              options: personalityTraitOptions,
              selected: _traits,
              onToggle: (v) => setState(() => _toggle(_traits, v)),
            ),
          ),
          DatingSection(
            title: 'Who you want to meet',
            subtitle: 'Used to rank the people shown in discover.',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Age range: $_minAge – $_maxAge',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14)),
                RangeSlider(
                  values: RangeValues(_minAge.toDouble(), _maxAge.toDouble()),
                  min: 18,
                  max: 80,
                  divisions: 62,
                  activeColor: DfColors.brand,
                  labels: RangeLabels('$_minAge', '$_maxAge'),
                  onChanged: (v) => setState(() {
                    _minAge = v.start.round();
                    _maxAge = v.end.round();
                  }),
                ),
                Text('Max distance: $_maxDistanceKm km',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14)),
                Slider(
                  value: _maxDistanceKm.toDouble().clamp(5, 500),
                  min: 5,
                  max: 500,
                  divisions: 99,
                  activeColor: DfColors.brand,
                  label: '$_maxDistanceKm km',
                  onChanged: (v) => setState(() => _maxDistanceKm = v.round()),
                ),
                const SizedBox(height: 6),
                const Text('Preferred genders',
                    style: TextStyle(color: DfColors.muted, fontSize: 12.5)),
                const SizedBox(height: 8),
                MultiSelectChips(
                  options: genderOptions.keys.toList(),
                  selected: _preferredGenders,
                  onToggle: (v) => setState(() => _toggle(_preferredGenders, v)),
                ),
              ],
            ),
          ),
          DatingSection(
            title: 'Safety & consent',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SwitchListTile(
                  value: _ladiesFirst,
                  onChanged: (v) => setState(() => _ladiesFirst = v),
                  activeThumbColor: DfColors.brand,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Ladies first'),
                  subtitle: const Text(
                    'On a new match the woman sends the first message. Nobody else can open the chat until she does.',
                  ),
                ),
                CheckboxListTile(
                  value: _terms,
                  onChanged: (v) => setState(() => _terms = v ?? false),
                  activeColor: DfColors.brand,
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('I accept the Dating Terms'),
                  subtitle: const Text('Required before your profile can be submitted.'),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _saving ? null : () => _save(draft: true),
                  child: const Text('Save draft'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : () => _save(draft: false),
                  child: _saving
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_profile != null)
            TextButton.icon(
              onPressed: _saving ? null : _deleteAccount,
              icon: const Icon(Icons.delete_forever, color: DfColors.danger),
              label: const Text(
                'Delete my dating profile permanently',
                style: TextStyle(color: DfColors.danger),
              ),
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  void _toggle(List<String> list, String value) {
    if (list.contains(value)) {
      list.remove(value);
    } else {
      list.add(value);
    }
  }

  Widget _statusCard() {
    final p = _profile;
    if (p == null) {
      return DatingSection(
        title: 'Create your dating profile',
        child: const Text(
          'Fill in your details, add a photo, accept the terms and submit. Our team reviews every profile before it appears in discover.',
          style: TextStyle(color: DfColors.muted),
        ),
      );
    }

    final suspended = p['is_suspended'] == true;
    final approved = p['is_approved'] == true;
    final rejection = p['rejection_reason']?.toString() ?? '';
    final label = suspended
        ? 'Suspended'
        : approved
            ? 'Approved — you are visible in discover'
            : rejection.isNotEmpty
                ? 'Changes requested'
                : 'Pending approval';
    final color = suspended || rejection.isNotEmpty
        ? DfColors.danger
        : approved
            ? DfColors.brandDark
            : Colors.orange.shade800;

    return DatingSection(
      title: 'Status',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                suspended
                    ? Icons.block
                    : approved
                        ? Icons.verified
                        : Icons.hourglass_top,
                color: color,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          if (rejection.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(rejection, style: const TextStyle(color: DfColors.muted)),
            const SizedBox(height: 4),
            const Text(
              'Fix the points above and submit again — resubmitting clears the rejection.',
              style: TextStyle(color: DfColors.muted, fontSize: 12),
            ),
          ],
          if (suspended) ...[
            const SizedBox(height: 8),
            const Text(
              'Discover and new matches are paused while your profile is suspended. Contact support to resolve it.',
              style: TextStyle(color: DfColors.muted, fontSize: 12.5),
            ),
          ],
        ],
      ),
    );
  }

  Widget _dropdownMap(
    String label,
    Map<String, String> options,
    String value,
    ValueChanged<String?> onChanged,
  ) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: options.entries
          .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _dropdownList(
    String label,
    List<String> options,
    String? value,
    ValueChanged<String?> onChanged,
  ) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: [
        const DropdownMenuItem<String>(value: null, child: Text('Not specified')),
        ...options.map((o) => DropdownMenuItem(value: o, child: Text(o))),
      ],
      onChanged: onChanged,
    );
  }
}

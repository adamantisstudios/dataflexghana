import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class DatingScreen extends StatefulWidget {
  const DatingScreen({super.key});

  @override
  State<DatingScreen> createState() => _DatingScreenState();
}

class _DatingScreenState extends State<DatingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _limits;
  List<Map<String, dynamic>> _profiles = [];
  bool _loading = true;
  bool _saving = false;
  bool _swiping = false;
  String? _error;

  final _displayName = TextEditingController();
  final _bio = TextEditingController();
  final _age = TextEditingController();
  final _location = TextEditingController();
  final _occupation = TextEditingController();
  String _intentions = 'serious_relationship';
  String _gender = 'male';
  String _interestedIn = 'female';
  bool _terms = false;

  static const _intentionOptions = [
    ('serious_relationship', 'Serious relationship'),
    ('marriage', 'Marriage'),
    ('friendship', 'Meaningful friendship'),
    ('open_to_possibilities_serious', 'Open to possibilities'),
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _displayName.dispose();
    _bio.dispose();
    _age.dispose();
    _location.dispose();
    _occupation.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profileRes = await ApiClient.instance.getDatingProfile();
      final discoverRes = await ApiClient.instance.datingDiscover();
      final profile = profileRes['profile'];
      setState(() {
        _profile = profile is Map ? Map<String, dynamic>.from(profile) : null;
        _limits = discoverRes['limits'] is Map
            ? Map<String, dynamic>.from(discoverRes['limits'] as Map)
            : null;
        _profiles = (discoverRes['profiles'] is List)
            ? (discoverRes['profiles'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        if (_profile != null) {
          _displayName.text = _profile!['display_name']?.toString() ?? '';
          _bio.text = _profile!['bio']?.toString() ?? '';
          _age.text = _profile!['age']?.toString() ?? '';
          _location.text = _profile!['location']?.toString() ?? '';
          _occupation.text = _profile!['occupation']?.toString() ?? '';
          _intentions = _profile!['intentions']?.toString() ?? _intentions;
          _gender = _profile!['gender']?.toString() ?? _gender;
          _interestedIn = _profile!['interested_in']?.toString() ?? _interestedIn;
          _terms = _profile!['terms_accepted_at'] != null;
        }
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile({bool draft = false}) async {
    if (_displayName.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Display name required')));
      return;
    }
    if (!draft && !_terms) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Accept dating terms to submit')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient.instance.saveDatingProfile({
        'display_name': _displayName.text.trim(),
        'bio': _bio.text.trim(),
        'age': int.tryParse(_age.text.trim()),
        'gender': _gender,
        'interested_in': _interestedIn,
        'intentions': _intentions,
        'location': _location.text.trim(),
        'occupation': _occupation.text.trim(),
        'terms_accepted': _terms,
        'save_draft': draft,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(draft ? 'Draft saved' : 'Profile saved')),
      );
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _swipe(Map<String, dynamic> target, String direction) async {
    final targetId = target['agent_id']?.toString() ?? target['id']?.toString() ?? '';
    if (targetId.isEmpty) return;
    setState(() => _swiping = true);
    try {
      final res = await ApiClient.instance.datingSwipe(targetAgentId: targetId, direction: direction);
      if (!mounted) return;
      setState(() => _profiles.removeWhere((p) => (p['agent_id'] ?? p['id'])?.toString() == targetId));
      if (res['matched'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("It's a match!")));
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _swiping = false);
    }
  }

  String? _photoUrl(Map<String, dynamic> p) {
    final photos = p['photos'];
    if (photos is List && photos.isNotEmpty) {
      final first = photos.first;
      if (first is Map) {
        return first['url']?.toString() ?? first['public_url']?.toString();
      }
      return first.toString();
    }
    return p['photo_url']?.toString() ?? p['profile_image_url']?.toString();
  }

  @override
  Widget build(BuildContext context) {
    final approved = _profile?['is_approved'] == true;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Find a Date'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'Discover'), Tab(text: 'My profile')]),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : TabBarView(
              controller: _tabs,
              children: [
                RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _error != null
                      ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                      : !approved
                          ? ListView(
                              children: [
                                const SizedBox(height: 40),
                                Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    _profile == null
                                        ? 'Create your dating profile first (Profile tab). Admin approval is required before you can discover.'
                                        : 'Your profile is pending approval. You can still edit details on the Profile tab.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: DfColors.muted),
                                  ),
                                ),
                                Center(
                                  child: ElevatedButton(
                                    onPressed: () => _tabs.animateTo(1),
                                    child: const Text('Edit profile'),
                                  ),
                                ),
                              ],
                            )
                          : _profiles.isEmpty
                              ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No more profiles right now'))])
                              : ListView(
                                  padding: const EdgeInsets.all(16),
                                  children: [
                                    if (_limits != null)
                                      Padding(
                                        padding: const EdgeInsets.only(bottom: 12),
                                        child: Text(
                                          'Swipes left: ${_limits!['swipes_remaining'] ?? '—'} · '
                                          'Matches left: ${_limits!['matches_remaining'] ?? '—'}',
                                          style: const TextStyle(color: DfColors.muted, fontSize: 13),
                                        ),
                                      ),
                                    ..._profiles.map((p) {
                                      final img = DisplayFormat.resolveImageUrl(_photoUrl(p));
                                      return Card(
                                        margin: const EdgeInsets.only(bottom: 14),
                                        child: Padding(
                                          padding: const EdgeInsets.all(14),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              if (img.isNotEmpty)
                                                ClipRRect(
                                                  borderRadius: BorderRadius.circular(12),
                                                  child: CachedNetworkImage(
                                                    imageUrl: img,
                                                    height: 220,
                                                    width: double.infinity,
                                                    fit: BoxFit.cover,
                                                  ),
                                                ),
                                              const SizedBox(height: 10),
                                              Text(
                                                '${p['display_name'] ?? 'Member'}${p['age'] != null ? ', ${p['age']}' : ''}',
                                                style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20),
                                              ),
                                              if ((p['location']?.toString() ?? '').isNotEmpty)
                                                Text(p['location'].toString(), style: const TextStyle(color: DfColors.muted)),
                                              if ((p['bio']?.toString() ?? '').isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 6),
                                                  child: Text(p['bio'].toString()),
                                                ),
                                              const SizedBox(height: 12),
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: OutlinedButton(
                                                      onPressed: _swiping ? null : () => _swipe(p, 'pass'),
                                                      child: const Text('Pass'),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Expanded(
                                                    child: ElevatedButton(
                                                      onPressed: _swiping ? null : () => _swipe(p, 'like'),
                                                      child: const Text('Like'),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                ),
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('Dating profile', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
                    const SizedBox(height: 8),
                    if (_profile != null)
                      Text(
                        _profile!['is_approved'] == true
                            ? 'Status: Approved'
                            : 'Status: Pending approval${_profile!['rejection_reason'] != null ? ' · ${_profile!['rejection_reason']}' : ''}',
                        style: TextStyle(
                          color: _profile!['is_approved'] == true ? DfColors.brandDark : DfColors.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    const SizedBox(height: 12),
                    TextField(controller: _displayName, decoration: const InputDecoration(labelText: 'Display name *')),
                    const SizedBox(height: 10),
                    TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _age,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Age'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _gender,
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Male')),
                        DropdownMenuItem(value: 'female', child: Text('Female')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _gender = v ?? _gender),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _interestedIn,
                      decoration: const InputDecoration(labelText: 'Interested in'),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Men')),
                        DropdownMenuItem(value: 'female', child: Text('Women')),
                        DropdownMenuItem(value: 'everyone', child: Text('Everyone')),
                      ],
                      onChanged: (v) => setState(() => _interestedIn = v ?? _interestedIn),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: _intentions,
                      decoration: const InputDecoration(labelText: 'Intentions'),
                      items: _intentionOptions
                          .map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2)))
                          .toList(),
                      onChanged: (v) => setState(() => _intentions = v ?? _intentions),
                    ),
                    const SizedBox(height: 10),
                    TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
                    const SizedBox(height: 10),
                    TextField(controller: _occupation, decoration: const InputDecoration(labelText: 'Occupation')),
                    const SizedBox(height: 10),
                    CheckboxListTile(
                      value: _terms,
                      onChanged: (v) => setState(() => _terms = v ?? false),
                      title: const Text('I accept the Dating Terms'),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Upload at least one dating photo on the website before final approval.',
                      style: TextStyle(color: DfColors.muted, fontSize: 12),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _saving ? null : () => _saveProfile(draft: true),
                            child: const Text('Save draft'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _saving ? null : () => _saveProfile(draft: false),
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
                  ],
                ),
              ],
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

/// Referral Services — primarily MTN AFA registration for agents to submit on behalf of customers.
class ReferralServicesScreen extends StatefulWidget {
  const ReferralServicesScreen({super.key});

  @override
  State<ReferralServicesScreen> createState() => _ReferralServicesScreenState();
}

class _ReferralServicesScreenState extends State<ReferralServicesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _ghanaCard = TextEditingController();
  final _dob = TextEditingController();
  final _location = TextEditingController();
  final _occupation = TextEditingController();
  final _notes = TextEditingController();
  bool _submitting = false;
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _fullName.dispose();
    _phone.dispose();
    _ghanaCard.dispose();
    _dob.dispose();
    _location.dispose();
    _occupation.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ApiClient.instance.getAfaStatus();
      setState(() {
        _history = list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (_fullName.text.trim().isEmpty || _phone.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Full name and phone are required')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final res = await ApiClient.instance.submitAfa(
        fullName: _fullName.text.trim(),
        phoneNumber: _phone.text.trim(),
        ghanaCard: _ghanaCard.text.trim().isEmpty ? null : _ghanaCard.text.trim(),
        dateOfBirth: _dob.text.trim().isEmpty ? null : _dob.text.trim(),
        location: _location.text.trim().isEmpty ? null : _location.text.trim(),
        occupation: _occupation.text.trim().isEmpty ? null : _occupation.text.trim(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      );
      if (!mounted) return;
      final pin = res['payment_pin']?.toString();
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('AFA submitted'),
          content: Text(
            pin == null
                ? (res['message']?.toString() ?? 'Registration submitted')
                : '${res['message'] ?? 'Submitted'}\n\nPayment PIN: $pin\nKeep this PIN for MoMo payment verification.',
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
        ),
      );
      _fullName.clear();
      _phone.clear();
      _ghanaCard.clear();
      _dob.clear();
      _location.clear();
      _occupation.clear();
      _notes.clear();
      await _load();
      _tabs.animateTo(1);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Referral Services'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'MTN AFA'), Tab(text: 'My submissions')]),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('MTN AFA registration', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
              const SizedBox(height: 6),
              const Text(
                'Submit AFA registrations for customers and earn referral commission after approval.',
                style: TextStyle(color: DfColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 14),
              TextField(controller: _fullName, decoration: const InputDecoration(labelText: 'Full name *')),
              const SizedBox(height: 10),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'Phone (10 digits) *'),
              ),
              const SizedBox(height: 10),
              TextField(controller: _ghanaCard, decoration: const InputDecoration(labelText: 'Ghana Card')),
              const SizedBox(height: 10),
              TextField(
                controller: _dob,
                decoration: const InputDecoration(labelText: 'Date of birth (YYYY-MM-DD)'),
              ),
              const SizedBox(height: 10),
              TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
              const SizedBox(height: 10),
              TextField(controller: _occupation, decoration: const InputDecoration(labelText: 'Occupation')),
              const SizedBox(height: 10),
              TextField(controller: _notes, maxLines: 2, decoration: const InputDecoration(labelText: 'Notes')),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit AFA registration'),
              ),
            ],
          ),
          _loading
              ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: DfColors.brand,
                  child: _error != null
                      ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                      : _history.isEmpty
                          ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No AFA submissions yet'))])
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _history.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (context, i) {
                                final r = _history[i];
                                final when = r['created_at']?.toString();
                                String date = '—';
                                if (when != null) {
                                  final d = DateTime.tryParse(when);
                                  if (d != null) date = DateFormat.yMMMd().format(d.toLocal());
                                }
                                return Card(
                                  child: ListTile(
                                    title: Text(r['full_name']?.toString() ?? 'AFA',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                    subtitle: Text(
                                      '${r['phone_number'] ?? ''} · ${r['status'] ?? '—'}\n'
                                      'PIN: ${r['payment_pin'] ?? '—'} · $date',
                                    ),
                                    isThreeLine: true,
                                  ),
                                );
                              },
                            ),
                ),
        ],
      ),
    );
  }
}

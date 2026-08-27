import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import 'dating_common.dart';
import 'dating_constants.dart';

/// Book and track the 30-minute relationship counselling sessions. The intro
/// session is free once, Silver/Gold get a monthly free one, everything else is
/// paid and settled with the counsellor.
class CounsellingScreen extends StatefulWidget {
  const CounsellingScreen({super.key});

  @override
  State<CounsellingScreen> createState() => _CounsellingScreenState();
}

class _CounsellingScreenState extends State<CounsellingScreen> {
  final _counsellor = TextEditingController();
  final _slotFormat = DateFormat('EEE d MMM yyyy, HH:mm');

  List<Map<String, dynamic>> _sessions = [];
  bool _introClaimed = false;
  String? _monthlyClaimedAt;
  String _plan = 'free';
  DateTime? _scheduledAt;
  bool _loading = true;
  bool _booking = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _counsellor.dispose();
    super.dispose();
  }

  bool get _monthlyAvailable {
    if (_plan != 'silver' && _plan != 'gold') return false;
    final claimed = DateTime.tryParse(_monthlyClaimedAt ?? '');
    if (claimed == null) return true;
    final now = DateTime.now();
    return claimed.year != now.year || claimed.month != now.month;
  }

  String get _sessionType {
    if (!_introClaimed) return 'intro';
    if (_monthlyAvailable) return 'monthly';
    return 'paid';
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await DatingApi.instance.counselling();
      if (!mounted) return;
      setState(() {
        _sessions = asMapList(res['sessions']);
        _introClaimed = res['intro_claimed'] == true;
        _monthlyClaimedAt = res['monthly_claimed_at']?.toString();
        _plan = res['plan']?.toString() ?? 'free';
      });
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickSlot() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 120)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 18, minute: 0),
    );
    if (time == null || !mounted) return;
    setState(() {
      _scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  Future<void> _book() async {
    final slot = _scheduledAt;
    if (slot == null) {
      showDatingSnack(context, 'Choose a date and time first', danger: true);
      return;
    }
    setState(() => _booking = true);
    try {
      await DatingApi.instance.bookCounselling(
        scheduledAt: slot,
        sessionType: _sessionType,
        counsellorName: _counsellor.text,
      );
      if (!mounted) return;
      showDatingSnack(context, 'Session requested — we will confirm shortly');
      setState(() => _scheduledAt = null);
      _counsellor.clear();
      await _load();
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final typeLabel = switch (_sessionType) {
      'intro' => 'Free intro session',
      'monthly' => 'Free monthly session (${_plan.toUpperCase()})',
      _ => 'Paid session',
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Counselling')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                    ),
                  DatingSection(
                    title: 'Book a session',
                    subtitle:
                        '$counsellingSessionMinutes minutes with a DataFlex relationship counsellor.',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        DatingChip(label: typeLabel, icon: Icons.card_giftcard),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _booking ? null : _pickSlot,
                          icon: const Icon(Icons.event, size: 18),
                          label: Text(
                            _scheduledAt == null
                                ? 'Choose date and time'
                                : _slotFormat.format(_scheduledAt!),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _counsellor,
                          decoration: const InputDecoration(
                            labelText: 'Preferred counsellor (optional)',
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _booking ? null : _book,
                          child: _booking
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Request session'),
                        ),
                      ],
                    ),
                  ),
                  DatingSection(
                    title: 'Your sessions',
                    child: _sessions.isEmpty
                        ? const Text(
                            'No sessions booked yet.',
                            style: TextStyle(color: DfColors.muted),
                          )
                        : Column(
                            children: _sessions.map(_sessionTile).toList(),
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _sessionTile(Map<String, dynamic> session) {
    final at = DateTime.tryParse(session['scheduled_at']?.toString() ?? '');
    final status = session['status']?.toString() ?? 'pending';
    final isFree = session['is_free'] == true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.event_available, size: 18, color: DfColors.brand),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  at != null ? _slotFormat.format(at.toLocal()) : 'Scheduled',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5),
                ),
                const SizedBox(height: 3),
                Text(
                  '${session['counsellor_name'] ?? 'DataFlex Counsellor'} · '
                  '${session['duration_minutes'] ?? counsellingSessionMinutes} min',
                  style: const TextStyle(color: DfColors.muted, fontSize: 12.5),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              DatingChip(
                label: status,
                color: status == 'completed'
                    ? DfColors.brand
                    : status == 'cancelled'
                        ? DfColors.danger
                        : Colors.orange.shade800,
              ),
              if (isFree) ...[
                const SizedBox(height: 6),
                const DatingChip(label: 'Free', color: DfColors.muted),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

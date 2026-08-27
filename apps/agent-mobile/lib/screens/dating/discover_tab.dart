import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import '../../widgets/authed_network_image.dart';
import 'dating_common.dart';
import 'dating_constants.dart';

/// Discover feed: the headline top pick plus the ranked remainder, with the
/// daily swipe/match allowance and the server's gating reason surfaced.
class DiscoverTab extends StatefulWidget {
  const DiscoverTab({
    super.key,
    required this.onEditProfile,
    required this.onOpenPlans,
    required this.onMatched,
  });

  final VoidCallback onEditProfile;
  final VoidCallback onOpenPlans;
  final VoidCallback onMatched;

  @override
  State<DiscoverTab> createState() => DiscoverTabState();
}

class DiscoverTabState extends State<DiscoverTab> {
  List<Map<String, dynamic>> _profiles = [];
  Map<String, dynamic>? _topPick;
  Map<String, dynamic>? _limits;
  bool _loading = true;
  bool _swiping = false;
  String? _loadError;
  String? _gateError;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final res = await DatingApi.instance.discover();
      if (!mounted) return;
      setState(() {
        _profiles = asMapList(res['profiles']);
        final top = res['top_pick'];
        _topPick = top is Map ? Map<String, dynamic>.from(top) : null;
        _limits = res['limits'] is Map ? Map<String, dynamic>.from(res['limits'] as Map) : null;
        // The server explains *why* the feed is empty (not approved, suspended,
        // inactive). Showing "no profiles" instead would be misleading.
        _gateError = res['error']?.toString();
      });
    } catch (e) {
      if (mounted) setState(() => _loadError = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _idOf(Map<String, dynamic> p) =>
      p['agent_id']?.toString() ?? p['id']?.toString() ?? '';

  Future<void> _swipe(
    Map<String, dynamic> target,
    String direction, {
    bool isTopPick = false,
  }) async {
    final targetId = _idOf(target);
    if (targetId.isEmpty || _swiping) return;
    setState(() => _swiping = true);
    try {
      final res = await DatingApi.instance.swipe(
        targetAgentId: targetId,
        direction: direction,
        isTopPick: isTopPick,
      );
      if (!mounted) return;
      setState(() {
        _profiles.removeWhere((p) => _idOf(p) == targetId);
        if (_topPick != null && _idOf(_topPick!) == targetId) {
          // Promote the next best profile into the headline slot.
          _topPick = _profiles.isNotEmpty ? _profiles.removeAt(0) : null;
        }
        final sub = res['subscription'];
        if (sub is Map) {
          _limits = {
            ...?_limits,
            'swipes_remaining': sub['swipes_remaining'],
            'matches_remaining': sub['matches_remaining'],
            'plan': sub['plan'],
          };
        }
      });
      if (res['matched'] == true) {
        showDatingSnack(context, "It's a match! Open Matches to say hello.");
        widget.onMatched();
      }
      if (_profiles.isEmpty && _topPick == null) await load();
    } catch (e) {
      if (!mounted) return;
      final message = errorMessage(e);
      showDatingSnack(context, message, danger: true);
      final lower = message.toLowerCase();
      if (lower.contains('silver') || lower.contains('gold') || lower.contains('upgrade')) {
        widget.onOpenPlans();
      }
    } finally {
      if (mounted) setState(() => _swiping = false);
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
          if (_loadError != null) _message(_loadError!, danger: true),
          if (_limits != null) _limitsBar(),
          if (_gateError != null) _gateCard(_gateError!),
          if (_gateError == null && _topPick != null) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                "Today's top pick",
                style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 19),
              ),
            ),
            _profileCard(_topPick!, isTopPick: true),
            const SizedBox(height: 18),
          ],
          if (_gateError == null && _profiles.isNotEmpty) ...[
            Text(
              'More people for you',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17),
            ),
            const SizedBox(height: 10),
            ..._profiles.map((p) => _profileCard(p)),
          ],
          if (_gateError == null && _profiles.isEmpty && _topPick == null && _loadError == null)
            _message(
              'No new profiles right now. Check back later — matches are refreshed as more members are approved.',
            ),
        ],
      ),
    );
  }

  Widget _message(String text, {bool danger = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(color: danger ? DfColors.danger : DfColors.muted),
        ),
      );

  Widget _limitsBar() {
    final plan = _limits?['plan']?.toString() ?? 'free';
    final swipes = _limits?['swipes_remaining']?.toString() ?? '—';
    final matches = _limits?['matches_remaining']?.toString() ?? '—';
    final streak = asInt(_limits?['streak_count']) ?? 0;
    final resetsIn = _limits?['resets_in']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              DatingChip(label: '${plan.toUpperCase()} plan', icon: Icons.workspace_premium),
              DatingChip(label: '$swipes swipes left', icon: Icons.favorite_border),
              DatingChip(label: '$matches matches left', icon: Icons.people_outline),
              if (streak > 0)
                DatingChip(
                  label: '$streak day streak',
                  icon: Icons.local_fire_department,
                  color: Colors.orange.shade800,
                ),
            ],
          ),
          if (resetsIn.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Resets in $resetsIn',
                style: const TextStyle(color: DfColors.muted, fontSize: 12)),
          ],
          if (plan == 'free') ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 40,
              child: OutlinedButton.icon(
                onPressed: widget.onOpenPlans,
                icon: const Icon(Icons.bolt, size: 18),
                label: const Text('Get more swipes'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _gateCard(String reason) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DfColors.danger.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock_outline, color: DfColors.danger),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Discover is locked',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(reason, style: const TextStyle(color: DfColors.muted)),
          const SizedBox(height: 6),
          const Text(
            'Complete your profile, add a photo and submit for approval. Suspended profiles must be cleared by the team.',
            style: TextStyle(color: DfColors.muted, fontSize: 12.5),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: widget.onEditProfile,
            child: const Text('Open my profile'),
          ),
        ],
      ),
    );
  }

  Widget _profileCard(Map<String, dynamic> p, {bool isTopPick = false}) {
    final photos = photoUrlsOf(p);
    final name = p['display_name']?.toString() ?? 'Member';
    final age = asInt(p['age']);
    final score = asInt(p['compatibility_score']);
    final location = p['location']?.toString() ?? '';
    final bio = p['bio']?.toString() ?? '';
    final interests = asStringList(p['interests']);
    final traits = asStringList(p['personality_traits']);
    final languages = asStringList(p['languages']);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isTopPick ? DfColors.brand : DfColors.muted.withValues(alpha: 0.18),
          width: isTopPick ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                child: SizedBox(
                  height: isTopPick ? 320 : 250,
                  width: double.infinity,
                  child: photos.isEmpty
                      ? Container(
                          color: DfColors.sand,
                          child: const Center(
                            child: Icon(Icons.person_outline, size: 48, color: DfColors.muted),
                          ),
                        )
                      : PageView(
                          children: photos
                              .map((url) => AuthedNetworkImage(imageUrl: url, fit: BoxFit.cover))
                              .toList(),
                        ),
                ),
              ),
              if (isTopPick)
                Positioned(
                  left: 12,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: DfColors.brandDark,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.white),
                        const SizedBox(width: 5),
                        Text(
                          'Top pick',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (score != null)
                Positioned(
                  right: 12,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '$score% match',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                        color: DfColors.brandDark,
                      ),
                    ),
                  ),
                ),
              if (photos.length > 1)
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: DatingChip(label: '${photos.length} photos', icon: Icons.photo_library),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        age != null ? '$name, $age' : name,
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 21),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Block or report',
                      icon: const Icon(Icons.more_horiz, color: DfColors.muted),
                      onPressed: () async {
                        final actioned = await showSafetyActions(
                          context,
                          agentId: _idOf(p),
                          displayName: name,
                        );
                        if (actioned && mounted) await load();
                      },
                    ),
                  ],
                ),
                if (location.isNotEmpty)
                  Row(
                    children: [
                      const Icon(Icons.place_outlined, size: 15, color: DfColors.muted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(location, style: const TextStyle(color: DfColors.muted)),
                      ),
                    ],
                  ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    DatingChip(label: intentionLabel(p['intentions']), icon: Icons.favorite),
                    if ((p['occupation']?.toString() ?? '').isNotEmpty)
                      DatingChip(label: p['occupation'].toString(), icon: Icons.work_outline),
                    if (asInt(p['height_cm']) != null)
                      DatingChip(label: '${asInt(p['height_cm'])} cm', icon: Icons.height),
                    if ((p['education']?.toString() ?? '').isNotEmpty)
                      DatingChip(label: p['education'].toString(), icon: Icons.school_outlined),
                    if ((p['religion']?.toString() ?? '').isNotEmpty)
                      DatingChip(label: p['religion'].toString()),
                    if ((p['children']?.toString() ?? '').isNotEmpty)
                      DatingChip(label: p['children'].toString(), icon: Icons.child_care),
                    if ((p['weekly_availability']?.toString() ?? '').isNotEmpty)
                      DatingChip(
                        label: 'Free: ${p['weekly_availability']}',
                        icon: Icons.schedule,
                      ),
                    if (p['ladies_first'] == true)
                      DatingChip(label: 'Ladies first', icon: Icons.shield_outlined),
                  ],
                ),
                if (bio.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(bio, style: const TextStyle(height: 1.4)),
                ],
                if (interests.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _labelled('Interests', interests),
                ],
                if (traits.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _labelled('Personality', traits),
                ],
                if (languages.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _labelled('Speaks', languages),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _swiping ? null : () => _swipe(p, 'pass'),
                        icon: const Icon(Icons.close, size: 18),
                        label: const Text('Pass'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _swiping ? null : () => _swipe(p, 'like'),
                        icon: const Icon(Icons.favorite, size: 18),
                        label: const Text('Like'),
                      ),
                    ),
                  ],
                ),
                if (isTopPick) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 46,
                    child: OutlinedButton.icon(
                      onPressed: _swiping ? null : () => _swipe(p, 'like', isTopPick: true),
                      icon: const Icon(Icons.star, size: 18),
                      label: const Text('Top-pick like (Silver / Gold)'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _labelled(String label, List<String> values) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: DfColors.muted,
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: values.map((v) => DatingChip(label: v, color: DfColors.muted)).toList(),
        ),
      ],
    );
  }
}

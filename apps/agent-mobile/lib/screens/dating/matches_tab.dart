import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import '../../widgets/authed_network_image.dart';
import 'chat_screen.dart';
import 'dating_common.dart';
import 'dating_constants.dart';

class MatchesTab extends StatefulWidget {
  const MatchesTab({super.key, required this.onOpenDiscover});

  final VoidCallback onOpenDiscover;

  @override
  State<MatchesTab> createState() => MatchesTabState();
}

class MatchesTabState extends State<MatchesTab> {
  List<Map<String, dynamic>> _matches = [];
  List<String> _icebreakers = icebreakerFallbacks;
  bool _loading = true;
  String? _error;

  final _matchedOn = DateFormat('d MMM yyyy');

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await DatingApi.instance.matches();
      if (!mounted) return;
      setState(() {
        _matches = asMapList(res['matches']);
        final prompts = asStringList(res['icebreakers']);
        if (prompts.isNotEmpty) _icebreakers = prompts;
      });
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
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
          if (_matches.isEmpty && _error == null) ...[
            const SizedBox(height: 40),
            const Text(
              'No matches yet. Like people in Discover — when they like you back the chat opens here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: DfColors.muted),
            ),
            const SizedBox(height: 18),
            Center(
              child: SizedBox(
                width: 220,
                child: ElevatedButton(
                  onPressed: widget.onOpenDiscover,
                  child: const Text('Go to Discover'),
                ),
              ),
            ),
          ],
          ..._matches.map(_matchTile),
        ],
      ),
    );
  }

  Widget _matchTile(Map<String, dynamic> match) {
    final profile = match['profile'] is Map
        ? Map<String, dynamic>.from(match['profile'] as Map)
        : null;
    final name = profile?['display_name']?.toString() ?? 'Member';
    final photos = photoUrlsOf(profile);
    final waiting = match['waiting_for_her'] == true;
    final chatStarted = match['chat_started'] == true;
    final matchedAt = DateTime.tryParse(match['matched_at']?.toString() ?? '');
    final otherAgentId = match['other_agent_id']?.toString() ?? '';

    return Card(
      color: DfColors.card,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DatingChatScreen(
                matchId: match['id']?.toString() ?? '',
                displayName: name,
                otherAgentId: otherAgentId,
                photoUrl: photos.isNotEmpty ? photos.first : '',
                icebreakers: _icebreakers,
              ),
            ),
          );
          if (mounted) await load();
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              AuthedNetworkImage(
                imageUrl: photos.isNotEmpty ? photos.first : '',
                height: 62,
                width: 62,
                borderRadius: BorderRadius.circular(31),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16.5),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      matchedAt != null
                          ? 'Matched ${_matchedOn.format(matchedAt)}'
                          : intentionLabel(profile?['intentions']),
                      style: const TextStyle(color: DfColors.muted, fontSize: 12.5),
                    ),
                    const SizedBox(height: 7),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        if (waiting)
                          DatingChip(
                            label: 'Waiting for her first message',
                            icon: Icons.hourglass_top,
                            color: Colors.orange.shade800,
                          )
                        else if (!chatStarted)
                          const DatingChip(label: 'Say hello', icon: Icons.waving_hand)
                        else
                          const DatingChip(label: 'Chat open', icon: Icons.forum_outlined),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: DfColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

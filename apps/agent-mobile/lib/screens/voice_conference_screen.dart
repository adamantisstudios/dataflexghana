import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class VoiceConferenceScreen extends StatefulWidget {
  const VoiceConferenceScreen({super.key});

  @override
  State<VoiceConferenceScreen> createState() => _VoiceConferenceScreenState();
}

class _VoiceConferenceScreenState extends State<VoiceConferenceScreen> {
  List<Map<String, dynamic>> _rooms = [];
  String? _agentRegion;
  bool _loading = true;
  String? _error;
  String? _joining;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getVoiceRooms();
      setState(() {
        _agentRegion = data['agentRegion']?.toString();
        _rooms = (data['rooms'] is List)
            ? (data['rooms'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _join(Map<String, dynamic> room) async {
    final roomName = room['room_name']?.toString() ?? '';
    if (roomName.isEmpty) return;
    setState(() => _joining = roomName);
    try {
      final tokenRes = await ApiClient.instance.getVoiceRoomToken(roomName: roomName, speak: false);
      final base = await SessionStore.instance.getBaseUrl();
      final webJoin = Uri.parse('$base/agent/voice-rooms').replace(queryParameters: {
        'room': roomName,
        if (tokenRes['token'] != null) 'hint': 'token-ready',
      });

      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(room['title']?.toString() ?? roomName),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Region: ${room['region'] ?? _agentRegion ?? '—'}'),
              Text('Participants: ${room['participant_count'] ?? 0}'),
              const SizedBox(height: 10),
              const Text(
                'Live audio uses LiveKit in the browser. Open the web conference to join with mic/video.',
                style: TextStyle(fontSize: 13, color: DfColors.muted),
              ),
              if (tokenRes['token'] != null) ...[
                const SizedBox(height: 8),
                const Text('Join token ready (copied when you tap Copy token).', style: TextStyle(fontSize: 12)),
              ],
            ],
          ),
          actions: [
            if (tokenRes['token'] != null)
              TextButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: tokenRes['token'].toString()));
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Token copied')));
                  }
                },
                child: const Text('Copy token'),
              ),
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await launchUrl(webJoin, mode: LaunchMode.externalApplication);
              },
              child: const Text('Open web join'),
            ),
          ],
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _joining = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Agent Conference')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: _error != null
                  ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (_agentRegion != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Text(
                              'Showing rooms for your region: $_agentRegion',
                              style: const TextStyle(color: DfColors.muted),
                            ),
                          ),
                        if (_rooms.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(top: 60),
                            child: Center(child: Text('No active conference rooms in your region')),
                          )
                        else
                          ..._rooms.map((r) {
                            final name = r['room_name']?.toString() ?? '';
                            final joining = _joining == name;
                            return Card(
                              margin: const EdgeInsets.only(bottom: 10),
                              child: ListTile(
                                title: Text(
                                  r['title']?.toString() ?? name,
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                                ),
                                subtitle: Text(
                                  '${r['region'] ?? '—'} · ${r['participant_count'] ?? 0} listening'
                                  '${(r['description']?.toString() ?? '').isNotEmpty ? '\n${r['description']}' : ''}',
                                ),
                                isThreeLine: (r['description']?.toString() ?? '').isNotEmpty,
                                trailing: joining
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                                      )
                                    : const Icon(Icons.meeting_room),
                                onTap: joining ? null : () => _join(r),
                              ),
                            );
                          }),
                      ],
                    ),
            ),
    );
  }
}

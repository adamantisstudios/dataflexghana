import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/conference_api.dart';
import '../services/livekit_service.dart';
import '../theme/app_theme.dart';
import 'admin_call_screen.dart';
import 'conference/conference_room_screen.dart';

/// Lists the regional voice conferences the agent may join and opens the real
/// in-app LiveKit room. Also the entry point for a support call to the admin.
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
      final data = await ConferenceApi.instance.voiceRooms();
      if (!mounted) return;
      setState(() {
        _agentRegion = data['agentRegion']?.toString();
        _rooms = (data['rooms'] is List)
            ? (data['rooms'] as List)
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
            : [];
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _join(Map<String, dynamic> room) async {
    final roomName = room['room_name']?.toString() ?? '';
    if (roomName.isEmpty) return;

    setState(() => _joining = roomName);
    try {
      // Everyone joins as a listener first — the host grants speaking rights
      // over the data channel, which triggers a token refetch + reconnect.
      final data = await ConferenceApi.instance.voiceRoomToken(roomName: roomName);
      final token = data['token']?.toString();
      final serverUrl = data['serverUrl']?.toString();
      if (token == null || token.isEmpty || serverUrl == null || serverUrl.isEmpty) {
        throw ApiException('This conference is not accepting joins right now');
      }

      // Ask for the mic up front so an "unmute" grant is instant later on.
      final permission = await LiveKitService.requestPermissions();
      if (permission == MediaPermissionResult.permanentlyDenied && mounted) {
        _toast('Microphone access is blocked — you will join as a listener only.');
      }

      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ConferenceRoomScreen(
            config: ConferenceRoomConfig(
              mode: ConferenceMode.voiceRoom,
              title: room['name']?.toString() ??
                  room['title']?.toString() ??
                  roomName,
              subtitle: room['region']?.toString() ?? _agentRegion,
              roomName: roomName,
              serverUrl: serverUrl,
              token: token,
              canPublish: data['canPublish'] == true,
              canPublishVideo: data['canPublishVideo'] == true,
            ),
          ),
        ),
      );
      await _load();
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _joining = null);
    }
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _callAdmin() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const AdminCallScreen()),
    );
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
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _CallAdminCard(onTap: _callAdmin),
                  const SizedBox(height: 18),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                    ),
                  if (_agentRegion != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Rooms for your region: $_agentRegion',
                        style: const TextStyle(color: DfColors.muted),
                      ),
                    ),
                  if (_rooms.isEmpty && _error == null)
                    const Padding(
                      padding: EdgeInsets.only(top: 50),
                      child: Center(
                        child: Text('No active conference rooms in your region'),
                      ),
                    )
                  else
                    ..._rooms.map(_buildRoomCard),
                ],
              ),
            ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> room) {
    final roomName = room['room_name']?.toString() ?? '';
    final joining = _joining == roomName;
    final description = room['description']?.toString() ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: DfColors.brand.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.graphic_eq_rounded, color: DfColors.brand),
        ),
        title: Text(
          room['name']?.toString() ?? room['title']?.toString() ?? roomName,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${room['region'] ?? '—'} · ${room['participant_count'] ?? 0} listening'
          '${description.isNotEmpty ? '\n$description' : ''}',
        ),
        isThreeLine: description.isNotEmpty,
        trailing: joining
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
              )
            : const Icon(Icons.login_rounded, color: DfColors.brand),
        onTap: joining ? null : () => _join(room),
      ),
    );
  }
}

class _CallAdminCard extends StatelessWidget {
  const _CallAdminCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            colors: [DfColors.brandDark, DfColors.brand],
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.support_agent_rounded, color: Colors.white),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Call Admin',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Talk to DataFlex support live, right here in the app',
                    style: TextStyle(color: Colors.white70, fontSize: 12.5),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 16),
          ],
        ),
      ),
    );
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../services/channels_api.dart';
import '../../services/conference_api.dart';
import '../../services/livekit_service.dart';
import '../../services/session_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/display_format.dart';
import '../../widgets/image_viewer.dart';
import '../conference/conference_room_screen.dart';
import 'channel_host_forms.dart';

/// Teacher / channel-admin console: the mobile counterpart of the website's
/// TeacherChannelDashboard. Reached from the member channel view when the
/// signed-in agent hosts the channel.
class ChannelHostDashboardScreen extends StatefulWidget {
  const ChannelHostDashboardScreen({
    super.key,
    required this.channelId,
    this.channelName,
  });

  final String channelId;
  final String? channelName;

  @override
  State<ChannelHostDashboardScreen> createState() => _ChannelHostDashboardScreenState();
}

class _ChannelHostDashboardScreenState extends State<ChannelHostDashboardScreen>
    with SingleTickerProviderStateMixin {
  static const _tabLabels = [
    'Overview',
    'Content',
    'Members',
    'Requests',
    'Quizzes',
    'Videos',
    'Audio',
    'Notes',
    'Money',
  ];

  late final TabController _tabs;

  Map<String, dynamic> _channel = {};
  Map<String, dynamic> _stats = {};
  Map<String, dynamic>? _subscription;
  Map<String, dynamic>? _liveSession;
  String _role = 'teacher';

  List<Map<String, dynamic>> _posts = [];
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _qa = [];
  List<Map<String, dynamic>> _uploads = [];
  List<Map<String, dynamic>> _youtube = [];
  List<Map<String, dynamic>> _embeds = [];
  List<Map<String, dynamic>> _audio = [];
  List<Map<String, dynamic>> _notes = [];

  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _requests = [];
  bool _membersLoaded = false;
  bool _requestsLoaded = false;
  String _memberSearch = '';
  String _requestSearch = '';

  bool _loading = true;
  bool _busy = false;
  String? _error;

  final _dateFmt = DateFormat('d MMM yyyy · h:mm a');

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _tabLabels.length, vsync: this);
    if (widget.channelName != null) _channel = {'name': widget.channelName};
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _rows(Object? raw) {
    if (raw is List) {
      return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return const [];
  }

  Map<String, dynamic> _map(Object? raw) =>
      raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{};

  String _when(Object? raw) {
    final parsed = DateTime.tryParse(raw?.toString() ?? '');
    if (parsed == null) return 'Recently';
    return _dateFmt.format(parsed.toLocal());
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ChannelsApi.instance.hostDashboard(widget.channelId);
      if (!mounted) return;
      setState(() {
        _channel = _map(data['channel']);
        _stats = _map(data['stats']);
        _subscription = data['subscription'] is Map ? _map(data['subscription']) : null;
        _liveSession = data['live_session'] is Map ? _map(data['live_session']) : null;
        _role = _map(data['host'])['role']?.toString() ?? 'teacher';
        _posts = _rows(data['posts']);
        _messages = _rows(data['messages']);
        _qa = _rows(data['qa']);
        _uploads = _rows(data['videos']);
        _youtube = _rows(data['youtube_videos']);
        _embeds = _rows(data['embed_videos']);
        _audio = _rows(data['audio']);
        _notes = _rows(data['notes']);
      });
      await Future.wait([_loadMembers(), _loadRequests()]);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMembers() async {
    try {
      final list = await ChannelsApi.instance.members(widget.channelId, status: 'all');
      if (!mounted) return;
      setState(() {
        _members = list;
        _membersLoaded = true;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _membersLoaded = true);
      _toast(e.message);
    }
  }

  Future<void> _loadRequests() async {
    try {
      final list = await ChannelsApi.instance.joinRequests(widget.channelId, status: 'pending');
      if (!mounted) return;
      setState(() {
        _requests = list;
        _requestsLoaded = true;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _requestsLoaded = true);
      _toast(e.message);
    }
  }

  /// Wraps a mutation with a busy flag, snackbar error handling and a refresh.
  Future<void> _act(
    Future<void> Function() action, {
    String? success,
    bool refreshFeedCache = true,
  }) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
      if (refreshFeedCache) {
        await ChannelsApi.instance.invalidateFeed(widget.channelId);
      }
      if (success != null) _toast(success);
      await _load();
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _confirm(String title, String message, {String confirmLabel = 'Delete'}) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: DfColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _openSheet(Widget form) async {
    final saved = await showHostSheet(context, form);
    if (saved) {
      await ChannelsApi.instance.invalidateFeed(widget.channelId);
      await _load();
    }
  }

  Future<void> _openUrl(String? raw) async {
    final url = (raw ?? '').trim();
    if (url.isEmpty) return;
    final resolved =
        url.startsWith('http') ? url : '${await SessionStore.instance.getBaseUrl()}$url';
    final uri = Uri.tryParse(resolved);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  // ── Live sessions ─────────────────────────────────────────────────────────

  Future<void> _goLive(String sessionType) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final permission = await LiveKitService.requestPermissions();
      if (permission == MediaPermissionResult.permanentlyDenied) {
        _toast('Microphone access is blocked in system settings.');
        return;
      }
      final data = await ConferenceApi.instance.startChannelLive(
        channelId: widget.channelId,
        sessionType: sessionType,
        title: _channel['name']?.toString() ?? 'Live session',
      );
      await _enterRoom(data, isHost: true, videoSession: sessionType == 'video');
    } on ApiException catch (e) {
      _toast(e.message);
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _rejoinLive() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await LiveKitService.requestPermissions();
      final data = await ConferenceApi.instance.joinChannelLive(
        channelId: widget.channelId,
        speak: true,
      );
      await _enterRoom(
        data,
        isHost: data['isHost'] == true,
        videoSession: _map(data['session'])['session_type']?.toString() == 'video',
      );
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _enterRoom(
    Map<String, dynamic> data, {
    required bool isHost,
    required bool videoSession,
  }) async {
    final token = data['token']?.toString() ?? '';
    final serverUrl = data['serverUrl']?.toString() ?? '';
    final session = _map(data['session']);
    final roomName = data['roomName']?.toString() ?? session['room_name']?.toString() ?? '';

    if (token.isEmpty || serverUrl.isEmpty || roomName.isEmpty) {
      _toast('The live room is not ready yet. Try again in a moment.');
      return;
    }
    if (!mounted) return;

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ConferenceRoomScreen(
          config: ConferenceRoomConfig(
            mode: ConferenceMode.channelLive,
            title: session['title']?.toString().isNotEmpty == true
                ? session['title'].toString()
                : (_channel['name']?.toString() ?? 'Channel live'),
            subtitle: videoSession ? 'Video session' : 'Audio session',
            roomName: roomName,
            serverUrl: serverUrl,
            token: token,
            channelId: widget.channelId,
            sessionId: session['id']?.toString(),
            canPublish: true,
            canPublishVideo: videoSession,
            isHost: isHost,
            videoSession: videoSession,
          ),
        ),
      ),
    );
    if (mounted) await _load();
  }

  Future<void> _endLive() async {
    final sessionId = _liveSession?['id']?.toString();
    if (sessionId == null || sessionId.isEmpty) return;
    if (!await _confirm('End live session', 'Members will be disconnected.', confirmLabel: 'End')) {
      return;
    }
    await _act(
      () => ConferenceApi.instance.endChannelLive(sessionId).then((_) {}),
      success: 'Live session ended',
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final name = _channel['name']?.toString() ?? widget.channelName ?? 'Channel';
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, overflow: TextOverflow.ellipsis),
            Text(
              'Host tools · ${_roleLabel(_role)}',
              style: const TextStyle(fontSize: 11.5, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Channel settings',
            onPressed: _loading
                ? null
                : () => _openSheet(
                      ChannelSettingsForm(channelId: widget.channelId, channel: _channel),
                    ),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
        bottom: _loading || _error != null
            ? null
            : TabBar(
                controller: _tabs,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: [for (final label in _tabLabels) Tab(text: label)],
              ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? _buildError()
              : Column(
                  children: [
                    if (_busy) const LinearProgressIndicator(minHeight: 2, color: DfColors.brand),
                    Expanded(
                      child: TabBarView(
                        controller: _tabs,
                        children: [
                          _buildOverviewTab(),
                          _buildContentTab(),
                          _buildMembersTab(),
                          _buildRequestsTab(),
                          _buildQuizzesTab(),
                          _buildVideosTab(),
                          _buildAudioTab(),
                          _buildNotesTab(),
                          _buildMoneyTab(),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'platform_admin':
        return 'Platform admin';
      case 'owner':
        return 'Channel owner';
      case 'admin':
        return 'Channel admin';
      default:
        return 'Teacher';
    }
  }

  Widget _buildError() {
    return RefreshIndicator(
      onRefresh: _load,
      color: DfColors.brand,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 40),
          const Icon(Icons.lock_outline, color: DfColors.danger, size: 40),
          const SizedBox(height: 12),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: DfColors.danger),
          ),
          const SizedBox(height: 16),
          Center(child: OutlinedButton(onPressed: _load, child: const Text('Try again'))),
        ],
      ),
    );
  }

  Widget _tabBody({required List<Widget> children}) {
    return RefreshIndicator(
      onRefresh: _load,
      color: DfColors.brand,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 32),
        children: children,
      ),
    );
  }

  Widget _sectionTitle(String text, {Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(text, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
          ),
          ?trailing,
        ],
      ),
    );
  }

  Widget _card({required Widget child, Color? tint}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tint ?? DfColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x14000000)),
      ),
      child: child,
    );
  }

  Widget _emptyNote(String message, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 36),
      child: Column(
        children: [
          Icon(icon, size: 38, color: DfColors.muted),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: DfColors.muted),
          ),
        ],
      ),
    );
  }

  Widget _primaryAction(String label, IconData icon, VoidCallback? onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ElevatedButton.icon(
        onPressed: _busy ? null : onTap,
        icon: Icon(icon, size: 18),
        label: Text(label),
      ),
    );
  }

  // ── Overview ──────────────────────────────────────────────────────────────

  Widget _buildOverviewTab() {
    final live = _liveSession;
    return _tabBody(
      children: [
        _buildLiveCard(live),
        _sectionTitle('At a glance'),
        Row(
          children: [
            _statTile('Members', '${_stats['member_count'] ?? 0}', Icons.group_outlined),
            const SizedBox(width: 10),
            _statTile('Pending', '${_stats['pending_requests'] ?? 0}', Icons.how_to_reg_outlined,
                tint: DfColors.danger),
            const SizedBox(width: 10),
            _statTile('Capacity', '${_stats['max_members'] ?? '—'}', Icons.event_seat_outlined),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _statTile('Posts', '${_stats['post_count'] ?? 0}', Icons.article_outlined),
            const SizedBox(width: 10),
            _statTile('Quizzes', '${_stats['quiz_count'] ?? 0}', Icons.quiz_outlined),
            const SizedBox(width: 10),
            _statTile('Videos', '${_stats['video_count'] ?? 0}', Icons.play_circle_outline),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _statTile('Lectures', '${_stats['audio_count'] ?? 0}', Icons.headphones_outlined),
            const SizedBox(width: 10),
            _statTile('Notes', '${_stats['note_count'] ?? 0}', Icons.sticky_note_2_outlined),
            const SizedBox(width: 10),
            _statTile('Updates', '${_stats['message_count'] ?? 0}', Icons.campaign_outlined),
          ],
        ),
        const SizedBox(height: 18),
        _sectionTitle('Quick actions'),
        _primaryAction('Create lesson post', Icons.post_add,
            () => _openSheet(PostComposerForm(channelId: widget.channelId))),
        _primaryAction('Share an update', Icons.campaign_outlined,
            () => _openSheet(AnnouncementForm(channelId: widget.channelId))),
        _primaryAction('Create quiz', Icons.quiz_outlined,
            () => _openSheet(QuizComposerForm(channelId: widget.channelId))),
        _primaryAction('Post a video', Icons.smart_display_outlined,
            () => _openSheet(VideoComposerForm(channelId: widget.channelId))),
        _primaryAction('Write lesson note', Icons.sticky_note_2_outlined,
            () => _openSheet(LessonNoteForm(channelId: widget.channelId))),
        const SizedBox(height: 8),
        _card(
          tint: DfColors.sand,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Still website-only',
                style: GoogleFonts.outfit(fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              const Text(
                'Uploading images, audio lectures, documents and video files needs the '
                'website — the app manages, renames and deletes them once uploaded.',
                style: TextStyle(fontSize: 12, color: DfColors.muted, height: 1.5),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statTile(String label, String value, IconData icon, {Color? tint}) {
    final color = tint ?? DfColors.brand;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 6),
            Text(value, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
            Text(label, style: const TextStyle(fontSize: 11, color: DfColors.muted)),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveCard(Map<String, dynamic>? live) {
    final isLive = live != null && live['is_active'] == true;
    return _card(
      tint: isLive ? DfColors.danger.withValues(alpha: 0.06) : DfColors.card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isLive ? Icons.sensors : Icons.sensors_off_outlined,
                size: 18,
                color: isLive ? DfColors.danger : DfColors.muted,
              ),
              const SizedBox(width: 8),
              Text(
                isLive ? 'Live now' : 'Go live',
                style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isLive
                ? '${live['session_type']?.toString() == 'video' ? 'Video' : 'Audio'} session started ${_when(live['created_at'])}'
                : 'Start an audio or video session — members join straight from their feed.',
            style: const TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.5),
          ),
          const SizedBox(height: 12),
          if (isLive)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _busy ? null : _rejoinLive,
                    icon: const Icon(Icons.login, size: 18),
                    label: const Text('Rejoin'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _busy ? null : _endLive,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: DfColors.danger,
                      minimumSize: const Size.fromHeight(48),
                    ),
                    icon: const Icon(Icons.stop_circle_outlined, size: 18),
                    label: const Text('End'),
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _busy ? null : () => _goLive('audio'),
                    icon: const Icon(Icons.mic_none, size: 18),
                    label: const Text('Audio live'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _busy ? null : () => _goLive('video'),
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    icon: const Icon(Icons.videocam_outlined, size: 18),
                    label: const Text('Video live'),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  // ── Content (posts + broadcast messages) ──────────────────────────────────

  Widget _buildContentTab() {
    return _tabBody(
      children: [
        _primaryAction('Create lesson post', Icons.post_add,
            () => _openSheet(PostComposerForm(channelId: widget.channelId))),
        _primaryAction('Share an update', Icons.campaign_outlined,
            () => _openSheet(AnnouncementForm(channelId: widget.channelId))),
        _sectionTitle('Posts (${_posts.length})'),
        if (_posts.isEmpty)
          _emptyNote('No posts yet. Publish your first lesson.', Icons.article_outlined)
        else
          ..._posts.map(_buildPostRow),
        const SizedBox(height: 8),
        _sectionTitle(
          'Channel updates (${_messages.length})',
          trailing: _messages.isEmpty
              ? null
              : TextButton.icon(
                  onPressed: _busy
                      ? null
                      : () async {
                          final ok = await _confirm(
                            'Clear all updates',
                            'Every channel message and its attachments will be permanently removed.',
                            confirmLabel: 'Clear',
                          );
                          if (!ok) return;
                          await _act(
                            () => ChannelsApi.instance.clearChat(widget.channelId),
                            success: 'Channel updates cleared',
                          );
                        },
                  icon: const Icon(Icons.delete_sweep_outlined, size: 18, color: DfColors.danger),
                  label: const Text('Clear', style: TextStyle(color: DfColors.danger)),
                ),
        ),
        if (_messages.isEmpty)
          _emptyNote('No channel updates yet.', Icons.campaign_outlined)
        else
          ..._messages.map(_buildMessageRow),
      ],
    );
  }

  Widget _buildPostRow(Map<String, dynamic> post) {
    final id = post['id']?.toString() ?? '';
    final pinned = post['is_pinned'] == true;
    final archived = post['is_archived'] == true;
    final deleted = post['is_deleted'] == true;

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  post['title']?.toString() ?? 'Untitled post',
                  style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
              if (pinned) _tag('Pinned', DfColors.brand),
              if (archived || deleted) _tag('Hidden', DfColors.danger),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            '${post['post_type']?.toString() ?? 'lesson'} · ${_when(post['created_at'])} · '
            '${post['view_count'] ?? 0} views · ${post['comment_count'] ?? 0} comments',
            style: const TextStyle(fontSize: 11, color: DfColors.muted),
          ),
          const SizedBox(height: 8),
          Text(
            _stripHtml(post['content']?.toString() ?? ''),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, height: 1.5, color: DfColors.ink),
          ),
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              _iconAction(
                pinned ? Icons.push_pin : Icons.push_pin_outlined,
                pinned ? 'Unpin' : 'Pin',
                () => _act(
                  () => ChannelsApi.instance
                      .updatePost(widget.channelId, postId: id, pinned: !pinned),
                  success: pinned ? 'Post unpinned' : 'Post pinned',
                ),
              ),
              _iconAction(Icons.edit_outlined, 'Edit',
                  () => _openSheet(PostComposerForm(channelId: widget.channelId, post: post))),
              _iconAction(
                archived ? Icons.unarchive_outlined : Icons.archive_outlined,
                archived ? 'Unarchive' : 'Archive',
                () => _act(
                  () => ChannelsApi.instance
                      .updatePost(widget.channelId, postId: id, archived: !archived),
                  success: archived ? 'Post restored' : 'Post archived',
                ),
              ),
              _iconAction(Icons.delete_outline, 'Delete', () async {
                if (!await _confirm('Delete post', 'Members will no longer see this post.')) return;
                await _act(
                  () => ChannelsApi.instance.deletePost(widget.channelId, id),
                  success: 'Post deleted',
                );
              }, danger: true),
              _iconAction(Icons.delete_forever_outlined, 'Delete forever', () async {
                if (!await _confirm(
                  'Delete permanently',
                  'This cannot be undone.',
                  confirmLabel: 'Delete forever',
                )) {
                  return;
                }
                await _act(
                  () => ChannelsApi.instance.deletePost(widget.channelId, id, permanent: true),
                  success: 'Post permanently deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMessageRow(Map<String, dynamic> message) {
    final id = message['id']?.toString() ?? '';
    final type = message['message_type']?.toString() ?? 'text';
    final media = _rows(message['message_media']);
    final images = media
        .where((m) => m['media_type']?.toString() == 'image')
        .map((m) => DisplayFormat.resolveImageUrl(m['media_url']?.toString()))
        .where((u) => u.isNotEmpty)
        .toList();

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  type == 'deleted' ? 'Deleted update' : 'Channel update',
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700),
                ),
              ),
              _tag(type, type == 'deleted' ? DfColors.danger : DfColors.brandLight),
            ],
          ),
          const SizedBox(height: 3),
          Text(_when(message['created_at']),
              style: const TextStyle(fontSize: 11, color: DfColors.muted)),
          const SizedBox(height: 8),
          Text(
            _stripHtml(message['content']?.toString() ?? ''),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, height: 1.5, color: DfColors.ink),
          ),
          if (images.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 84,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) => GestureDetector(
                  onTap: () => FullScreenImageViewer.open(
                    context,
                    images: images,
                    initialIndex: i,
                    title: 'Channel update',
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CachedNetworkImage(
                      imageUrl: images[i],
                      height: 84,
                      width: 84,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) => Container(
                        height: 84,
                        width: 84,
                        color: DfColors.sand,
                        child: const Icon(Icons.broken_image_outlined, color: DfColors.muted),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
          for (final m in media.where((m) => m['media_type']?.toString() != 'image'))
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _openUrl(m['media_url']?.toString()),
                      icon: const Icon(Icons.attach_file, size: 16),
                      label: Text(
                        m['file_name']?.toString() ?? 'Attachment',
                        overflow: TextOverflow.ellipsis,
                      ),
                      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(42)),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Remove attachment',
                    onPressed: _busy
                        ? null
                        : () => _act(
                              () => ChannelsApi.instance.deleteMessageMedia(
                                widget.channelId,
                                m['id'].toString(),
                              ),
                              success: 'Attachment removed',
                            ),
                    icon: const Icon(Icons.close, size: 18, color: DfColors.danger),
                  ),
                ],
              ),
            ),
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              if (type != 'deleted')
                _iconAction(Icons.delete_outline, 'Delete', () async {
                  if (!await _confirm('Delete update', 'The update will be marked as deleted.')) {
                    return;
                  }
                  await _act(
                    () => ChannelsApi.instance.deleteMessage(widget.channelId, id),
                    success: 'Update deleted',
                  );
                }, danger: true),
              _iconAction(Icons.delete_forever_outlined, 'Delete forever', () async {
                if (!await _confirm(
                  'Delete permanently',
                  'This cannot be undone.',
                  confirmLabel: 'Delete forever',
                )) {
                  return;
                }
                await _act(
                  () => ChannelsApi.instance.deleteMessage(widget.channelId, id, permanent: true),
                  success: 'Update permanently deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  // ── Members ───────────────────────────────────────────────────────────────

  Widget _buildMembersTab() {
    final search = _memberSearch.toLowerCase();
    final visible = search.isEmpty
        ? _members
        : _members.where((m) {
            final name = m['agent_name']?.toString().toLowerCase() ?? '';
            final contact = m['agent_contact']?.toString().toLowerCase() ?? '';
            return name.contains(search) || contact.contains(search);
          }).toList();

    return _tabBody(
      children: [
        _primaryAction('Add member directly', Icons.person_add_alt,
            () => _openSheet(AddMemberForm(channelId: widget.channelId))),
        TextField(
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.search),
            hintText: 'Search members by name or phone',
          ),
          onChanged: (v) => setState(() => _memberSearch = v),
        ),
        const SizedBox(height: 12),
        _sectionTitle('Members (${visible.length})'),
        if (!_membersLoaded)
          const Center(child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(color: DfColors.brand),
          ))
        else if (visible.isEmpty)
          _emptyNote('No members match this search.', Icons.group_outlined)
        else
          ...visible.map(_buildMemberRow),
      ],
    );
  }

  Widget _buildMemberRow(Map<String, dynamic> member) {
    final memberId = member['id']?.toString() ?? '';
    final role = member['role']?.toString() ?? 'member';
    final status = member['status']?.toString() ?? 'active';
    final contact = member['agent_contact']?.toString() ?? '';

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member['agent_name']?.toString() ?? 'Agent',
                      style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      contact.isEmpty ? 'No contact' : contact,
                      style: const TextStyle(fontSize: 12, color: DfColors.muted),
                    ),
                    Text(
                      'Joined ${_when(member['joined_at'])}',
                      style: const TextStyle(fontSize: 11, color: DfColors.muted),
                    ),
                  ],
                ),
              ),
              _tag(role, role == 'member' ? DfColors.muted : DfColors.brand),
              if (status != 'active') _tag(status, DfColors.danger),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: role,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Role', isDense: true),
                  items: const [
                    DropdownMenuItem(value: 'member', child: Text('Member')),
                    DropdownMenuItem(value: 'teacher', child: Text('Teacher')),
                    DropdownMenuItem(value: 'admin', child: Text('Admin')),
                  ],
                  onChanged: _busy
                      ? null
                      : (value) {
                          if (value == null || value == role) return;
                          _act(
                            () => ChannelsApi.instance
                                .updateMember(widget.channelId, memberId: memberId, role: value),
                            success: 'Role updated',
                          );
                        },
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                tooltip: status == 'active' ? 'Suspend member' : 'Reactivate member',
                onPressed: _busy
                    ? null
                    : () => _act(
                          () => ChannelsApi.instance.updateMember(
                            widget.channelId,
                            memberId: memberId,
                            status: status == 'active' ? 'suspended' : 'active',
                          ),
                          success: status == 'active' ? 'Member suspended' : 'Member reactivated',
                        ),
                icon: Icon(
                  status == 'active' ? Icons.pause_circle_outline : Icons.play_circle_outline,
                  color: DfColors.brandDark,
                ),
              ),
              IconButton(
                tooltip: 'Remove from channel',
                onPressed: _busy
                    ? null
                    : () async {
                        final ok = await _confirm(
                          'Remove member',
                          '${member['agent_name'] ?? 'This agent'} will lose access to the channel.',
                          confirmLabel: 'Remove',
                        );
                        if (!ok) return;
                        await _act(
                          () => ChannelsApi.instance.removeMember(widget.channelId, memberId),
                          success: 'Member removed',
                        );
                      },
                icon: const Icon(Icons.person_remove_outlined, color: DfColors.danger),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Join requests ─────────────────────────────────────────────────────────

  Widget _buildRequestsTab() {
    final search = _requestSearch.toLowerCase();
    final visible = search.isEmpty
        ? _requests
        : _requests.where((r) {
            final name = r['agent_name']?.toString().toLowerCase() ?? '';
            final contact = r['agent_contact']?.toString().toLowerCase() ?? '';
            return name.contains(search) || contact.contains(search);
          }).toList();

    return _tabBody(
      children: [
        TextField(
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.search),
            hintText: 'Search join requests',
          ),
          onChanged: (v) => setState(() => _requestSearch = v),
        ),
        const SizedBox(height: 12),
        _sectionTitle('Pending requests (${visible.length})'),
        if (!_requestsLoaded)
          const Center(child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(color: DfColors.brand),
          ))
        else if (visible.isEmpty)
          _emptyNote('No pending join requests.', Icons.how_to_reg_outlined)
        else
          ...visible.map(_buildRequestRow),
      ],
    );
  }

  Widget _buildRequestRow(Map<String, dynamic> request) {
    final id = request['id']?.toString() ?? '';
    final message = request['request_message']?.toString() ?? '';
    final paid = _subscription?['is_enabled'] == true;

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            request['agent_name']?.toString() ?? 'Agent',
            style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.w700),
          ),
          Text(
            request['agent_contact']?.toString().isNotEmpty == true
                ? request['agent_contact'].toString()
                : 'No contact',
            style: const TextStyle(fontSize: 12, color: DfColors.muted),
          ),
          Text(
            'Requested ${_when(request['created_at'])}',
            style: const TextStyle(fontSize: 11, color: DfColors.muted),
          ),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: DfColors.sand,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(message, style: const TextStyle(fontSize: 12.5, height: 1.5)),
            ),
          ],
          if (paid) ...[
            const SizedBox(height: 8),
            Text(
              'Approving confirms payment of ${DisplayFormat.money(_subscription?['monthly_fee'] is num ? _subscription!['monthly_fee'] as num : 0)} and activates 30 days of access.',
              style: const TextStyle(fontSize: 11.5, color: DfColors.brandDark, height: 1.5),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => _act(
                            () => ChannelsApi.instance
                                .respondToRequest(widget.channelId,
                                    requestId: id, approve: true)
                                .then((_) {}),
                            success: 'Request approved',
                          ),
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('Approve'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => _act(
                            () => ChannelsApi.instance
                                .respondToRequest(widget.channelId,
                                    requestId: id, approve: false)
                                .then((_) {}),
                            success: 'Request rejected',
                          ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: DfColors.danger,
                    minimumSize: const Size.fromHeight(48),
                  ),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: const Text('Reject'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Quizzes ───────────────────────────────────────────────────────────────

  Widget _buildQuizzesTab() {
    return _tabBody(
      children: [
        _primaryAction('Create quiz', Icons.quiz_outlined,
            () => _openSheet(QuizComposerForm(channelId: widget.channelId))),
        _sectionTitle('Quizzes (${_qa.length})'),
        if (_qa.isEmpty)
          _emptyNote('No quizzes yet. Create your first one.', Icons.quiz_outlined)
        else
          ..._qa.map(_buildQuizRow),
      ],
    );
  }

  Widget _buildQuizRow(Map<String, dynamic> quiz) {
    final id = quiz['id']?.toString() ?? '';
    final revealed = quiz['is_revealed'] == true;
    final deleted = quiz['is_deleted'] == true;
    final options = <String, Object?>{
      'A': quiz['option_a'],
      'B': quiz['option_b'],
      'C': quiz['option_c'],
      'D': quiz['option_d'],
      'E': quiz['option_e'],
    };
    final correct = quiz['correct_answer']?.toString();

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  _stripHtml(quiz['question']?.toString() ?? 'Quiz'),
                  style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.w700, height: 1.4),
                ),
              ),
              _tag(revealed ? 'Revealed' : 'Hidden',
                  revealed ? DfColors.brand : DfColors.muted),
              if (deleted) _tag('Deleted', DfColors.danger),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            '${_when(quiz['created_at'])} · ${quiz['view_count'] ?? 0} views',
            style: const TextStyle(fontSize: 11, color: DfColors.muted),
          ),
          const SizedBox(height: 8),
          for (final entry in options.entries)
            if ((entry.value?.toString() ?? '').isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 5),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: correct == entry.key
                        ? DfColors.brand.withValues(alpha: 0.12)
                        : DfColors.sand.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${entry.key}. ${_stripHtml(entry.value!.toString())}',
                          style: const TextStyle(fontSize: 12.5, color: DfColors.ink),
                        ),
                      ),
                      if (correct == entry.key)
                        const Icon(Icons.check_circle, size: 15, color: DfColors.brand),
                    ],
                  ),
                ),
              ),
          if ((quiz['explanation']?.toString() ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              _stripHtml(quiz['explanation'].toString()),
              style: const TextStyle(fontSize: 12, color: DfColors.muted, height: 1.5),
            ),
          ],
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              _iconAction(
                revealed ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                revealed ? 'Hide answer' : 'Reveal answer',
                () => _act(
                  () => ChannelsApi.instance
                      .revealQuiz(widget.channelId, quizId: id, revealed: !revealed),
                  success: revealed ? 'Answer hidden' : 'Answer revealed',
                ),
              ),
              _iconAction(Icons.delete_outline, 'Delete', () async {
                if (!await _confirm('Delete quiz', 'Members will no longer see this quiz.')) return;
                await _act(
                  () => ChannelsApi.instance.deleteQuiz(widget.channelId, id),
                  success: 'Quiz deleted',
                );
              }, danger: true),
              _iconAction(Icons.delete_forever_outlined, 'Delete forever', () async {
                if (!await _confirm(
                  'Delete permanently',
                  'This cannot be undone.',
                  confirmLabel: 'Delete forever',
                )) {
                  return;
                }
                await _act(
                  () => ChannelsApi.instance.deleteQuiz(widget.channelId, id, permanent: true),
                  success: 'Quiz permanently deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  // ── Videos ────────────────────────────────────────────────────────────────

  Widget _buildVideosTab() {
    return _tabBody(
      children: [
        _primaryAction('Post a video', Icons.smart_display_outlined,
            () => _openSheet(VideoComposerForm(channelId: widget.channelId))),
        _sectionTitle('YouTube (${_youtube.length})'),
        if (_youtube.isEmpty)
          _emptyNote('No YouTube videos yet.', Icons.smart_display_outlined)
        else
          ..._youtube.map((v) => _buildVideoRow(v, source: 'youtube')),
        _sectionTitle('Uploaded videos (${_uploads.length})'),
        if (_uploads.isEmpty)
          _emptyNote('No uploaded videos. Upload them on the website.', Icons.movie_outlined)
        else
          ..._uploads.map((v) => _buildVideoRow(v, source: 'upload')),
        _sectionTitle('Embedded videos (${_embeds.length})'),
        if (_embeds.isEmpty)
          _emptyNote('No embedded videos.', Icons.code)
        else
          ..._embeds.map((v) => _buildVideoRow(v, source: 'embed')),
      ],
    );
  }

  Widget _buildVideoRow(Map<String, dynamic> video, {required String source}) {
    final id = video['id']?.toString() ?? '';
    final hidden = video['is_archived'] == true ||
        video['is_deleted'] == true ||
        video['is_active'] == false;
    final youtubeId = video['youtube_video_id']?.toString() ?? '';
    final thumb = DisplayFormat.resolveImageUrl(video['thumbnail_url']?.toString());
    final poster = thumb.isNotEmpty
        ? thumb
        : youtubeId.isNotEmpty
            ? 'https://img.youtube.com/vi/$youtubeId/hqdefault.jpg'
            : '';

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (poster.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CachedNetworkImage(
                      imageUrl: poster,
                      height: 56,
                      width: 88,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) =>
                          Container(height: 56, width: 88, color: Colors.black87),
                    ),
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      video['title']?.toString() ?? 'Video',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      '${_when(video['created_at'])} · ${video['view_count'] ?? 0} views',
                      style: const TextStyle(fontSize: 11, color: DfColors.muted),
                    ),
                  ],
                ),
              ),
              if (hidden) _tag('Hidden', DfColors.danger),
            ],
          ),
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              if (source == 'youtube' && youtubeId.isNotEmpty)
                _iconAction(Icons.open_in_new, 'Watch',
                    () => _openUrl('https://www.youtube.com/watch?v=$youtubeId')),
              if (source == 'upload' && (video['video_url']?.toString() ?? '').isNotEmpty)
                _iconAction(Icons.open_in_new, 'Watch',
                    () => _openUrl(video['video_url']?.toString())),
              _iconAction(Icons.visibility_off_outlined, 'Hide from members', () async {
                if (!await _confirm('Hide video', 'Members will no longer see this video.',
                    confirmLabel: 'Hide')) {
                  return;
                }
                await _act(
                  () => ChannelsApi.instance.deleteVideo(widget.channelId, id, source: source),
                  success: 'Video hidden',
                );
              }, danger: true),
              _iconAction(Icons.delete_forever_outlined, 'Delete forever', () async {
                if (!await _confirm(
                  'Delete permanently',
                  'This cannot be undone.',
                  confirmLabel: 'Delete forever',
                )) {
                  return;
                }
                await _act(
                  () => ChannelsApi.instance
                      .deleteVideo(widget.channelId, id, source: source, permanent: true),
                  success: 'Video permanently deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  // ── Audio lectures ────────────────────────────────────────────────────────

  Widget _buildAudioTab() {
    return _tabBody(
      children: [
        _card(
          tint: DfColors.sand,
          child: const Text(
            'Recording and uploading lectures happens on the website. Here you can '
            'preview, rename and delete what is already published.',
            style: TextStyle(fontSize: 12, color: DfColors.muted, height: 1.5),
          ),
        ),
        _sectionTitle('Lectures (${_audio.length})'),
        if (_audio.isEmpty)
          _emptyNote('No audio lectures yet.', Icons.headphones_outlined)
        else
          ..._audio.map(_buildAudioRow),
      ],
    );
  }

  Widget _buildAudioRow(Map<String, dynamic> lecture) {
    final id = lecture['id']?.toString() ?? '';
    final duration = lecture['duration'];
    final attachments = _rows(lecture['attachments']);

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: DfColors.sand,
                child: Icon(Icons.headphones, color: DfColors.brand),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lecture['title']?.toString() ?? 'Lecture',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      [
                        _when(lecture['created_at']),
                        if (duration is num && duration > 0) _formatDuration(duration.toInt()),
                        if (attachments.isNotEmpty) '${attachments.length} attachments',
                      ].join(' · '),
                      style: const TextStyle(fontSize: 11, color: DfColors.muted),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Play',
                onPressed: () => _openUrl(
                  lecture['stream_url']?.toString() ?? lecture['audio_url']?.toString(),
                ),
                icon: const Icon(Icons.play_arrow_rounded, color: DfColors.brand),
              ),
            ],
          ),
          if ((lecture['description']?.toString() ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              lecture['description'].toString(),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12.5, color: DfColors.ink, height: 1.5),
            ),
          ],
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              _iconAction(Icons.edit_outlined, 'Rename', () => _renameLecture(lecture)),
              _iconAction(Icons.delete_outline, 'Delete', () async {
                if (!await _confirm('Delete lecture', 'The audio file will be removed.')) return;
                await _act(
                  () => ChannelsApi.instance.deleteAudioLecture(widget.channelId, id),
                  success: 'Lecture deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _renameLecture(Map<String, dynamic> lecture) async {
    final titleController = TextEditingController(text: lecture['title']?.toString() ?? '');
    final descController =
        TextEditingController(text: lecture['description']?.toString() ?? '');
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Edit lecture', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    final title = titleController.text.trim();
    final description = descController.text.trim();
    titleController.dispose();
    descController.dispose();

    if (saved != true) return;
    if (title.isEmpty) {
      _toast('Title cannot be empty');
      return;
    }
    await _act(
      () => ChannelsApi.instance.updateAudioLecture(
        widget.channelId,
        lectureId: lecture['id'].toString(),
        title: title,
        description: description,
      ),
      success: 'Lecture updated',
    );
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  // ── Lesson notes ──────────────────────────────────────────────────────────

  Widget _buildNotesTab() {
    return _tabBody(
      children: [
        _primaryAction('Write lesson note', Icons.note_add_outlined,
            () => _openSheet(LessonNoteForm(channelId: widget.channelId))),
        _sectionTitle('Lesson notes (${_notes.length})'),
        if (_notes.isEmpty)
          _emptyNote('No lesson notes yet.', Icons.sticky_note_2_outlined)
        else
          ..._notes.map(_buildNoteRow),
      ],
    );
  }

  Widget _buildNoteRow(Map<String, dynamic> note) {
    final id = note['id']?.toString() ?? '';
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            note['title']?.toString() ?? 'Note',
            style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.w700),
          ),
          Text(
            'Updated ${_when(note['updated_at'] ?? note['created_at'])}',
            style: const TextStyle(fontSize: 11, color: DfColors.muted),
          ),
          const SizedBox(height: 8),
          Text(
            _stripHtml(note['content']?.toString() ?? ''),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12.5, color: DfColors.ink, height: 1.5),
          ),
          const Divider(height: 20),
          Wrap(
            spacing: 4,
            children: [
              _iconAction(Icons.edit_outlined, 'Edit',
                  () => _openSheet(LessonNoteForm(channelId: widget.channelId, note: note))),
              _iconAction(Icons.delete_outline, 'Delete', () async {
                if (!await _confirm('Delete note', 'This lesson note will be removed.')) return;
                await _act(
                  () => ChannelsApi.instance.deleteLessonNote(widget.channelId, id),
                  success: 'Lesson note deleted',
                );
              }, danger: true),
            ],
          ),
        ],
      ),
    );
  }

  // ── Money / subscriptions ─────────────────────────────────────────────────

  Widget _buildMoneyTab() {
    final settings = _subscription;
    final enabled = settings?['is_enabled'] == true;
    final fee = settings?['monthly_fee'];

    return _tabBody(
      children: [
        _card(
          tint: enabled ? DfColors.brand.withValues(alpha: 0.06) : DfColors.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Subscriptions',
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                  _tag(enabled ? 'Enabled' : 'Disabled',
                      enabled ? DfColors.brand : DfColors.muted),
                ],
              ),
              const SizedBox(height: 8),
              if (enabled) ...[
                Text(
                  '${DisplayFormat.money(fee is num ? fee : 0)} per month',
                  style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.w700),
                ),
                if ((settings?['payment_instructions']?.toString() ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    settings!['payment_instructions'].toString(),
                    style: const TextStyle(fontSize: 12.5, color: DfColors.ink, height: 1.5),
                  ),
                ],
                if ((settings?['payment_contact_name']?.toString() ?? '').isNotEmpty ||
                    (settings?['payment_contact_number']?.toString() ?? '').isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Payments to ${settings?['payment_contact_name'] ?? ''} '
                    '${settings?['payment_contact_number'] ?? ''}'.trim(),
                    style: const TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                ],
              ] else
                const Text(
                  'This channel is free to join. Enable subscriptions to charge a '
                  'monthly fee that members pay you directly.',
                  style: TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.5),
                ),
            ],
          ),
        ),
        _primaryAction(
          enabled ? 'Edit subscription settings' : 'Set up subscriptions',
          Icons.payments_outlined,
          () => _openSheet(
            SubscriptionForm(channelId: widget.channelId, settings: settings),
          ),
        ),
        _sectionTitle('Paying members'),
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Approving a join request while subscriptions are on verifies a payment '
                'and activates 30 days of access. Use the Members tab to suspend anyone '
                'who has not paid.',
                style: TextStyle(fontSize: 12.5, color: DfColors.muted, height: 1.5),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _busy ? null : _showSubscriberSummary,
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(46)),
                icon: const Icon(Icons.receipt_long_outlined, size: 18),
                label: const Text('View subscription summary'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _showSubscriberSummary() async {
    setState(() => _busy = true);
    try {
      final data = await ChannelsApi.instance.subscriptionSettings(widget.channelId);
      final summary = _map(data['summary']);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(
            'Subscription summary',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _summaryLine('Active subscribers', '${summary['active'] ?? 0}'),
              _summaryLine('Expired', '${summary['expired'] ?? 0}'),
              _summaryLine('Records on file', '${summary['total'] ?? 0}'),
              _summaryLine(
                'Verified this cycle',
                DisplayFormat.money(
                  summary['monthly_revenue'] is num ? summary['monthly_revenue'] as num : 0,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ],
        ),
      );
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _summaryLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: DfColors.muted)),
          Text(value, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  // ── Small shared pieces ───────────────────────────────────────────────────

  Widget _tag(String label, Color color) {
    return Container(
      margin: const EdgeInsets.only(left: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  Widget _iconAction(IconData icon, String label, VoidCallback onTap, {bool danger = false}) {
    final color = danger ? DfColors.danger : DfColors.brandDark;
    return TextButton.icon(
      onPressed: _busy ? null : onTap,
      icon: Icon(icon, size: 17, color: color),
      label: Text(label, style: TextStyle(fontSize: 12, color: color)),
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        minimumSize: const Size(0, 40),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  /// Post bodies come from the website's rich-text editor; the app has no HTML
  /// renderer, so they are flattened to plain text.
  String _stripHtml(String input) {
    return input
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .trim();
  }
}

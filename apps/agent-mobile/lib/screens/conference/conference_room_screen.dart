import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:livekit_client/livekit_client.dart' as lk;

import '../../services/api_client.dart';
import '../../services/conference_api.dart';
import '../../services/livekit_service.dart';
import '../../services/session_store.dart';
import 'conference_stage.dart';
import 'conference_theme.dart';

enum ConferenceMode { voiceRoom, channelLive }

/// Everything the live room needs, resolved by the caller before navigating.
class ConferenceRoomConfig {
  const ConferenceRoomConfig({
    required this.mode,
    required this.title,
    required this.roomName,
    required this.serverUrl,
    required this.token,
    this.subtitle,
    this.channelId,
    this.sessionId,
    this.canPublish = false,
    this.canPublishVideo = false,
    this.isHost = false,
    this.videoSession = false,
  });

  final ConferenceMode mode;
  final String title;
  final String? subtitle;
  final String roomName;
  final String serverUrl;
  final String token;

  /// Channel live only.
  final String? channelId;
  final String? sessionId;

  final bool canPublish;
  final bool canPublishVideo;
  final bool isHost;
  final bool videoSession;
}

class ConferenceRoomScreen extends StatefulWidget {
  const ConferenceRoomScreen({super.key, required this.config});

  final ConferenceRoomConfig config;

  @override
  State<ConferenceRoomScreen> createState() => _ConferenceRoomScreenState();
}

class _ConferenceRoomScreenState extends State<ConferenceRoomScreen> {
  final _service = LiveKitService();
  final _reactions = <FloatingReaction>[];
  final _chats = <Map<String, dynamic>>[];
  final _chatController = TextEditingController();
  final _chatScrollController = ScrollController();

  StreamSubscription<LiveKitDataMessage>? _dataSub;
  Timer? _chatPoll;
  Timer? _elapsedTimer;

  late bool _canPublish;
  late bool _videoAllowed;
  String? _serverUrl;

  bool _handRaised = false;
  bool _upgrading = false;
  bool _chatOpen = false;
  bool _chatSending = false;
  bool _leaving = false;
  String? _fatalError;
  String? _notice;
  Duration _elapsed = Duration.zero;
  String _agentName = 'Agent';

  @override
  void initState() {
    super.initState();
    _canPublish = widget.config.canPublish;
    _videoAllowed = widget.config.canPublishVideo;
    _serverUrl = widget.config.serverUrl;
    _service.addListener(_onServiceChanged);
    _dataSub = _service.dataMessages.listen(_onDataMessage);
    _loadAgentName();
    _connect(widget.config.token, publishAudio: _canPublish);
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !_service.isConnected) return;
      setState(() => _elapsed += const Duration(seconds: 1));
    });
  }

  @override
  void dispose() {
    _chatPoll?.cancel();
    _elapsedTimer?.cancel();
    _dataSub?.cancel();
    _service.removeListener(_onServiceChanged);
    _service.dispose();
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  void _onServiceChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadAgentName() async {
    final agent = await SessionStore.instance.getAgent();
    final name = agent?['full_name']?.toString();
    if (mounted && name != null && name.isNotEmpty) {
      setState(() => _agentName = name);
    }
  }

  Future<void> _connect(String token, {bool publishAudio = false, bool publishVideo = false}) async {
    try {
      await _service.connect(
        serverUrl: _serverUrl ?? widget.config.serverUrl,
        token: token,
        publishAudio: publishAudio,
        publishVideo: publishVideo,
      );
      if (mounted) setState(() => _fatalError = null);
    } on ApiException catch (e) {
      if (mounted) setState(() => _fatalError = e.message);
    } catch (e) {
      if (mounted) setState(() => _fatalError = e.toString());
    }
  }

  // ── Permission elevation ──────────────────────────────────────────────────

  /// Refetches a token with the requested capabilities. The server only ever
  /// widens permissions by minting a new token, so the room must be fully
  /// reconnected afterwards — mirroring the web client.
  Future<Map<String, dynamic>> _refetchToken({bool speak = false, bool video = false}) {
    if (widget.config.mode == ConferenceMode.channelLive) {
      return ConferenceApi.instance.joinChannelLive(
        channelId: widget.config.channelId!,
        speak: speak,
        video: video,
      );
    }
    return ConferenceApi.instance.voiceRoomToken(
      roomName: widget.config.roomName,
      speak: speak,
      video: video,
    );
  }

  Future<void> _upgradeAndReconnect({
    required bool speak,
    required bool video,
    String? notice,
    bool enableMic = false,
    bool enableCamera = false,
  }) async {
    if (_upgrading) return;
    setState(() {
      _upgrading = true;
      _notice = 'Reconnecting with new permissions…';
    });
    try {
      final data = await _refetchToken(speak: speak, video: video);
      final token = data['token']?.toString();
      if (token == null || token.isEmpty) {
        throw ApiException('Server did not return a join token');
      }
      final url = data['serverUrl']?.toString();
      if (url != null && url.isNotEmpty) _serverUrl = url;

      _canPublish = data['canPublish'] == true || speak;
      _videoAllowed = data['canPublishVideo'] == true;
      _handRaised = false;

      await _connect(token, publishAudio: enableMic, publishVideo: enableCamera && _videoAllowed);
      if (mounted) {
        setState(() => _notice = notice);
        if (notice != null) {
          Future.delayed(const Duration(seconds: 4), () {
            if (mounted && _notice == notice) setState(() => _notice = null);
          });
        }
      }
    } on ApiException catch (e) {
      _toast(e.message);
      if (mounted) setState(() => _notice = null);
    } catch (e) {
      _toast(e.toString());
      if (mounted) setState(() => _notice = null);
    } finally {
      if (mounted) setState(() => _upgrading = false);
    }
  }

  void _onDataMessage(LiveKitDataMessage message) {
    final localIdentity = _service.localIdentity;

    switch (message.topic) {
      case VoiceTopics.unmuteCommand:
      case VoiceTopics.grantSpeak:
        if (localIdentity == null) return;
        if (message.text.contains(localIdentity)) {
          _upgradeAndReconnect(
            speak: true,
            video: false,
            enableMic: true,
            notice: 'You are live — the host unmuted you.',
          );
        }
        break;

      case VoiceTopics.videoPermission:
        final payload = message.json;
        if (payload == null || localIdentity == null) return;
        if (payload['identity']?.toString() != localIdentity) return;
        if (payload['allowed'] == true) {
          _upgradeAndReconnect(
            speak: true,
            video: true,
            enableMic: true,
            notice: 'Camera enabled by the host.',
          );
        } else {
          setState(() => _videoAllowed = false);
          _service.setCameraEnabled(false);
          _toast('Host turned your camera off');
        }
        break;

      case VoiceTopics.demote:
        final payload = message.json;
        if (payload == null || localIdentity == null) return;
        if (payload['identity']?.toString() != localIdentity) return;
        _upgradeAndReconnect(
          speak: false,
          video: false,
          notice: 'You are back to listening only.',
        );
        break;

      case VoiceTopics.reaction:
        final emoji = message.json?['emoji']?.toString() ?? message.text;
        if (emoji.isNotEmpty) _pushReaction(emoji);
        break;

      case VoiceTopics.chat:
        _refreshChats();
        break;

      case VoiceTopics.handRaise:
        final name = message.json?['name']?.toString();
        if (_service.canModerate && name != null && name.isNotEmpty) {
          _toast('$name raised their hand');
        }
        break;
    }
  }

  void _pushReaction(String emoji) {
    final id = '${DateTime.now().microsecondsSinceEpoch}-$emoji';
    setState(() {
      _reactions.add(FloatingReaction(
        id: id,
        emoji: emoji,
        horizontal: -0.8 + 1.6 * (_reactions.length % 5) / 4,
      ));
    });
    Future.delayed(const Duration(milliseconds: 2300), () {
      if (mounted) setState(() => _reactions.removeWhere((r) => r.id == id));
    });
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  Future<void> _toggleMic() async {
    if (!_canPublish) {
      await _raiseHand();
      return;
    }
    final ok = await _service.toggleMicrophone();
    if (!ok && _service.error != null) _showPermissionIssue(_service.error!);
  }

  Future<void> _toggleCamera() async {
    if (!_videoAllowed) {
      _toast('Ask the host for camera permission first');
      return;
    }
    final ok = await _service.toggleCamera();
    if (!ok && _service.error != null) _showPermissionIssue(_service.error!);
  }

  Future<void> _raiseHand() async {
    try {
      await _service.raiseHand();
      setState(() => _handRaised = true);
      _toast('Hand raised — waiting for the host');
    } catch (e) {
      _toast('Could not raise your hand');
    }
  }

  Future<void> _showPermissionIssue(String message) async {
    if (!mounted) return;
    final blocked = message.toLowerCase().contains('blocked');
    if (!blocked) {
      _toast(message);
      return;
    }
    final open = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Permission needed'),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not now')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Open settings'),
          ),
        ],
      ),
    );
    if (open == true) await _service.openPermissionSettings();
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave this room?'),
        content: const Text('You will stop hearing the conversation.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: StageColors.live),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (leave != true || !mounted) return;
    setState(() => _leaving = true);
    await _service.disconnect();
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _endSessionAsHost() async {
    final sessionId = widget.config.sessionId;
    if (sessionId == null) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('End the live session?'),
        content: const Text('Everyone will be disconnected.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: StageColors.live),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('End for all'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ConferenceApi.instance.endChannelLive(sessionId);
    } on ApiException catch (e) {
      _toast(e.message);
    }
    if (!mounted) return;
    await _service.disconnect();
    if (mounted) Navigator.of(context).pop();
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  Future<void> _refreshChats() async {
    try {
      final List<Map<String, dynamic>> loaded;
      if (widget.config.mode == ConferenceMode.channelLive) {
        final sessionId = widget.config.sessionId;
        if (sessionId == null) return;
        loaded = await ConferenceApi.instance.channelLiveMessages(sessionId);
      } else {
        loaded = await ConferenceApi.instance.voiceRoomChats(widget.config.roomName);
      }
      if (!mounted) return;
      setState(() {
        _chats
          ..clear()
          ..addAll(loaded);
      });
      _scrollChatToEnd();
    } catch (_) {
      // Chat is best-effort — never break the live session over it.
    }
  }

  void _scrollChatToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_chatScrollController.hasClients) return;
      _chatScrollController.jumpTo(_chatScrollController.position.maxScrollExtent);
    });
  }

  Future<void> _sendChat() async {
    final text = _chatController.text.trim();
    if (text.isEmpty || _chatSending) return;
    setState(() => _chatSending = true);
    try {
      if (widget.config.mode == ConferenceMode.channelLive) {
        await ConferenceApi.instance.sendChannelLiveMessage(
          sessionId: widget.config.sessionId!,
          message: text,
          senderName: _agentName,
        );
      } else {
        await ConferenceApi.instance.sendVoiceRoomChat(
          roomName: widget.config.roomName,
          message: text,
          senderName: _agentName,
        );
      }
      _chatController.clear();
      await _service.sendTopicMessage(VoiceTopics.chat, text);
      await _refreshChats();
    } on ApiException catch (e) {
      _toast(e.message);
    } finally {
      if (mounted) setState(() => _chatSending = false);
    }
  }

  void _openChat() {
    setState(() => _chatOpen = true);
    _refreshChats();
    _chatPoll?.cancel();
    _chatPoll = Timer.periodic(const Duration(seconds: 6), (_) => _refreshChats());

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: StageColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _ChatSheet(
        chats: _chats,
        controller: _chatController,
        scrollController: _chatScrollController,
        sending: _chatSending,
        onSend: _sendChat,
      ),
    ).whenComplete(() {
      _chatPoll?.cancel();
      if (mounted) setState(() => _chatOpen = false);
    });
  }

  void _openReactions() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: StageColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              for (final emoji in VoiceTopics.reactionEmojis)
                InkWell(
                  borderRadius: BorderRadius.circular(40),
                  onTap: () {
                    Navigator.pop(ctx);
                    _service.sendReaction(emoji);
                    _pushReaction(emoji);
                  },
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: const BoxDecoration(
                      color: StageColors.surfaceHigh,
                      shape: BoxShape.circle,
                    ),
                    child: Center(child: Text(emoji, style: const TextStyle(fontSize: 26))),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _openParticipants() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: StageColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => AnimatedBuilder(
        animation: _service,
        builder: (context, _) => _ParticipantsSheet(
          service: _service,
          canModerate: _canModerateRoom,
          actions: widget.config.mode == ConferenceMode.channelLive
              ? const ['invite', 'mute', 'video']
              : const ['invite', 'mute', 'unmute', 'demote', 'kick'],
          onModerate: (identity, action) async {
            Navigator.pop(ctx);
            await _moderate(identity, action);
          },
        ),
      ),
    );
  }

  bool get _canModerateRoom =>
      widget.config.mode == ConferenceMode.channelLive ? widget.config.isHost : _service.canModerate;

  Future<void> _moderate(String identity, String action) async {
    try {
      if (widget.config.mode == ConferenceMode.channelLive) {
        final sessionId = widget.config.sessionId;
        if (sessionId == null) return;
        switch (action) {
          case 'mute':
            await ConferenceApi.instance
                .muteChannelParticipant(sessionId: sessionId, identity: identity);
            break;
          case 'unmute':
          case 'invite':
            await ConferenceApi.instance
                .unmuteChannelParticipant(sessionId: sessionId, identity: identity);
            break;
          case 'video':
            await ConferenceApi.instance.setChannelVideoPermission(
              sessionId: sessionId,
              identity: identity,
              allowed: true,
            );
            break;
        }
      } else {
        await ConferenceApi.instance.moderateVoiceRoom(
          roomName: widget.config.roomName,
          action: action,
          identity: identity,
        );
      }
      _toast('Done');
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  String get _elapsedLabel {
    final minutes = _elapsed.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = _elapsed.inSeconds.remainder(60).toString().padLeft(2, '0');
    final hours = _elapsed.inHours;
    return hours > 0 ? '$hours:$minutes:$seconds' : '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final state = _service.connectionState;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_leaving) _confirmLeave();
      },
      child: Scaffold(
        backgroundColor: StageColors.backdrop,
        appBar: AppBar(
          backgroundColor: StageColors.surface,
          foregroundColor: StageColors.text,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: _confirmLeave,
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.config.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: StageColors.text,
                ),
              ),
              Text(
                _service.isConnected
                    ? '${_service.participants.length} in room · $_elapsedLabel'
                    : widget.config.subtitle ?? 'Connecting…',
                style: const TextStyle(fontSize: 11.5, color: StageColors.textMuted),
              ),
            ],
          ),
          actions: [
            if (_service.isConnected)
              Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: StageColors.live.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'LIVE',
                  style: TextStyle(
                    color: StageColors.live,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            IconButton(
              tooltip: 'Participants',
              icon: const Icon(Icons.people_alt_rounded),
              onPressed: _service.isConnected ? _openParticipants : null,
            ),
            if (widget.config.isHost && widget.config.sessionId != null)
              IconButton(
                tooltip: 'End for all',
                icon: const Icon(Icons.stop_circle_outlined, color: StageColors.live),
                onPressed: _endSessionAsHost,
              ),
          ],
        ),
        body: Column(
          children: [
            if (state == lk.ConnectionState.reconnecting)
              StageBanner(
                message: _service.reconnectAttempt > 0
                    ? 'Reconnecting… attempt ${_service.reconnectAttempt}'
                    : 'Connection lost — reconnecting…',
                color: const Color(0xFFFFB300),
                showSpinner: true,
              )
            else if (_upgrading || _notice != null)
              StageBanner(
                message: _notice ?? 'Updating permissions…',
                showSpinner: _upgrading,
                icon: Icons.check_circle_outline,
              )
            else if (!_canPublish && _service.isConnected)
              StageBanner(
                message: _handRaised
                    ? 'Hand raised — the host will unmute you'
                    : 'You are listening. Raise your hand to speak.',
                color: StageColors.accentSoft,
                icon: Icons.hearing_rounded,
              ),
            Expanded(child: _buildBody(state)),
            _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(lk.ConnectionState state) {
    if (_fatalError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 42, color: StageColors.textMuted),
              const SizedBox(height: 14),
              Text(
                _fatalError!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: StageColors.text),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () {
                  setState(() => _fatalError = null);
                  _connect(widget.config.token, publishAudio: _canPublish);
                },
                child: const Text('Try again'),
              ),
            ],
          ),
        ),
      );
    }

    if (state == lk.ConnectionState.disconnected && !_service.isConnecting) {
      return const Center(
        child: Text('Disconnected', style: TextStyle(color: StageColors.textMuted)),
      );
    }

    if (!_service.isConnected) {
      return const Center(child: CircularProgressIndicator(color: StageColors.accent));
    }

    return Stack(
      children: [
        ConferenceStage(service: _service),
        ReactionOverlay(reactions: _reactions),
      ],
    );
  }

  Widget _buildControls() {
    final connected = _service.isConnected;
    final micOn = _service.micEnabled;

    return Container(
      decoration: const BoxDecoration(
        color: StageColors.surface,
        border: Border(top: BorderSide(color: StageColors.outline)),
      ),
      padding: const EdgeInsets.only(top: 14, bottom: 10),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: [
              StageControlButton(
                icon: _canPublish
                    ? (micOn ? Icons.mic_rounded : Icons.mic_off_rounded)
                    : Icons.front_hand_rounded,
                label: _canPublish ? (micOn ? 'Mute' : 'Unmute') : 'Raise hand',
                active: _canPublish ? micOn : _handRaised,
                onPressed: connected && !_upgrading ? _toggleMic : null,
                busy: _upgrading,
              ),
              const SizedBox(width: 14),
              StageControlButton(
                icon: _service.cameraEnabled
                    ? Icons.videocam_rounded
                    : Icons.videocam_off_rounded,
                label: 'Camera',
                active: _service.cameraEnabled,
                onPressed: connected && _videoAllowed ? _toggleCamera : null,
              ),
              if (_service.cameraEnabled) ...[
                const SizedBox(width: 14),
                StageControlButton(
                  icon: Icons.cameraswitch_rounded,
                  label: 'Flip',
                  onPressed: connected ? _service.switchCamera : null,
                ),
              ],
              const SizedBox(width: 14),
              StageControlButton(
                icon: _service.speakerOn ? Icons.volume_up_rounded : Icons.hearing_rounded,
                label: _service.speakerOn ? 'Speaker' : 'Earpiece',
                active: _service.speakerOn,
                onPressed: connected ? _service.toggleSpeaker : null,
              ),
              const SizedBox(width: 14),
              StageControlButton(
                icon: Icons.emoji_emotions_rounded,
                label: 'React',
                onPressed: connected ? _openReactions : null,
              ),
              const SizedBox(width: 14),
              StageControlButton(
                icon: Icons.chat_bubble_rounded,
                label: 'Chat',
                active: _chatOpen,
                onPressed: connected ? _openChat : null,
              ),
              const SizedBox(width: 14),
              StageControlButton(
                icon: Icons.call_end_rounded,
                label: 'Leave',
                danger: true,
                onPressed: _confirmLeave,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatSheet extends StatelessWidget {
  const _ChatSheet({
    required this.chats,
    required this.controller,
    required this.scrollController,
    required this.sending,
    required this.onSend,
  });

  final List<Map<String, dynamic>> chats;
  final TextEditingController controller;
  final ScrollController scrollController;
  final bool sending;
  final Future<void> Function() onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Text(
                'Room chat',
                style: TextStyle(
                  color: StageColors.text,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
            const Divider(height: 1, color: StageColors.outline),
            Expanded(
              child: chats.isEmpty
                  ? const Center(
                      child: Text(
                        'No messages yet',
                        style: TextStyle(color: StageColors.textMuted),
                      ),
                    )
                  : ListView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: chats.length,
                      itemBuilder: (context, index) {
                        final chat = chats[index];
                        final sender = chat['sender_name']?.toString() ?? 'Agent';
                        final message = chat['message']?.toString() ?? '';
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                sender,
                                style: const TextStyle(
                                  color: StageColors.accent,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                message,
                                style: const TextStyle(color: StageColors.text, fontSize: 14),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const Divider(height: 1, color: StageColors.outline),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller,
                      style: const TextStyle(color: StageColors.text),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => onSend(),
                      decoration: InputDecoration(
                        hintText: 'Message the room…',
                        hintStyle: const TextStyle(color: StageColors.textMuted),
                        filled: true,
                        fillColor: StageColors.surfaceHigh,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: StageColors.accent),
                    onPressed: sending ? null : () => onSend(),
                    icon: sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send_rounded, color: Color(0xFF04170B)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ParticipantsSheet extends StatelessWidget {
  const _ParticipantsSheet({
    required this.service,
    required this.canModerate,
    required this.actions,
    required this.onModerate,
  });

  final LiveKitService service;
  final bool canModerate;
  final List<String> actions;
  final Future<void> Function(String identity, String action) onModerate;

  static const _actionLabels = {
    'invite': 'Invite to speak',
    'mute': 'Mute',
    'unmute': 'Unmute',
    'video': 'Allow camera',
    'demote': 'Move to listener',
    'kick': 'Remove from room',
  };

  @override
  Widget build(BuildContext context) {
    final participants = service.participants;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Text(
              'In this room (${participants.length})',
              style: const TextStyle(
                color: StageColors.text,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
          ),
          const Divider(height: 1, color: StageColors.outline),
          Expanded(
            child: ListView.builder(
              itemCount: participants.length,
              itemBuilder: (context, index) {
                final participant = participants[index];
                final isLocal = participant.identity == service.localIdentity;
                final muted = participant.audioTrackPublications.isEmpty ||
                    participant.audioTrackPublications.every((p) => p.muted);
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: participant.isSpeaking
                        ? StageColors.accent
                        : StageColors.surfaceHigh,
                    child: Icon(
                      muted ? Icons.mic_off_rounded : Icons.mic_rounded,
                      size: 18,
                      color: participant.isSpeaking
                          ? const Color(0xFF04170B)
                          : StageColors.textMuted,
                    ),
                  ),
                  title: Text(
                    isLocal ? '${service.displayNameOf(participant)} (you)' : service.displayNameOf(participant),
                    style: const TextStyle(color: StageColors.text, fontSize: 14),
                  ),
                  subtitle: Text(
                    service.roleOf(participant),
                    style: const TextStyle(color: StageColors.textMuted, fontSize: 12),
                  ),
                  trailing: !canModerate || isLocal
                      ? null
                      : PopupMenuButton<String>(
                          color: StageColors.surfaceHigh,
                          icon: const Icon(Icons.more_vert_rounded, color: StageColors.textMuted),
                          onSelected: (action) => onModerate(participant.identity, action),
                          itemBuilder: (context) => [
                            for (final action in actions)
                              PopupMenuItem(
                                value: action,
                                child: Text(
                                  _actionLabels[action] ?? action,
                                  style: const TextStyle(color: StageColors.text),
                                ),
                              ),
                          ],
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

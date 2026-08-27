import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/dating_api.dart';
import '../../services/session_store.dart';
import '../../theme/app_theme.dart';
import '../../widgets/authed_network_image.dart';
import 'dating_common.dart';

/// Match conversation with icebreaker prompts, the "ladies first" lock and
/// Silver/Gold read receipts.
class DatingChatScreen extends StatefulWidget {
  const DatingChatScreen({
    super.key,
    required this.matchId,
    required this.displayName,
    required this.otherAgentId,
    required this.photoUrl,
    required this.icebreakers,
  });

  final String matchId;
  final String displayName;
  final String otherAgentId;
  final String photoUrl;
  final List<String> icebreakers;

  @override
  State<DatingChatScreen> createState() => _DatingChatScreenState();
}

class _DatingChatScreenState extends State<DatingChatScreen> {
  final _composer = TextEditingController();
  final _scroll = ScrollController();
  final _time = DateFormat('d MMM, HH:mm');

  List<Map<String, dynamic>> _messages = [];
  Map<String, dynamic>? _match;
  bool _loading = true;
  bool _sending = false;
  bool _readReceipts = false;
  String _myAgentId = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _composer.dispose();
    _scroll.dispose();
    super.dispose();
  }

  bool get _canSend => _match?['can_send_message'] == true;
  bool get _waitingForHer => _match?['waiting_for_her'] == true;

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final agent = await SessionStore.instance.getAgent();
      final res = await DatingApi.instance.messages(widget.matchId);
      if (!mounted) return;
      setState(() {
        _myAgentId = agent?['id']?.toString() ?? '';
        _match = res['match'] is Map ? Map<String, dynamic>.from(res['match'] as Map) : null;
        _messages = asMapList(res['messages']);
        _readReceipts = res['read_receipts_enabled'] == true;
      });
      await _markIncomingRead();
      _jumpToEnd();
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markIncomingRead() async {
    if (!_readReceipts) return;
    final unread = _messages
        .where((m) =>
            m['sender_agent_id']?.toString() != _myAgentId && m['read_at'] == null)
        .map((m) => m['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();
    if (unread.isEmpty) return;
    try {
      await DatingApi.instance.markMessagesRead(
        matchId: widget.matchId,
        messageIds: unread,
      );
    } catch (_) {
      // Read receipts are a plan perk; a failure here must not block the chat.
    }
  }

  void _jumpToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send(String content, {String messageType = 'text'}) async {
    final text = content.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final res = await DatingApi.instance.sendMessage(
        matchId: widget.matchId,
        content: text,
        messageType: messageType,
      );
      if (!mounted) return;
      setState(() {
        if (res['message'] is Map) {
          _messages.add(Map<String, dynamic>.from(res['message'] as Map));
        }
        _composer.clear();
        if (_match != null) _match!['chat_started'] = true;
      });
      _jumpToEnd();
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            AuthedNetworkImage(
              imageUrl: widget.photoUrl,
              height: 36,
              width: 36,
              borderRadius: BorderRadius.circular(18),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(widget.displayName)),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Block or report',
            icon: const Icon(Icons.more_vert),
            onPressed: widget.otherAgentId.isEmpty
                ? null
                : () async {
                    final actioned = await showSafetyActions(
                      context,
                      agentId: widget.otherAgentId,
                      displayName: widget.displayName,
                    );
                    if (!context.mounted) return;
                    if (actioned) Navigator.pop(context);
                  },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : Column(
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                  ),
                Expanded(
                  child: _messages.isEmpty
                      ? _emptyState()
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.all(16),
                          itemCount: _messages.length,
                          itemBuilder: (_, i) => _bubble(_messages[i]),
                        ),
                ),
                if (_canSend && _messages.isEmpty) _icebreakerBar(),
                _composerBar(),
              ],
            ),
    );
  }

  Widget _emptyState() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 40),
        Icon(Icons.forum_outlined, size: 42, color: DfColors.brand.withValues(alpha: 0.6)),
        const SizedBox(height: 14),
        Text(
          _waitingForHer
              ? 'She starts this one'
              : 'Break the ice with ${widget.displayName}',
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        const SizedBox(height: 8),
        Text(
          _waitingForHer
              ? 'This match uses "ladies first" — ${widget.displayName} will send the first message when she is ready. You will be able to reply as soon as she does.'
              : 'A thoughtful opener about something on her profile works far better than "hi".',
          textAlign: TextAlign.center,
          style: const TextStyle(color: DfColors.muted),
        ),
      ],
    );
  }

  Widget _icebreakerBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      color: DfColors.sand,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Icebreakers',
            style: TextStyle(color: DfColors.muted, fontSize: 12, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: widget.icebreakers
                  .map(
                    (prompt) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        label: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 240),
                          child: Text(prompt, overflow: TextOverflow.ellipsis),
                        ),
                        backgroundColor: Colors.white,
                        side: BorderSide(color: DfColors.brand.withValues(alpha: 0.3)),
                        onPressed: _sending
                            ? null
                            : () => _send(prompt, messageType: 'icebreaker'),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _composerBar() {
    if (!_canSend) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        color: Colors.white,
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              const Icon(Icons.lock_clock, color: DfColors.muted, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Ladies first: ${widget.displayName} opens this conversation. You can reply once she has sent her first message.',
                  style: const TextStyle(color: DfColors.muted, fontSize: 12.5),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _composer,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Write a message',
                  contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _sending ? null : () => _send(_composer.text),
              style: IconButton.styleFrom(backgroundColor: DfColors.brand),
              icon: _sending
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bubble(Map<String, dynamic> message) {
    final mine = message['sender_agent_id']?.toString() == _myAgentId;
    final content = message['content']?.toString() ?? '';
    final sentAt = DateTime.tryParse(message['created_at']?.toString() ?? '');
    final isIcebreaker = message['message_type']?.toString() == 'icebreaker';
    final read = message['read_at'] != null;

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: mine ? DfColors.brand : Colors.white,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: mine ? const Radius.circular(4) : null,
            bottomLeft: mine ? null : const Radius.circular(4),
          ),
          border: mine ? null : Border.all(color: DfColors.muted.withValues(alpha: 0.18)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isIcebreaker)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  'Icebreaker',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.4,
                    color: mine ? Colors.white70 : DfColors.muted,
                  ),
                ),
              ),
            Text(
              content,
              style: TextStyle(color: mine ? Colors.white : DfColors.ink, height: 1.35),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  sentAt != null ? _time.format(sentAt.toLocal()) : '',
                  style: TextStyle(
                    fontSize: 10.5,
                    color: mine ? Colors.white70 : DfColors.muted,
                  ),
                ),
                if (mine && _readReceipts) ...[
                  const SizedBox(width: 5),
                  Icon(
                    read ? Icons.done_all : Icons.done,
                    size: 13,
                    color: Colors.white70,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

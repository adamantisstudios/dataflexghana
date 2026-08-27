import 'package:flutter/material.dart';

import '../../services/admin_session.dart';
import '../../services/call_service.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'call_screen.dart';

/// Body-only page (no Scaffold) showing incoming/active agent calls and
/// auto-opening the full-screen call UI when a call rings.
class CallsPage extends StatefulWidget {
  const CallsPage({super.key});

  @override
  State<CallsPage> createState() => _CallsPageState();
}

class _CallsPageState extends State<CallsPage> {
  final _calls = CallService.instance;
  String? _presentedSessionId;

  @override
  void initState() {
    super.initState();
    _calls.addListener(_onCallsChanged);
    _calls.start();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybePresent());
  }

  @override
  void dispose() {
    _calls.removeListener(_onCallsChanged);
    super.dispose();
  }

  void _onCallsChanged() {
    if (!mounted) return;
    setState(() {});
    _maybePresent();
  }

  /// Push the full-screen ringing UI once per session id.
  void _maybePresent() {
    if (!mounted) return;
    final ringing = _calls.ringing;
    if (ringing == null) return;
    if (_presentedSessionId == ringing.id) return;
    _presentedSessionId = ringing.id;
    _open(ringing);
  }

  Future<void> _open(CallSession session) async {
    await CallScreen.open(context, session);
    if (!mounted) return;
    await _calls.refresh();
  }

  @override
  Widget build(BuildContext context) {
    if (!AdminSession.instance.isSignedIn) {
      return const OpsEmpty(
        message: 'Sign in as an admin to receive agent calls.',
        icon: Icons.lock_outline_rounded,
      );
    }

    final ringing = _calls.ringing;
    final active = _calls.active;
    final error = _calls.lastError;

    return RefreshIndicator(
      onRefresh: _calls.refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 28),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SectionHeader(
            title: 'Agent calls',
            subtitle: _calls.isPolling ? 'Listening for incoming calls' : 'Not listening',
            trailing: _LiveDot(on: _calls.isPolling && error == null),
          ),
          if (error != null)
            OpsError(
              message: _calls.isUnauthorized
                  ? 'Your admin session has expired. Sign in again to receive calls.'
                  : error,
              onRetry: _calls.refresh,
            ),
          if (ringing != null)
            _CallCard(
              session: ringing,
              accent: OpsColors.warning,
              caption: 'Ringing now',
              actionLabel: 'Answer',
              onAction: () => _open(ringing),
            ),
          if (active != null)
            _CallCard(
              session: active,
              accent: OpsColors.success,
              caption: 'Call in progress',
              actionLabel: 'Open',
              onAction: () => _open(active),
            ),
          if (ringing == null && active == null) ...[
            const SizedBox(height: 24),
            const OpsEmpty(
              message: 'No incoming calls right now.',
              icon: Icons.phone_in_talk_outlined,
            ),
            const _SupportAdminNote(),
          ],
        ],
      ),
    );
  }
}

class _CallCard extends StatelessWidget {
  const _CallCard({
    required this.session,
    required this.accent,
    required this.caption,
    required this.actionLabel,
    required this.onAction,
  });

  final CallSession session;
  final Color accent;
  final String caption;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: OpsColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: accent.withValues(alpha: 0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: accent.withValues(alpha: 0.18),
                  child: Icon(Icons.person_rounded, color: accent),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.displayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        caption,
                        style: TextStyle(color: accent, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                StatusChip(status: session.status),
              ],
            ),
            const SizedBox(height: 12),
            if (session.callerPhone.isNotEmpty)
              DetailRow(label: 'Phone', value: session.callerPhone),
            DetailRow(label: 'Started', value: formatDateTime(session.createdAt)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: accent,
                  foregroundColor: const Color(0xFF06121F),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                onPressed: onAction,
                icon: const Icon(Icons.call_rounded),
                label: Text(actionLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SupportAdminNote extends StatelessWidget {
  const _SupportAdminNote();

  @override
  Widget build(BuildContext context) {
    final name = AdminSession.instance.admin?.displayName ?? 'this admin';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: Text(
        'Agent calls ring for a single support admin (set by CALL_SUPPORT_ADMIN_ID, '
        'otherwise the oldest active admin). If calls never appear here, $name is '
        'probably not the designated receiver.',
        textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.white38, fontSize: 12.5, height: 1.45),
      ),
    );
  }
}

class _LiveDot extends StatelessWidget {
  const _LiveDot({required this.on});

  final bool on;

  @override
  Widget build(BuildContext context) {
    final color = on ? OpsColors.success : OpsColors.danger;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          on ? 'Live' : 'Paused',
          style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

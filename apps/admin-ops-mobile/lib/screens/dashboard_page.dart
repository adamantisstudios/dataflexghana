import 'package:flutter/material.dart';

import '../services/admin_session.dart';
import '../services/sms_parser.dart';
import '../services/sms_pipeline.dart';
import '../theme.dart';
import '../widgets/inbox_tile.dart';
import '../widgets/ops_widgets.dart';
import 'admin_login_page.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.smsStatus,
    required this.inbox,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAck,
    required this.ringingCalls,
    required this.onOpenSection,
  });

  final String smsStatus;
  final List<Map<String, dynamic>> inbox;
  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String id) onAck;
  final int ringingCalls;

  /// Jump the shell to a named section (see `OpsSection` in main.dart).
  final void Function(String section) onOpenSection;

  @override
  Widget build(BuildContext context) {
    final sticky =
        inbox.where((e) => e['requires_ack'] == true && e['acked_at'] == null).toList();
    final admin = AdminSession.instance.admin;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'DataFlex Ops',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            admin == null
                ? 'Payment SIM · MoMo capture · Admin alerts'
                : 'Signed in as ${admin.displayName}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 20),

          if (ringingCalls > 0) ...[
            _RingingBanner(count: ringingCalls, onOpen: () => onOpenSection('calls')),
            const SizedBox(height: 14),
          ],

          _StatusCard(smsStatus: smsStatus, stickyCount: sticky.length),
          const SizedBox(height: 16),

          if (admin == null) ...[
            Card(
              color: OpsColors.brand.withValues(alpha: 0.12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lock_outline, color: OpsColors.brand, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Admin tools locked',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Sign in with your admin account to use storefront, orders, wallet, '
                      'agent notifications and agent calls.',
                      style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const AdminLoginPage()),
                      ),
                      icon: const Icon(Icons.login, size: 18),
                      label: const Text('Sign in as admin'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ] else ...[
            const SectionHeader(title: 'Quick actions'),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.95,
              children: [
                _QuickAction(
                  icon: Icons.storefront_outlined,
                  label: 'Storefront',
                  onTap: () => onOpenSection('storefront'),
                ),
                _QuickAction(
                  icon: Icons.receipt_long_outlined,
                  label: 'Orders',
                  onTap: () => onOpenSection('orders'),
                ),
                _QuickAction(
                  icon: Icons.sim_card_download_outlined,
                  label: 'Bundle log',
                  onTap: () => onOpenSection('bundle_orders'),
                ),
                _QuickAction(
                  icon: Icons.account_balance_wallet_outlined,
                  label: 'Wallet',
                  onTap: () => onOpenSection('wallet'),
                ),
                _QuickAction(
                  icon: Icons.campaign_outlined,
                  label: 'Notify agents',
                  onTap: () => onOpenSection('agent_notifications'),
                ),
                _QuickAction(
                  icon: Icons.phone_in_talk_outlined,
                  label: 'Calls',
                  badge: ringingCalls,
                  onTap: () => onOpenSection('calls'),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],

          if (error != null) ...[
            OpsError(message: error!, onRetry: onRefresh),
            const SizedBox(height: 8),
          ],

          const SectionHeader(title: 'Needs attention'),
          if (loading && sticky.isEmpty) const LinearProgressIndicator(),
          if (sticky.isEmpty && !loading)
            const OpsEmpty(
              message: 'All clear — no sticky alerts.',
              icon: Icons.check_circle_outline,
            ),
          ...sticky.take(8).map((item) => InboxTile(item: item, onAck: onAck)),

          const SizedBox(height: 24),
          FilledButton.tonalIcon(
            onPressed: () => _testParser(context),
            icon: const Icon(Icons.science_outlined),
            label: const Text('Test sample SMS parser'),
          ),
        ],
      ),
    );
  }

  Future<void> _testParser(BuildContext context) async {
    const sample =
        'Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR Current Balance: GHS 131.47 . '
        'Available Balance: GHS 131.47. Reference: 71788. Transaction ID: 84157189921. '
        'TRANSACTION FEE: 0.00';
    final parsed = parseMomoPaymentSms(sample);
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Parser test'),
        content: Text(
          'Amount: ${parsed.amount}\n'
          'Reference: ${parsed.reference}\n'
          'TXN: ${parsed.transactionId}\n'
          'Payer: ${parsed.payerName}',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await SmsPipeline.instance.processRawSms(sample);
            },
            child: const Text('Send to API'),
          ),
        ],
      ),
    );
  }
}

class _RingingBanner extends StatelessWidget {
  const _RingingBanner({required this.count, required this.onOpen});

  final int count;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: OpsColors.danger.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: OpsColors.danger),
          ),
          child: Row(
            children: [
              const Icon(Icons.ring_volume, color: OpsColors.danger),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  count == 1
                      ? 'An agent is calling you now'
                      : '$count agents are calling you now',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white54),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge = 0,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: OpsColors.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: OpsColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Badge(
                isLabelVisible: badge > 0,
                label: Text('$badge'),
                child: Icon(icon, color: OpsColors.brand, size: 26),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.smsStatus, required this.stickyCount});

  final String smsStatus;
  final int stickyCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF134E4A), OpsColors.cardAlt],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: Colors.tealAccent.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cell_tower, color: Colors.tealAccent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  smsStatus,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            stickyCount == 0
                ? 'No pestering alerts active'
                : '$stickyCount sticky alert(s) — will keep reminding until Attend',
            style: TextStyle(
              color: stickyCount == 0 ? Colors.white60 : OpsColors.warning,
              fontWeight: stickyCount == 0 ? FontWeight.w400 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import 'screens/calls/calls_page.dart';
import 'screens/dashboard_page.dart';
import 'screens/inbox_page.dart';
import 'screens/notifications/agent_notifications_page.dart';
import 'screens/orders/bundle_orders_page.dart';
import 'screens/orders/orders_page.dart';
import 'screens/settings_page.dart';
import 'screens/sms_log_page.dart';
import 'screens/storefront/storefront_page.dart';
import 'screens/wallet/wallet_page.dart';
import 'services/admin_session.dart';
import 'services/api_client.dart';
import 'services/call_service.dart';
import 'services/settings_store.dart';
import 'services/sms_pipeline.dart';
import 'services/sticky_alerts.dart';
import 'theme.dart';
import 'widgets/admin_gate.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SettingsStore.instance.loadVibrationPrefs();
  await StickyAlertService.instance.init();
  await AdminSession.instance.restore();
  runApp(const DataFlexOpsApp());
}

class DataFlexOpsApp extends StatelessWidget {
  const DataFlexOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DataFlex Ops',
      debugShowCheckedModeBanner: false,
      theme: buildOpsTheme(),
      home: const ShellScreen(),
    );
  }
}

/// Sections reachable from the shell. Primary ones sit in the bottom bar; the
/// rest are opened from "More" or the dashboard's quick actions.
enum OpsSection {
  home('home', 'Home', Icons.dashboard_outlined),
  calls('calls', 'Calls', Icons.phone_in_talk_outlined),
  orders('orders', 'Orders', Icons.receipt_long_outlined),
  wallet('wallet', 'Wallet', Icons.account_balance_wallet_outlined),
  more('more', 'More', Icons.grid_view_outlined),
  storefront('storefront', 'Storefront', Icons.storefront_outlined),
  bundleOrders('bundle_orders', 'Data bundle orders', Icons.sim_card_download_outlined),
  agentNotifications('agent_notifications', 'Agent notifications', Icons.campaign_outlined),
  inbox('inbox', 'Admin inbox', Icons.notifications_active_outlined),
  smsLog('sms_log', 'SMS log', Icons.sms_outlined),
  settings('settings', 'Settings', Icons.settings_outlined);

  const OpsSection(this.key, this.label, this.icon);

  final String key;
  final String label;
  final IconData icon;

  static OpsSection fromKey(String key) =>
      OpsSection.values.firstWhere((s) => s.key == key, orElse: () => OpsSection.home);

  bool get isPrimary => index <= OpsSection.more.index;
  bool get needsAdmin => const {
        OpsSection.calls,
        OpsSection.orders,
        OpsSection.wallet,
        OpsSection.storefront,
        OpsSection.bundleOrders,
        OpsSection.agentNotifications,
      }.contains(this);
}

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  OpsSection _section = OpsSection.home;
  String _smsStatus = 'Starting…';
  Timer? _pollTimer;
  List<Map<String, dynamic>> _inbox = [];
  String? _inboxError;
  bool _loadingInbox = false;

  @override
  void initState() {
    super.initState();
    SmsPipeline.instance.onStatus = (s) {
      if (mounted) setState(() => _smsStatus = s);
    };
    SmsPipeline.instance.onLogChanged = () {
      if (mounted) setState(() {});
    };
    AdminSession.instance.addListener(_onSessionChanged);
    CallService.instance.addListener(_onCallsChanged);
    _bootstrap();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    AdminSession.instance.removeListener(_onSessionChanged);
    CallService.instance.removeListener(_onCallsChanged);
    CallService.instance.stop();
    super.dispose();
  }

  void _onCallsChanged() {
    if (mounted) setState(() {});
  }

  void _onSessionChanged() {
    if (!mounted) return;
    if (AdminSession.instance.isSignedIn) {
      CallService.instance.start();
    } else {
      CallService.instance.stop();
    }
    setState(() {});
  }

  Future<void> _bootstrap() async {
    await Permission.sms.request();
    await Permission.notification.request();
    await SmsPipeline.instance.init();
    await _refreshInbox();
    if (AdminSession.instance.isSignedIn) CallService.instance.start();
    _pollTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      _refreshInbox();
      SmsPipeline.instance.flushQueue();
    });
  }

  Future<void> _refreshInbox() async {
    if (!await SettingsStore.instance.isConfigured()) return;
    if (!mounted) return;
    setState(() {
      _loadingInbox = true;
      _inboxError = null;
    });
    try {
      final items = await OpsApiClient.instance.fetchInbox(limit: 150);
      if (!mounted) return;
      // Alerts the operator explicitly cleared stay cleared even though the
      // server still reports them as unacked.
      final visible = items
          .where((e) => !StickyAlertService.instance.isDismissed('${e['id']}'))
          .toList();
      setState(() {
        _inbox = visible;
        _loadingInbox = false;
      });
      for (final item in visible) {
        final requiresAck = item['requires_ack'] == true;
        final acked = item['acked_at'] != null;
        if (requiresAck && !acked) {
          await StickyAlertService.instance.showSticky(
            id: item['id'] as String,
            title: item['title'] as String? ?? 'Ops alert',
            body: item['body'] as String? ?? '',
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _inboxError = e.toString();
        _loadingInbox = false;
      });
    }
  }

  Future<void> _ack(String id) async {
    try {
      await OpsApiClient.instance.ackInbox(id);
      await StickyAlertService.instance.clearSticky(id);
      await _refreshInbox();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Acknowledged — sticky alert cleared')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ack failed: $e')),
      );
    }
  }

  Future<void> _clearAllNotifications() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all notifications?'),
        content: const Text(
          'Removes every alert and notification on this phone, including sticky ones you '
          'have not attended. Nothing is deleted on the server.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: OpsColors.danger),
            child: const Text('Clear all'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await StickyAlertService.instance.clearAll();
    if (!mounted) return;
    setState(() => _inbox = []);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All notifications and alerts cleared')),
    );
  }

  void _openSection(String key) {
    setState(() => _section = OpsSection.fromKey(key));
  }

  int get _unacked =>
      _inbox.where((e) => e['requires_ack'] == true && e['acked_at'] == null).length;

  Widget _bodyFor(OpsSection section) {
    switch (section) {
      case OpsSection.home:
        return DashboardPage(
          smsStatus: _smsStatus,
          inbox: _inbox,
          loading: _loadingInbox,
          error: _inboxError,
          onRefresh: _refreshInbox,
          onAck: _ack,
          ringingCalls: CallService.instance.ringingCount,
          onOpenSection: _openSection,
        );
      case OpsSection.calls:
        return const AdminGate(title: 'Agent calls', builder: _buildCalls);
      case OpsSection.orders:
        return const AdminGate(title: 'Orders', builder: _buildOrders);
      case OpsSection.wallet:
        return const AdminGate(title: 'Wallet', builder: _buildWallet);
      case OpsSection.storefront:
        return const AdminGate(title: 'Storefront management', builder: _buildStorefront);
      case OpsSection.bundleOrders:
        return const AdminGate(title: 'Data bundle orders', builder: _buildBundleOrders);
      case OpsSection.agentNotifications:
        return const AdminGate(title: 'Agent notifications', builder: _buildAgentNotifications);
      case OpsSection.inbox:
        return InboxPage(
          inbox: _inbox,
          loading: _loadingInbox,
          error: _inboxError,
          onRefresh: _refreshInbox,
          onAck: _ack,
          onClearAll: _clearAllNotifications,
        );
      case OpsSection.smsLog:
        return SmsLogPage(logs: SmsPipeline.instance.logs);
      case OpsSection.settings:
        return SettingsPage(
          onNotificationsCleared: () {
            if (mounted) setState(() => _inbox = []);
          },
        );
      case OpsSection.more:
        return _MorePage(
          unacked: _unacked,
          ringing: CallService.instance.ringingCount,
          onOpen: _openSection,
        );
    }
  }

  // Torn off as top-level builders so the AdminGate instances stay const.
  static Widget _buildCalls(BuildContext _) => const CallsPage();
  static Widget _buildOrders(BuildContext _) => const OrdersPage();
  static Widget _buildWallet(BuildContext _) => const WalletPage();
  static Widget _buildStorefront(BuildContext _) => const StorefrontPage();
  static Widget _buildBundleOrders(BuildContext _) => const BundleOrdersPage();
  static Widget _buildAgentNotifications(BuildContext _) => const AgentNotificationsPage();

  @override
  Widget build(BuildContext context) {
    final isSecondary = !_section.isPrimary;
    final ringing = CallService.instance.ringingCount;

    return Scaffold(
      appBar: isSecondary
          ? AppBar(
              title: Text(_section.label),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _section = OpsSection.more),
              ),
            )
          : null,
      body: SafeArea(child: _bodyFor(_section)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _section.isPrimary ? _section.index : OpsSection.more.index,
        onDestinationSelected: (i) =>
            setState(() => _section = OpsSection.values[i]),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: ringing > 0,
              label: Text('$ringing'),
              child: const Icon(Icons.phone_in_talk_outlined),
            ),
            selectedIcon: const Icon(Icons.phone_in_talk),
            label: 'Calls',
          ),
          const NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          const NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Wallet',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _unacked > 0,
              label: Text('$_unacked'),
              child: const Icon(Icons.grid_view_outlined),
            ),
            selectedIcon: const Icon(Icons.grid_view),
            label: 'More',
          ),
        ],
      ),
    );
  }
}

class _MorePage extends StatelessWidget {
  const _MorePage({
    required this.unacked,
    required this.ringing,
    required this.onOpen,
  });

  final int unacked;
  final int ringing;
  final void Function(String key) onOpen;

  @override
  Widget build(BuildContext context) {
    final admin = AdminSession.instance.admin;
    final entries = <OpsSection>[
      OpsSection.storefront,
      OpsSection.bundleOrders,
      OpsSection.agentNotifications,
      OpsSection.inbox,
      OpsSection.smsLog,
      OpsSection.settings,
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('More', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          admin == null ? 'Ops device mode' : 'Admin: ${admin.displayName}',
          style: const TextStyle(color: Colors.white54, fontSize: 13),
        ),
        const SizedBox(height: 18),
        ...entries.map((s) {
          final badge = switch (s) {
            OpsSection.inbox => unacked,
            OpsSection.calls => ringing,
            _ => 0,
          };
          final locked = s.needsAdmin && admin == null;
          return Card(
            child: ListTile(
              leading: Badge(
                isLabelVisible: badge > 0,
                label: Text('$badge'),
                child: Icon(s.icon, color: locked ? Colors.white24 : OpsColors.brand),
              ),
              title: Text(s.label),
              subtitle: locked
                  ? const Text('Admin sign-in required', style: TextStyle(fontSize: 12))
                  : null,
              trailing: const Icon(Icons.chevron_right, color: Colors.white38),
              onTap: () => onOpen(s.key),
            ),
          );
        }),
      ],
    );
  }
}

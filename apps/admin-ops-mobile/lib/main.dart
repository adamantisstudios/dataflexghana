import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

import 'services/api_client.dart';
import 'services/settings_store.dart';
import 'services/sms_parser.dart';
import 'services/sms_pipeline.dart';
import 'services/sticky_alerts.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StickyAlertService.instance.init();
  runApp(const DataFlexOpsApp());
}

class DataFlexOpsApp extends StatelessWidget {
  const DataFlexOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DataFlex Ops',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0B1220),
        fontFamily: 'Roboto',
      ),
      home: const ShellScreen(),
    );
  }
}

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;
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
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await Permission.sms.request();
    await Permission.notification.request();
    await SmsPipeline.instance.init();
    await _refreshInbox();
    _pollTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      _refreshInbox();
      SmsPipeline.instance.flushQueue();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshInbox() async {
    if (!await SettingsStore.instance.isConfigured()) return;
    setState(() {
      _loadingInbox = true;
      _inboxError = null;
    });
    try {
      final items = await OpsApiClient.instance.fetchInbox(limit: 150);
      if (!mounted) return;
      setState(() {
        _inbox = items;
        _loadingInbox = false;
      });
      for (final item in items) {
        final requiresAck = item['requires_ack'] == true;
        final acked = item['acked_at'] != null;
        if (requiresAck && !acked) {
          final id = item['id'] as String;
          final title = item['title'] as String? ?? 'Ops alert';
          final body = item['body'] as String? ?? '';
          await StickyAlertService.instance.showSticky(id: id, title: title, body: body);
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Acknowledged — sticky alert cleared')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ack failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardPage(
        smsStatus: _smsStatus,
        inbox: _inbox,
        loading: _loadingInbox,
        error: _inboxError,
        onRefresh: _refreshInbox,
        onAck: _ack,
      ),
      InboxPage(
        inbox: _inbox,
        loading: _loadingInbox,
        error: _inboxError,
        onRefresh: _refreshInbox,
        onAck: _ack,
      ),
      SmsLogPage(logs: SmsPipeline.instance.logs),
      const SettingsPage(),
    ];

    return Scaffold(
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Home'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _inbox.any((e) => e['requires_ack'] == true && e['acked_at'] == null),
              label: Text(
                '${_inbox.where((e) => e['requires_ack'] == true && e['acked_at'] == null).length}',
              ),
              child: const Icon(Icons.notifications_active_outlined),
            ),
            label: 'Inbox',
          ),
          const NavigationDestination(icon: Icon(Icons.sms_outlined), label: 'SMS'),
          const NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.smsStatus,
    required this.inbox,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAck,
  });

  final String smsStatus;
  final List<Map<String, dynamic>> inbox;
  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String id) onAck;

  @override
  Widget build(BuildContext context) {
    final sticky = inbox.where((e) => e['requires_ack'] == true && e['acked_at'] == null).toList();
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
            'Payment SIM · MoMo capture · Admin alerts',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 20),
          _StatusCard(smsStatus: smsStatus, stickyCount: sticky.length),
          const SizedBox(height: 16),
          if (error != null)
            Card(
              color: Colors.red.shade900.withValues(alpha: 0.4),
              child: ListTile(
                leading: const Icon(Icons.error_outline),
                title: Text(error!),
              ),
            ),
          Text('Needs attention', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (loading && sticky.isEmpty) const LinearProgressIndicator(),
          if (sticky.isEmpty && !loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('All clear — no sticky alerts.', style: TextStyle(color: Colors.white54)),
            ),
          ...sticky.take(8).map((item) => InboxTile(item: item, onAck: onAck)),
          const SizedBox(height: 24),
          FilledButton.tonalIcon(
            onPressed: () async {
              const sample =
                  'Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR Current Balance: GHS 131.47 . Available Balance: GHS 131.47. Reference: 71788. Transaction ID: 84157189921. TRANSACTION FEE: 0.00';
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
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Close'),
                    ),
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
            },
            icon: const Icon(Icons.science_outlined),
            label: const Text('Test sample SMS parser'),
          ),
        ],
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
          colors: [Color(0xFF134E4A), Color(0xFF0F172A)],
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
              Expanded(child: Text(smsStatus, style: const TextStyle(fontWeight: FontWeight.w600))),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            stickyCount == 0
                ? 'No pestering alerts active'
                : '$stickyCount sticky alert(s) — will keep buzzing until Attend',
            style: TextStyle(
              color: stickyCount == 0 ? Colors.white60 : Colors.amberAccent,
              fontWeight: stickyCount == 0 ? FontWeight.w400 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class InboxPage extends StatelessWidget {
  const InboxPage({
    super.key,
    required this.inbox,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAck,
  });

  final List<Map<String, dynamic>> inbox;
  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String id) onAck;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Admin inbox', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(
            'Mirrors dashboard alerts. Sticky items require Attend.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60),
          ),
          const SizedBox(height: 12),
          if (loading) const LinearProgressIndicator(),
          if (error != null) Text(error!, style: const TextStyle(color: Colors.redAccent)),
          if (inbox.isEmpty && !loading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Text('Inbox empty', textAlign: TextAlign.center),
            ),
          ...inbox.map((item) => InboxTile(item: item, onAck: onAck)),
        ],
      ),
    );
  }
}

class InboxTile extends StatelessWidget {
  const InboxTile({super.key, required this.item, required this.onAck});
  final Map<String, dynamic> item;
  final Future<void> Function(String id) onAck;

  Color _sevColor(String? s) {
    switch (s) {
      case 'critical':
        return Colors.redAccent;
      case 'warning':
        return Colors.amber;
      default:
        return Colors.tealAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final id = item['id'] as String;
    final title = item['title'] as String? ?? 'Alert';
    final body = item['body'] as String? ?? '';
    final category = item['category'] as String? ?? '';
    final severity = item['severity'] as String? ?? 'info';
    final requiresAck = item['requires_ack'] == true;
    final acked = item['acked_at'] != null;
    final created = item['created_at'] != null
        ? DateTime.tryParse(item['created_at'] as String)?.toLocal()
        : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: requiresAck && !acked
          ? Colors.red.shade900.withValues(alpha: 0.35)
          : const Color(0xFF111827),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: _sevColor(severity), shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
                Text(category, style: const TextStyle(fontSize: 11, color: Colors.white54)),
              ],
            ),
            if (body.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(body, style: const TextStyle(color: Colors.white70, height: 1.35)),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                if (created != null)
                  Text(
                    DateFormat('dd MMM HH:mm').format(created),
                    style: const TextStyle(fontSize: 11, color: Colors.white38),
                  ),
                const Spacer(),
                if (requiresAck && !acked)
                  FilledButton(
                    onPressed: () => onAck(id),
                    style: FilledButton.styleFrom(backgroundColor: Colors.amber.shade700),
                    child: const Text('Attend'),
                  )
                else if (acked)
                  const Text('Attended', style: TextStyle(color: Colors.tealAccent, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class SmsLogPage extends StatelessWidget {
  const SmsLogPage({super.key, required this.logs});
  final List logs;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('SMS log', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        if (logs.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Text('No MoMo SMS processed yet', textAlign: TextAlign.center),
          ),
        ...logs.map((e) {
          return Card(
            child: ListTile(
              title: Text(e.matchStatus ?? 'unknown', style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(
                '${e.message ?? ""}\n${e.raw.length > 120 ? "${e.raw.substring(0, 120)}…" : e.raw}',
              ),
              isThreeLine: true,
              trailing: Icon(
                e.success ? Icons.check_circle : Icons.error_outline,
                color: e.success ? Colors.tealAccent : Colors.redAccent,
              ),
            ),
          );
        }),
      ],
    );
  }
}

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _urlCtrl = TextEditingController();
  final _keyCtrl = TextEditingController();
  final _momoCtrl = TextEditingController();
  bool _obscure = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    _urlCtrl.text = await SettingsStore.instance.getBaseUrl();
    _keyCtrl.text = await SettingsStore.instance.getApiKey() ?? '';
    _momoCtrl.text = await SettingsStore.instance.getMomoNumber();
    setState(() {});
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await SettingsStore.instance.setBaseUrl(_urlCtrl.text);
    await SettingsStore.instance.setApiKey(_keyCtrl.text);
    await SettingsStore.instance.setMomoNumber(_momoCtrl.text);
    await SmsPipeline.instance.init();
    setState(() => _saving = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved — SMS listener restarted')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Settings', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        TextField(
          controller: _urlCtrl,
          decoration: const InputDecoration(
            labelText: 'API base URL',
            hintText: 'https://www.dataflexghana.com',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _keyCtrl,
          obscureText: _obscure,
          decoration: InputDecoration(
            labelText: 'Ops API key (ops_…)',
            border: const OutlineInputBorder(),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _momoCtrl,
          decoration: const InputDecoration(
            labelText: 'Expected MoMo number',
            hintText: '0557943392',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Create a device key via POST /api/admin/ops/devices (admin session). '
          'Paste the plaintext key here once. Sideload this APK on the payment SIM phone.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white54),
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            await Clipboard.setData(ClipboardData(text: _urlCtrl.text));
          },
          icon: const Icon(Icons.copy),
          label: const Text('Copy base URL'),
        ),
      ],
    );
  }
}

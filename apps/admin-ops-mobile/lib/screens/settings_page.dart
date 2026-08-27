import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:vibration/vibration.dart';

import '../services/admin_session.dart';
import '../services/settings_store.dart';
import '../services/sms_pipeline.dart';
import '../services/sticky_alerts.dart';
import '../theme.dart';
import 'admin_login_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key, this.onNotificationsCleared});

  /// Lets the shell drop its cached inbox so cleared alerts vanish immediately.
  final VoidCallback? onNotificationsCleared;

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _urlCtrl = TextEditingController();
  final _keyCtrl = TextEditingController();
  final _momoCtrl = TextEditingController();
  bool _obscure = true;
  bool _saving = false;
  bool _vibration = true;
  bool _pesterVibration = true;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    AdminSession.instance.addListener(_onSession);
    _load();
  }

  @override
  void dispose() {
    AdminSession.instance.removeListener(_onSession);
    _urlCtrl.dispose();
    _keyCtrl.dispose();
    _momoCtrl.dispose();
    super.dispose();
  }

  void _onSession() {
    if (mounted) setState(() {});
  }

  Future<void> _load() async {
    final url = await SettingsStore.instance.getBaseUrl();
    final key = await SettingsStore.instance.getApiKey() ?? '';
    final momo = await SettingsStore.instance.getMomoNumber();
    final vib = await SettingsStore.instance.getVibrationEnabled();
    final pester = await SettingsStore.instance.getPesterVibrationEnabled();
    if (!mounted) return;
    setState(() {
      _urlCtrl.text = url;
      _keyCtrl.text = key;
      _momoCtrl.text = momo;
      _vibration = vib;
      _pesterVibration = pester;
      _loaded = true;
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await SettingsStore.instance.setBaseUrl(_urlCtrl.text);
    await SettingsStore.instance.setApiKey(_keyCtrl.text);
    await SettingsStore.instance.setMomoNumber(_momoCtrl.text);
    await SmsPipeline.instance.init();
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Saved — SMS listener restarted')),
    );
  }

  Future<void> _setVibration(bool value) async {
    await SettingsStore.instance.setVibrationEnabled(value);
    if (!mounted) return;
    setState(() => _vibration = value);
    if (value && (await Vibration.hasVibrator())) {
      await Vibration.vibrate(duration: 300, amplitude: 200);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          value
              ? 'Vibration on'
              : 'Vibration off — alerts will still show and play sound',
        ),
      ),
    );
  }

  Future<void> _setPester(bool value) async {
    await SettingsStore.instance.setPesterVibrationEnabled(value);
    if (!mounted) return;
    setState(() => _pesterVibration = value);
  }

  Future<void> _clearAllNotifications() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all notifications?'),
        content: const Text(
          'This removes every alert and notification currently showing on this phone, '
          'including sticky ones you have not attended yet.\n\n'
          'This only clears them on this device — nothing is deleted on the server, and '
          'unattended items stay unattended in the admin records.',
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
    widget.onNotificationsCleared?.call();
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All notifications and alerts cleared')),
    );
  }

  Future<void> _restoreDismissed() async {
    await StickyAlertService.instance.forgetDismissed();
    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cleared alerts can appear again on the next refresh')),
    );
  }

  Future<void> _signOutAdmin() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out of admin?'),
        content: const Text(
          'Storefront, orders, wallet, notifications and calls will stop working until '
          'you sign in again. MoMo SMS capture keeps running.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: OpsColors.danger),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await AdminSession.instance.signOut();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Signed out of admin')),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) return const Center(child: CircularProgressIndicator());

    final admin = AdminSession.instance.admin;
    final dismissed = StickyAlertService.instance.dismissedCount;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Settings', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),

        _SettingsSection(
          title: 'Admin account',
          icon: Icons.admin_panel_settings_outlined,
          children: [
            if (admin != null) ...[
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: OpsColors.brand.withValues(alpha: 0.2),
                  child: const Icon(Icons.person_outline, color: OpsColors.brand),
                ),
                title: Text(admin.displayName),
                subtitle: Text(admin.email, style: const TextStyle(fontSize: 12)),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _signOutAdmin,
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Sign out of admin'),
                style: OutlinedButton.styleFrom(foregroundColor: OpsColors.danger),
              ),
            ] else ...[
              const Text(
                'Not signed in. Storefront, orders, wallet, notifications and calls need '
                'your admin account.',
                style: TextStyle(color: Colors.white60, fontSize: 13, height: 1.4),
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
          ],
        ),

        _SettingsSection(
          title: 'Alerts & vibration',
          icon: Icons.notifications_active_outlined,
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _vibration,
              onChanged: _setVibration,
              title: const Text('Vibrate for alerts'),
              subtitle: const Text(
                'Turn off to stop all buzzing. Alerts still appear and play sound.',
                style: TextStyle(fontSize: 12),
              ),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _pesterVibration && _vibration,
              onChanged: _vibration ? _setPester : null,
              title: const Text('Keep buzzing until attended'),
              subtitle: const Text(
                'The repeating reminder every 25s for unattended alerts.',
                style: TextStyle(fontSize: 12),
              ),
            ),
            const Divider(height: 24),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.clear_all, color: OpsColors.danger),
              title: const Text('Clear all notifications'),
              subtitle: const Text(
                'Wipe every alert and notification on this phone.',
                style: TextStyle(fontSize: 12),
              ),
              onTap: _clearAllNotifications,
            ),
            if (dismissed > 0)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.restore, color: Colors.white54),
                title: Text('Restore $dismissed cleared alert(s)'),
                subtitle: const Text(
                  'Let previously cleared alerts show up again.',
                  style: TextStyle(fontSize: 12),
                ),
                onTap: _restoreDismissed,
              ),
          ],
        ),

        _SettingsSection(
          title: 'Ops device & MoMo',
          icon: Icons.sim_card_outlined,
          children: [
            TextField(
              controller: _urlCtrl,
              decoration: const InputDecoration(
                labelText: 'API base URL',
                hintText: 'https://www.dataflexghana.com',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _keyCtrl,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'Ops API key (ops_…)',
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _momoCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Expected MoMo number',
                hintText: '0557943392',
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Create a device key via POST /api/admin/ops/devices (admin session). '
              'Paste the plaintext key here once.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white38),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(46)),
              child: _saving
                  ? const SizedBox(
                      width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Save'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: _urlCtrl.text));
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Base URL copied')),
                );
              },
              icon: const Icon(Icons.copy, size: 18),
              label: const Text('Copy base URL'),
            ),
          ],
        ),
      ],
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: OpsColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: OpsColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: OpsColors.brand),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

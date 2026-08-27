import 'package:flutter/material.dart';

import '../screens/admin_login_page.dart';
import '../services/admin_session.dart';

/// Wraps an admin-only screen. The ops device key only covers `/api/ops/*`, so
/// admin tabs need a signed-in admin user and show a sign-in prompt otherwise.
class AdminGate extends StatefulWidget {
  const AdminGate({super.key, required this.title, required this.builder});

  final String title;
  final WidgetBuilder builder;

  @override
  State<AdminGate> createState() => _AdminGateState();
}

class _AdminGateState extends State<AdminGate> {
  @override
  void initState() {
    super.initState();
    AdminSession.instance.addListener(_onChanged);
  }

  @override
  void dispose() {
    AdminSession.instance.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (AdminSession.instance.isSignedIn) return widget.builder(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.admin_panel_settings_outlined, size: 56, color: Colors.white38),
            const SizedBox(height: 16),
            Text(
              'Admin sign-in required',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.title} uses your admin account, not the ops device key. '
              'Sign in once and it is remembered on this phone.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white60),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AdminLoginPage()),
              ),
              icon: const Icon(Icons.login),
              label: const Text('Sign in as admin'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

const _adminWhatsApp = '233246827049';

/// Mirrors the website "Account Activation Required" lock screen shown on
/// /agent/publish-products and /agent/publish-properties.
class PublishPermissionGate extends StatelessWidget {
  const PublishPermissionGate({
    super.key,
    required this.title,
    required this.subtitle,
    required this.body,
    required this.whatsAppMessage,
    required this.accent,
  });

  final String title;
  final String subtitle;
  final String body;
  final String whatsAppMessage;
  final Color accent;

  /// Locked screen for the Publish Products menu.
  factory PublishPermissionGate.products() => const PublishPermissionGate(
        title: 'Account Activation Required',
        subtitle: 'Product publishing access pending',
        body:
            'Your account needs to be activated and approved by an admin before you can '
            'publish products on the wholesale platform. Please contact admin for account '
            'activation and approval.',
        whatsAppMessage:
            'I want to publish products for agents to buy at wholesale or shop on Dataflex Ghana. '
            'What are the requirements?',
        accent: DfColors.danger,
      );

  /// Locked screen for the Publish Properties menu.
  factory PublishPermissionGate.properties() => const PublishPermissionGate(
        title: 'Account Activation Required',
        subtitle: 'Property publishing access pending',
        body:
            'Your account needs to be activated and approved by an admin before you can '
            'publish properties. Please contact admin for account activation and approval.',
        whatsAppMessage:
            'I want to publish properties on Dataflex Ghana. What are the requirements?',
        accent: const Color(0xFFEA580C),
      );

  Future<void> _contactAdmin() async {
    final uri = Uri.parse(
      'https://wa.me/$_adminWhatsApp?text=${Uri.encodeComponent(whatsAppMessage)}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  /// Shows the same message as a modal, for when the agent taps a blocked action.
  static Future<void> showDialogFor(BuildContext context, PublishPermissionGate gate) {
    return showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Icon(Icons.lock_outline_rounded, color: gate.accent, size: 40),
        title: Text(
          gate.title,
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20),
        ),
        content: Text(
          gate.body,
          textAlign: TextAlign.center,
          style: const TextStyle(color: DfColors.muted, height: 1.45, fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              gate._contactAdmin();
            },
            icon: const Icon(Icons.chat_rounded, size: 18),
            label: const Text('Contact Admin'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DfColors.sand,
      appBar: AppBar(title: Text(subtitle)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: accent.withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.lock_outline_rounded, size: 40, color: accent),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: accent, fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const SizedBox(height: 14),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: DfColors.muted, height: 1.5, fontSize: 14),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: DfColors.sand,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'To get access, you need to:',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                      ),
                      SizedBox(height: 8),
                      Text('1. Contact the admin via WhatsApp', style: TextStyle(height: 1.6, fontSize: 13)),
                      Text('2. Provide required documentation', style: TextStyle(height: 1.6, fontSize: 13)),
                      Text('3. Wait for account approval', style: TextStyle(height: 1.6, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton.icon(
                  onPressed: _contactAdmin,
                  icon: const Icon(Icons.chat_rounded),
                  label: const Text('Contact Admin on WhatsApp'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  child: const Text('Return to Dashboard'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

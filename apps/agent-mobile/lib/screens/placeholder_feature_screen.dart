import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/session_store.dart';
import '../theme/app_theme.dart';

class PlaceholderFeatureScreen extends StatelessWidget {
  const PlaceholderFeatureScreen({
    super.key,
    required this.title,
    required this.webPath,
    required this.blurb,
  });

  final String title;
  final String webPath;
  final String blurb;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            Icon(Icons.auto_awesome, size: 56, color: DfColors.brand.withValues(alpha: 0.8)),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            Text(blurb, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.muted)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
              ),
              child: const Text(
                'Under construction in the app. Use the website for this menu until the native version ships.',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: () async {
                final base = await SessionStore.instance.getBaseUrl();
                await launchUrl(Uri.parse('$base$webPath'), mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.open_in_browser),
              label: const Text('Open on website'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

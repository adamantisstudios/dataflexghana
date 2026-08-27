import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import 'dating_constants.dart';

List<Map<String, dynamic>> asMapList(Object? raw) {
  if (raw is! List) return [];
  return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}

List<String> asStringList(Object? raw) {
  if (raw is! List) return [];
  return raw
      .map((e) => e?.toString() ?? '')
      .where((e) => e.trim().isNotEmpty)
      .toList();
}

int? asInt(Object? raw) {
  if (raw is num) return raw.toInt();
  return int.tryParse(raw?.toString() ?? '');
}

/// Absolute, authenticated photo URLs for a discover/match profile payload.
List<String> photoUrlsOf(Map<String, dynamic>? profile) {
  if (profile == null) return [];
  final out = <String>[];
  for (final photo in asMapList(profile['photos'])) {
    final url = DatingApi.absolutize(
      photo['public_url']?.toString() ?? photo['url']?.toString(),
    );
    if (url.isNotEmpty) out.add(url);
  }
  if (out.isEmpty) {
    final single = DatingApi.absolutize(
      profile['photo_url']?.toString() ?? profile['profile_image_url']?.toString(),
    );
    if (single.isNotEmpty) out.add(single);
  }
  return out;
}

void showDatingSnack(BuildContext context, String message, {bool danger = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: danger ? DfColors.danger : null,
    ),
  );
}

String errorMessage(Object e) => e is ApiException ? e.message : e.toString();

class DatingSection extends StatelessWidget {
  const DatingSection({super.key, required this.title, this.subtitle, required this.child});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: DfColors.card,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17)),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: const TextStyle(color: DfColors.muted, fontSize: 12.5)),
            ],
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class DatingChip extends StatelessWidget {
  const DatingChip({super.key, required this.label, this.icon, this.color});

  final String label;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final tint = color ?? DfColors.brand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: tint.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tint.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: tint),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: tint),
          ),
        ],
      ),
    );
  }
}

/// Wrapped multi-select used for interests, languages and personality traits.
class MultiSelectChips extends StatelessWidget {
  const MultiSelectChips({
    super.key,
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  final List<String> options;
  final List<String> selected;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((option) {
        final isOn = selected.contains(option);
        return FilterChip(
          label: Text(option),
          selected: isOn,
          showCheckmark: false,
          onSelected: (_) => onToggle(option),
          selectedColor: DfColors.brand.withValues(alpha: 0.16),
          backgroundColor: Colors.white,
          side: BorderSide(
            color: isOn ? DfColors.brand : DfColors.muted.withValues(alpha: 0.3),
          ),
          labelStyle: TextStyle(
            fontWeight: isOn ? FontWeight.w700 : FontWeight.w500,
            color: isOn ? DfColors.brandDark : DfColors.ink,
          ),
        );
      }).toList(),
    );
  }
}

class CompletenessMeter extends StatelessWidget {
  const CompletenessMeter({super.key, required this.percent, this.photoCount = 0});

  final int percent;
  final int photoCount;

  @override
  Widget build(BuildContext context) {
    final color = percent >= 80
        ? DfColors.brand
        : percent >= 50
            ? Colors.orange.shade700
            : DfColors.danger;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Profile completeness',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const Spacer(),
            Text('$percent%', style: TextStyle(fontWeight: FontWeight.w800, color: color)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: percent / 100,
            minHeight: 9,
            backgroundColor: DfColors.sand,
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '$photoCount of $maxDatingPhotos photos added. Each extra photo and detail lifts your score.',
          style: const TextStyle(color: DfColors.muted, fontSize: 12),
        ),
      ],
    );
  }
}

/// Shared block/report sheet used from discover, matches and chat.
Future<bool> showSafetyActions(
  BuildContext context, {
  required String agentId,
  required String displayName,
}) async {
  final action = await showModalBottomSheet<String>(
    context: context,
    builder: (sheetContext) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              displayName,
              style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.block, color: DfColors.danger),
            title: const Text('Block this person'),
            subtitle: const Text('Ends the match and hides them from discover'),
            onTap: () => Navigator.pop(sheetContext, 'block'),
          ),
          ListTile(
            leading: const Icon(Icons.flag_outlined, color: DfColors.danger),
            title: const Text('Report this person'),
            onTap: () => Navigator.pop(sheetContext, 'report'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );

  if (action == null || !context.mounted) return false;

  if (action == 'block') {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Block this person?'),
        content: Text('$displayName will no longer appear and any match is closed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Block', style: TextStyle(color: DfColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return false;
    try {
      await DatingApi.instance.block(agentId);
      if (context.mounted) showDatingSnack(context, 'Blocked');
      return true;
    } catch (e) {
      if (context.mounted) showDatingSnack(context, errorMessage(e), danger: true);
      return false;
    }
  }

  return _showReportDialog(context, agentId: agentId, displayName: displayName);
}

Future<bool> _showReportDialog(
  BuildContext context, {
  required String agentId,
  required String displayName,
}) async {
  var reason = reportReasons.first;
  final details = TextEditingController();
  var submitting = false;

  final submitted = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (builderContext, setSheetState) => AlertDialog(
        title: Text('Report $displayName'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: reason,
              decoration: const InputDecoration(labelText: 'Reason'),
              items: reportReasons
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setSheetState(() => reason = v ?? reason),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: details,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Details (optional)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: submitting ? null : () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: submitting
                ? null
                : () async {
                    setSheetState(() => submitting = true);
                    try {
                      await DatingApi.instance.report(
                        reportedAgentId: agentId,
                        reason: reason,
                        details: details.text,
                      );
                      if (dialogContext.mounted) Navigator.pop(dialogContext, true);
                    } catch (e) {
                      setSheetState(() => submitting = false);
                      if (builderContext.mounted) {
                        showDatingSnack(builderContext, errorMessage(e), danger: true);
                      }
                    }
                  },
            child: const Text('Submit report'),
          ),
        ],
      ),
    ),
  );

  details.dispose();
  if (submitted == true && context.mounted) {
    showDatingSnack(context, 'Report submitted. Our team will review it.');
  }
  return submitted == true;
}

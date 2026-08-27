import 'package:flutter/material.dart';

import '../theme.dart';
import 'ops_widgets.dart';

class InboxTile extends StatelessWidget {
  const InboxTile({super.key, required this.item, required this.onAck});

  final Map<String, dynamic> item;
  final Future<void> Function(String id) onAck;

  Color _sevColor(String? s) {
    switch (s) {
      case 'critical':
        return OpsColors.danger;
      case 'warning':
        return OpsColors.warning;
      default:
        return OpsColors.success;
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

    return Card(
      color: requiresAck && !acked
          ? OpsColors.danger.withValues(alpha: 0.16)
          : OpsColors.card,
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
                  decoration: BoxDecoration(
                    color: _sevColor(severity),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                if (category.isNotEmpty)
                  Text(
                    category,
                    style: const TextStyle(fontSize: 11, color: Colors.white54),
                  ),
              ],
            ),
            if (body.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(body, style: const TextStyle(color: Colors.white70, height: 1.35)),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  formatDateTime(item['created_at']),
                  style: const TextStyle(fontSize: 11, color: Colors.white38),
                ),
                const Spacer(),
                if (requiresAck && !acked)
                  FilledButton(
                    onPressed: () => onAck(id),
                    style: FilledButton.styleFrom(backgroundColor: OpsColors.warning),
                    child: const Text('Attend'),
                  )
                else if (acked)
                  const Text(
                    'Attended',
                    style: TextStyle(color: OpsColors.success, fontSize: 12),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

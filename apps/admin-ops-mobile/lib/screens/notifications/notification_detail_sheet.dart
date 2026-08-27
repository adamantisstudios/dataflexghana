import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'notification_models.dart';

enum NotificationDetailAction { edit, toggleActive, delete }

Future<NotificationDetailAction?> showNotificationDetailSheet(
  BuildContext context, {
  required AgentNotification row,
  required String audienceLabel,
}) {
  return showModalBottomSheet<NotificationDetailAction>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: OpsColors.cardAlt,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => _DetailSheet(row: row, audienceLabel: audienceLabel),
  );
}

class _DetailSheet extends StatelessWidget {
  const _DetailSheet({required this.row, required this.audienceLabel});

  final AgentNotification row;
  final String audienceLabel;

  @override
  Widget build(BuildContext context) {
    final status = row.status;
    return DraggableScrollableSheet(
      initialChildSize: 0.78,
      minChildSize: 0.45,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, controller) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          row.title.isEmpty ? 'Untitled' : row.title,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            NotifTag(label: status.label, color: status.color, icon: status.icon),
                            NotifTag(
                              label: row.frequencyLabel,
                              color: OpsColors.info,
                              icon: Icons.repeat,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    tooltip: 'Close',
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: OpsColors.border),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  const Text(
                    'HOW AGENTS SEE IT',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: Colors.white38,
                    ),
                  ),
                  const SizedBox(height: 10),
                  AgentPreviewCard(
                    title: row.title,
                    message: row.message,
                    frequency: row.frequency,
                  ),
                  const SizedBox(height: 20),
                  NotifPanel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DetailRow(label: 'Audience', value: audienceLabel),
                        DetailRow(label: 'Frequency', value: row.frequencyLabel),
                        DetailRow(
                          label: 'Starts',
                          value: formatDateTime(row.startDate?.toIso8601String()),
                        ),
                        DetailRow(
                          label: 'Ends',
                          value: formatDateTime(row.endDate?.toIso8601String()),
                        ),
                        DetailRow(
                          label: 'Active',
                          value: row.isActive ? 'Yes' : 'No',
                          valueColor: row.isActive ? OpsColors.success : OpsColors.danger,
                        ),
                        DetailRow(label: 'Template', value: row.templateName ?? '—'),
                        DetailRow(
                          label: 'Created',
                          value: formatDateTime(row.createdAt?.toIso8601String()),
                        ),
                        DetailRow(
                          label: 'Updated',
                          value: formatDateTime(row.updatedAt?.toIso8601String()),
                        ),
                      ],
                    ),
                  ),
                  NotifPanel(
                    onTap: () async {
                      await Clipboard.setData(ClipboardData(text: row.id));
                      if (!context.mounted) return;
                      showNotifSnack(context, 'Notification ID copied');
                    },
                    child: Row(
                      children: [
                        const Icon(Icons.tag, size: 16, color: Colors.white38),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            row.id,
                            style: const TextStyle(fontSize: 12, color: Colors.white54),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Icon(Icons.copy_all_outlined, size: 15, color: Colors.white38),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _action(
                          context,
                          icon: Icons.edit_outlined,
                          label: 'Edit',
                          color: OpsColors.brand,
                          filled: true,
                          action: NotificationDetailAction.edit,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _action(
                          context,
                          icon: row.isActive
                              ? Icons.pause_circle_outline
                              : Icons.play_circle_outline,
                          label: row.isActive ? 'Pause' : 'Activate',
                          color: row.isActive ? OpsColors.warning : OpsColors.success,
                          action: NotificationDetailAction.toggleActive,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _action(
                    context,
                    icon: Icons.delete_outline,
                    label: 'Delete notification',
                    color: OpsColors.danger,
                    action: NotificationDetailAction.delete,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _action(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required NotificationDetailAction action,
    bool filled = false,
  }) {
    void onPressed() => Navigator.pop(context, action);

    if (filled) {
      return FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 17),
        label: Text(label, overflow: TextOverflow.ellipsis),
        style: FilledButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 17),
      label: Text(label, overflow: TextOverflow.ellipsis),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.45)),
        padding: const EdgeInsets.symmetric(vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

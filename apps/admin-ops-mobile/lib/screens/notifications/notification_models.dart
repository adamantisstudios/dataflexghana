import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../services/admin_session.dart';
import '../../theme.dart';

/// REST surface backing this feature. Same routes the website admin tab uses.
const kAgentNotificationsPath = '/api/admin/agent-notifications';
const kAdminAgentsListPath = '/api/admin/agents/list';

/// The agents list route ignores searches shorter than this.
const kAgentSearchMinChars = 4;

/// `frequency` column values understood by the agent apps.
const kFrequencyOptions = <String, String>{
  'once_per_day': 'Once per day',
  'once_per_session': 'Once per session',
  'always': 'Every visit',
};

/// Not a database column — derived from `is_active` plus the schedule window,
/// mirroring `getStatus()` in the website tab.
enum NotificationStatus { active, scheduled, expired, inactive }

extension NotificationStatusX on NotificationStatus {
  String get key => name;

  String get label {
    switch (this) {
      case NotificationStatus.active:
        return 'Live';
      case NotificationStatus.scheduled:
        return 'Scheduled';
      case NotificationStatus.expired:
        return 'Expired';
      case NotificationStatus.inactive:
        return 'Inactive';
    }
  }

  Color get color {
    switch (this) {
      case NotificationStatus.active:
        return OpsColors.success;
      case NotificationStatus.scheduled:
        return OpsColors.info;
      case NotificationStatus.expired:
        return OpsColors.warning;
      case NotificationStatus.inactive:
        return OpsColors.danger;
    }
  }

  IconData get icon {
    switch (this) {
      case NotificationStatus.active:
        return Icons.podcasts_outlined;
      case NotificationStatus.scheduled:
        return Icons.schedule_outlined;
      case NotificationStatus.expired:
        return Icons.history_toggle_off_outlined;
      case NotificationStatus.inactive:
        return Icons.pause_circle_outline;
    }
  }
}

class AgentNotification {
  AgentNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.startDate,
    required this.endDate,
    required this.frequency,
    required this.templateName,
    required this.isActive,
    required this.targetAgentId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AgentNotification.fromJson(Map<String, dynamic> json) {
    String? text(String key) {
      final v = json[key];
      if (v == null) return null;
      final s = v.toString().trim();
      return s.isEmpty ? null : s;
    }

    return AgentNotification(
      id: text('id') ?? '',
      title: text('title') ?? '',
      message: text('message') ?? '',
      startDate: DateTime.tryParse(text('start_date') ?? ''),
      endDate: DateTime.tryParse(text('end_date') ?? ''),
      frequency: text('frequency') ?? 'once_per_day',
      templateName: text('template_name'),
      isActive: json['is_active'] != false,
      targetAgentId: text('target_agent_id'),
      createdAt: DateTime.tryParse(text('created_at') ?? ''),
      updatedAt: DateTime.tryParse(text('updated_at') ?? ''),
    );
  }

  final String id;
  final String title;
  final String message;
  final DateTime? startDate;
  final DateTime? endDate;
  final String frequency;
  final String? templateName;
  final bool isActive;
  final String? targetAgentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isBroadcast => targetAgentId == null || targetAgentId!.isEmpty;

  String get frequencyLabel =>
      kFrequencyOptions[frequency] ?? frequency.replaceAll('_', ' ');

  NotificationStatus get status {
    if (!isActive) return NotificationStatus.inactive;
    final now = DateTime.now();
    if (startDate != null && now.isBefore(startDate!)) {
      return NotificationStatus.scheduled;
    }
    if (endDate != null && now.isAfter(endDate!)) {
      return NotificationStatus.expired;
    }
    return NotificationStatus.active;
  }

  bool matches(String query) {
    if (query.trim().isEmpty) return true;
    final q = query.trim().toLowerCase();
    return title.toLowerCase().contains(q) ||
        message.toLowerCase().contains(q) ||
        (templateName ?? '').toLowerCase().contains(q);
  }
}

/// A lightweight agent record used only for the "target one agent" picker.
class AgentRef {
  const AgentRef({required this.id, required this.name, this.phone});

  factory AgentRef.fromJson(Map<String, dynamic> json) {
    final name = (json['full_name'] ?? '').toString().trim();
    final id = (json['id'] ?? '').toString();
    return AgentRef(
      id: id,
      name: name.isEmpty ? shortId(id) : name,
      phone: (json['phone_number'] ?? json['momo_number'])?.toString(),
    );
  }

  final String id;
  final String name;
  final String? phone;
}

String shortId(String? id) {
  if (id == null || id.isEmpty) return '—';
  return id.length <= 8 ? id : '${id.substring(0, 8)}…';
}

/// Turns transport/auth failures into copy the admin can act on.
String describeNotificationError(Object error) {
  if (error is AdminApiException) {
    if (error.isUnauthorized) return 'Admin session expired — sign in again.';
    return error.message;
  }
  if (error is AdminAuthException) {
    return 'Admin session expired — sign in again.';
  }
  return error.toString();
}

void showNotifSnack(BuildContext context, String message, {bool success = true}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: success ? OpsColors.card : OpsColors.danger.withValues(alpha: 0.94),
      content: Row(
        children: [
          Icon(
            success ? Icons.check_circle_outline : Icons.error_outline,
            size: 18,
            color: success ? OpsColors.success : Colors.white,
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: const TextStyle(color: Colors.white))),
        ],
      ),
    ),
  );
}

Future<bool> confirmNotifAction(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: OpsColors.card,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      title: Text(title),
      content: Text(message, style: const TextStyle(color: Colors.white70, height: 1.4)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(
          style: destructive
              ? FilledButton.styleFrom(backgroundColor: OpsColors.danger)
              : FilledButton.styleFrom(backgroundColor: OpsColors.brand),
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

/// Dark surface used for every row and panel in this feature.
class NotifPanel extends StatelessWidget {
  const NotifPanel({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(14),
    this.accent,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final color = accent ?? OpsColors.border;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: OpsColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: accent == null ? 1 : 0.45)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
      ),
    );
  }
}

class NotifTag extends StatelessWidget {
  const NotifTag({super.key, required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// Renders the notification exactly the way the agent app's slide-down popup
/// and notifications list do: brand card, title, message, frequency pill.
class AgentPreviewCard extends StatelessWidget {
  const AgentPreviewCard({
    super.key,
    required this.title,
    required this.message,
    required this.frequency,
  });

  final String title;
  final String message;
  final String frequency;

  @override
  Widget build(BuildContext context) {
    final safeTitle = title.trim().isEmpty ? 'Admin update' : title.trim();
    final safeMessage = message.trim();
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0B3B36),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: OpsColors.brand.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2, right: 10),
            child: Icon(Icons.campaign_outlined, color: Colors.white, size: 20),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  safeTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  safeMessage.isEmpty ? 'Your message will appear here.' : safeMessage,
                  style: TextStyle(
                    color: safeMessage.isEmpty ? Colors.white38 : Colors.white70,
                    height: 1.35,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                NotifTag(
                  label: (kFrequencyOptions[frequency] ?? frequency).toUpperCase(),
                  color: Colors.white70,
                  icon: Icons.repeat,
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 6, top: 2),
            child: Icon(Icons.close, color: Colors.white38, size: 18),
          ),
        ],
      ),
    );
  }
}

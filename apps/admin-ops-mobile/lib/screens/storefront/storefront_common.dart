import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/admin_api.dart';
import '../../services/admin_session.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';

const kStorefrontPageLimit = 20;
const kStorefrontExportLimit = 100;
const kStorefrontExportMaxPages = 25;

/// Turns transport/auth failures into copy the admin can act on.
String describeAdminError(Object error) {
  if (error is AdminApiException) {
    if (error.isUnauthorized) {
      return 'Admin session expired — sign in again.';
    }
    return error.message;
  }
  if (error is AdminAuthException) {
    return 'Admin session expired — sign in again.';
  }
  return error.toString();
}

void showOpsSnack(BuildContext context, String message, {bool success = true}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: success ? OpsColors.card : OpsColors.danger.withValues(alpha: 0.92),
      content: Row(
        children: [
          Icon(
            success ? Icons.check_circle_outline : Icons.error_outline,
            size: 18,
            color: success ? OpsColors.success : Colors.white,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ),
  );
}

Future<bool> confirmAction(
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
      title: Text(title),
      content: Text(message, style: const TextStyle(color: Colors.white70, height: 1.4)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(
          style: destructive ? FilledButton.styleFrom(backgroundColor: OpsColors.danger) : null,
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

Future<void> copyToClipboard(BuildContext context, String value, String label) async {
  await Clipboard.setData(ClipboardData(text: value));
  if (!context.mounted) return;
  showOpsSnack(context, '$label copied to clipboard');
}

String csvEscape(Object? value) {
  final s = (value ?? '').toString();
  if (RegExp(r'[",\n]').hasMatch(s)) {
    return '"${s.replaceAll('"', '""')}"';
  }
  return s;
}

String buildCsv(List<String> header, List<List<Object?>> rows) {
  final buffer = StringBuffer(header.map(csvEscape).join(','));
  for (final row in rows) {
    buffer.write('\n');
    buffer.write(row.map(csvEscape).join(','));
  }
  return buffer.toString();
}

double asDouble(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse('${value ?? ''}') ?? 0;
}

int asInt(Object? value) {
  if (value is num) return value.toInt();
  return int.tryParse('${value ?? ''}') ?? 0;
}

Map<String, dynamic>? asMap(Object? value) {
  if (value is Map) return value.cast<String, dynamic>();
  return null;
}

/// Dark surface used for every list row + panel in this feature.
class OpsPanel extends StatelessWidget {
  const OpsPanel({
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
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

/// Segmented status filter that scrolls horizontally on narrow phones.
class OpsFilterBar extends StatelessWidget {
  const OpsFilterBar({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
  });

  final List<MapEntry<String, String>> options;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          for (final option in options) ...[
            _Chip(
              label: option.value,
              selected: option.key == value,
              color: option.key == 'all' ? OpsColors.brand : OpsColors.statusColor(option.key),
              onTap: () => onChanged(option.key),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? color.withValues(alpha: 0.2) : OpsColors.cardAlt,
      borderRadius: BorderRadius.circular(30),
      child: InkWell(
        borderRadius: BorderRadius.circular(30),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: selected ? color.withValues(alpha: 0.7) : OpsColors.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? color : Colors.white60,
            ),
          ),
        ),
      ),
    );
  }
}

class OpsPager extends StatelessWidget {
  const OpsPager({
    super.key,
    required this.page,
    required this.totalPages,
    required this.total,
    required this.onChanged,
  });

  final int page;
  final int totalPages;
  final int total;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Center(
          child: Text(
            total == 1 ? '1 record' : '$total records',
            style: const TextStyle(color: Colors.white38, fontSize: 12),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton.filledTonal(
            onPressed: page <= 1 ? null : () => onChanged(page - 1),
            icon: const Icon(Icons.chevron_left),
            tooltip: 'Previous page',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Column(
              children: [
                Text(
                  'Page $page / $totalPages',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(
                  '$total total',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            onPressed: page >= totalPages ? null : () => onChanged(page + 1),
            icon: const Icon(Icons.chevron_right),
            tooltip: 'Next page',
          ),
        ],
      ),
    );
  }
}

/// Rounded action button used in the toolbars and detail sheets.
class OpsActionButton extends StatelessWidget {
  const OpsActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color = OpsColors.brand,
    this.busy = false,
    this.filled = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final Color color;
  final bool busy;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final child = busy
        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
        : Icon(icon, size: 17);
    if (filled) {
      return FilledButton.icon(
        onPressed: busy ? null : onPressed,
        icon: child,
        label: Text(label, overflow: TextOverflow.ellipsis),
        style: FilledButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
    return OutlinedButton.icon(
      onPressed: busy ? null : onPressed,
      icon: child,
      label: Text(label, overflow: TextOverflow.ellipsis),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.45)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

/// Standard scaffolding for the bottom sheets: grabber, title, scrollable body.
Future<T?> showOpsSheet<T>({
  required BuildContext context,
  required String title,
  String? subtitle,
  required WidgetBuilder builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: OpsColors.cardAlt,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return DraggableScrollableSheet(
        initialChildSize: 0.72,
        minChildSize: 0.4,
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1, color: OpsColors.border),
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: EdgeInsets.fromLTRB(
                    20,
                    16,
                    20,
                    20 + MediaQuery.of(ctx).viewInsets.bottom,
                  ),
                  children: [builder(ctx)],
                ),
              ),
            ],
          );
        },
      );
    },
  );
}

/// Shared list scaffolding: loading shimmer, error card, empty state.
class OpsListState extends StatelessWidget {
  const OpsListState({
    super.key,
    required this.loading,
    required this.error,
    required this.isEmpty,
    required this.emptyMessage,
    required this.onRetry,
    required this.child,
    this.emptyIcon = Icons.inbox_outlined,
  });

  final bool loading;
  final String? error;
  final bool isEmpty;
  final String emptyMessage;
  final VoidCallback onRetry;
  final Widget child;
  final IconData emptyIcon;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (error != null) {
      return Padding(
        padding: const EdgeInsets.only(top: 8),
        child: OpsError(message: error!, onRetry: onRetry),
      );
    }
    if (isEmpty) {
      return OpsEmpty(message: emptyMessage, icon: emptyIcon);
    }
    return child;
  }
}

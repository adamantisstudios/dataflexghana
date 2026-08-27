import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme.dart';

final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);
final _dateTime = DateFormat('dd MMM yyyy, HH:mm');
final _dateOnly = DateFormat('dd MMM yyyy');

String formatMoney(dynamic value) {
  final n = value is num ? value.toDouble() : double.tryParse('${value ?? ''}') ?? 0;
  return _money.format(n);
}

String formatDateTime(dynamic value) {
  if (value == null) return '—';
  final d = DateTime.tryParse(value.toString());
  if (d == null) return '—';
  return _dateTime.format(d.toLocal());
}

String formatDate(dynamic value) {
  if (value == null) return '—';
  final d = DateTime.tryParse(value.toString());
  if (d == null) return '—';
  return _dateOnly.format(d.toLocal());
}

/// First non-empty value among [keys], searching nested maps one level deep.
String pick(Map<String, dynamic> row, List<String> keys, {String fallback = '—'}) {
  for (final k in keys) {
    if (k.contains('.')) {
      final parts = k.split('.');
      dynamic cur = row;
      for (final p in parts) {
        if (cur is Map && cur.containsKey(p)) {
          cur = cur[p];
        } else {
          cur = null;
          break;
        }
      }
      if (cur != null && cur.toString().trim().isNotEmpty) return cur.toString();
      continue;
    }
    final v = row[k];
    if (v != null && v.toString().trim().isNotEmpty) return v.toString();
  }
  return fallback;
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status, this.label});

  final String? status;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final color = OpsColors.statusColor(status);
    final text = (label ?? status ?? 'unknown').replaceAll('_', ' ');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.4),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.subtitle, this.trailing});

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white54),
                  ),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class OpsEmpty extends StatelessWidget {
  const OpsEmpty({super.key, required this.message, this.icon = Icons.inbox_outlined});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Icon(icon, size: 44, color: Colors.white24),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white54),
          ),
        ],
      ),
    );
  }
}

class OpsError extends StatelessWidget {
  const OpsError({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: OpsColors.danger.withValues(alpha: 0.12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.error_outline, color: OpsColors.danger),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: const TextStyle(color: Colors.white70))),
            if (onRetry != null)
              TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

/// Compact label/value row used across the detail sheets.
class DetailRow extends StatelessWidget {
  const DetailRow({super.key, required this.label, required this.value, this.valueColor});

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 116,
            child: Text(label, style: const TextStyle(color: Colors.white54, fontSize: 12)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: valueColor ?? Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.label,
    required this.value,
    this.color = OpsColors.brand,
    this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 15, color: color),
                const SizedBox(width: 6),
              ],
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontSize: 11, color: Colors.white60),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }
}

/// Debounced search field shared by the list tabs.
class OpsSearchField extends StatefulWidget {
  const OpsSearchField({super.key, required this.onChanged, this.hint = 'Search…'});

  final ValueChanged<String> onChanged;
  final String hint;

  @override
  State<OpsSearchField> createState() => _OpsSearchFieldState();
}

class _OpsSearchFieldState extends State<OpsSearchField> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _ctrl,
      onSubmitted: widget.onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: widget.hint,
        prefixIcon: const Icon(Icons.search, size: 20),
        suffixIcon: _ctrl.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.clear, size: 18),
                onPressed: () {
                  _ctrl.clear();
                  widget.onChanged('');
                  setState(() {});
                },
              ),
      ),
    );
  }
}

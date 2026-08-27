import 'package:flutter/material.dart';

import '../theme.dart';
import '../widgets/ops_widgets.dart';

class SmsLogPage extends StatelessWidget {
  const SmsLogPage({super.key, required this.logs});

  final List logs;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SectionHeader(
          title: 'SMS log',
          subtitle: 'MoMo messages captured on this SIM.',
        ),
        if (logs.isEmpty)
          const OpsEmpty(
            message: 'No MoMo SMS processed yet',
            icon: Icons.sms_outlined,
          ),
        ...logs.map((e) {
          final raw = e.raw as String;
          return Card(
            child: ListTile(
              title: Text(
                e.matchStatus ?? 'unknown',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${e.message ?? ""}\n${raw.length > 120 ? "${raw.substring(0, 120)}…" : raw}',
              ),
              isThreeLine: true,
              trailing: Icon(
                e.success ? Icons.check_circle : Icons.error_outline,
                color: e.success ? OpsColors.success : OpsColors.danger,
              ),
            ),
          );
        }),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../widgets/inbox_tile.dart';
import '../widgets/ops_widgets.dart';

class InboxPage extends StatelessWidget {
  const InboxPage({
    super.key,
    required this.inbox,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.onAck,
    required this.onClearAll,
  });

  final List<Map<String, dynamic>> inbox;
  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String id) onAck;
  final Future<void> Function() onClearAll;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'Admin inbox',
            subtitle: 'Mirrors dashboard alerts. Sticky items require Attend.',
            trailing: inbox.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Clear all notifications',
                    icon: const Icon(Icons.clear_all),
                    onPressed: onClearAll,
                  ),
          ),
          if (loading) const LinearProgressIndicator(),
          if (error != null) OpsError(message: error!, onRetry: onRefresh),
          if (inbox.isEmpty && !loading)
            const OpsEmpty(message: 'Inbox empty'),
          ...inbox.map((item) => InboxTile(item: item, onAck: onAck)),
        ],
      ),
    );
  }
}

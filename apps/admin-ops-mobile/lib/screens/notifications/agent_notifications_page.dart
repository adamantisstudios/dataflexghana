import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'notification_compose_sheet.dart';
import 'notification_detail_sheet.dart';
import 'notification_models.dart';

/// Admin "Agent Notifications" tab: compose, schedule and manage the
/// slide-down messages that appear on every agent's dashboard.
///
/// Renders its own body only — it is placed inside an existing Scaffold.
class AgentNotificationsPage extends StatefulWidget {
  const AgentNotificationsPage({super.key});

  @override
  State<AgentNotificationsPage> createState() => _AgentNotificationsPageState();
}

class _AgentNotificationsPageState extends State<AgentNotificationsPage> {
  static const _tabs = <NotificationStatus?>[
    null,
    NotificationStatus.active,
    NotificationStatus.scheduled,
    NotificationStatus.expired,
    NotificationStatus.inactive,
  ];

  List<AgentNotification> _rows = const [];
  final Map<String, String> _agentNames = {};
  bool _loading = true;
  String? _error;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final raw = await AdminApi.instance.getList(
        kAgentNotificationsPath,
        keys: const ['data', 'notifications'],
      );
      final rows = raw.map(AgentNotification.fromJson).where((r) => r.id.isNotEmpty).toList();
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
        _error = null;
      });
      await _resolveAgentNames(rows);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = describeNotificationError(e);
      });
    }
  }

  /// Targeted rows only store an agent id, so fetch the names once per id.
  Future<void> _resolveAgentNames(List<AgentNotification> rows) async {
    final missing = <String>{};
    for (final row in rows) {
      final id = row.targetAgentId;
      if (id != null && id.isNotEmpty && !_agentNames.containsKey(id)) missing.add(id);
    }
    if (missing.isEmpty) return;

    for (final id in missing) {
      try {
        final result = await AdminApi.instance.getList(
          kAdminAgentsListPath,
          query: {'id': id},
          keys: const ['agents'],
        );
        if (result.isEmpty) continue;
        final name = AgentRef.fromJson(result.first).name;
        if (!mounted) return;
        setState(() => _agentNames[id] = name);
      } catch (_) {
        // Fall back to the short id in the UI.
      }
    }
  }

  String _agentLabel(String? id) {
    if (id == null || id.isEmpty) return 'All agents';
    return _agentNames[id] ?? shortId(id);
  }

  List<AgentNotification> _filtered(NotificationStatus? status) {
    final list = _rows
        .where((r) => status == null || r.status == status)
        .where((r) => r.matches(_query))
        .toList();
    list.sort((a, b) {
      final aTime = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bTime = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bTime.compareTo(aTime);
    });
    return list;
  }

  int _countOf(NotificationStatus status) =>
      _rows.where((r) => r.status == status).length;

  Future<void> _openCompose({AgentNotification? editing}) async {
    final saved = await showComposeSheet(
      context,
      editing: editing,
      templateSource: _rows,
    );
    if (!mounted || !saved) return;
    showNotifSnack(
      context,
      editing == null ? 'Notification published' : 'Notification updated',
    );
    await _load(silent: true);
  }

  Future<void> _toggleActive(AgentNotification row) async {
    final turningOn = !row.isActive;
    if (turningOn && row.isBroadcast) {
      final ok = await confirmNotifAction(
        context,
        title: 'Activate broadcast?',
        message:
            '"${row.title}" will go live for every agent inside its schedule window. '
            'Broadcasts are hard to take back once agents have seen them.',
        confirmLabel: 'Activate',
      );
      if (!ok || !mounted) return;
    }
    try {
      await AdminApi.instance.put(
        kAgentNotificationsPath,
        body: {'id': row.id, 'is_active': turningOn},
      );
      if (!mounted) return;
      showNotifSnack(context, turningOn ? 'Notification activated' : 'Notification paused');
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      showNotifSnack(context, describeNotificationError(e), success: false);
    }
  }

  Future<void> _delete(AgentNotification row) async {
    final ok = await confirmNotifAction(
      context,
      title: 'Delete notification?',
      message: '"${row.title}" will be removed permanently. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await AdminApi.instance.delete(kAgentNotificationsPath, query: {'id': row.id});
      if (!mounted) return;
      showNotifSnack(context, 'Notification deleted');
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      showNotifSnack(context, describeNotificationError(e), success: false);
    }
  }

  Future<void> _openDetail(AgentNotification row) async {
    final action = await showNotificationDetailSheet(
      context,
      row: row,
      audienceLabel: _agentLabel(row.targetAgentId),
    );
    if (!mounted || action == null) return;
    switch (action) {
      case NotificationDetailAction.edit:
        await _openCompose(editing: row);
        break;
      case NotificationDetailAction.toggleActive:
        await _toggleActive(row);
        break;
      case NotificationDetailAction.delete:
        await _delete(row);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: _tabs.length,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SectionHeader(
                  title: 'Agent Notifications',
                  subtitle: 'Broadcast news and updates to agent dashboards.',
                  trailing: IconButton.filledTonal(
                    onPressed: _loading ? null : () => _load(),
                    icon: const Icon(Icons.refresh),
                    tooltip: 'Refresh',
                  ),
                ),
                _statsRow(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OpsSearchField(
                        hint: 'Search title, message or template…',
                        onChanged: (v) => setState(() => _query = v),
                      ),
                    ),
                    const SizedBox(width: 10),
                    FilledButton.icon(
                      onPressed: () => _openCompose(),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('New'),
                      style: FilledButton.styleFrom(
                        backgroundColor: OpsColors.brand,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: OpsColors.brand,
            labelColor: OpsColors.brand,
            unselectedLabelColor: Colors.white54,
            labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            unselectedLabelStyle: const TextStyle(fontSize: 13),
            tabs: [
              for (final status in _tabs)
                Tab(
                  text: status == null
                      ? 'All (${_rows.length})'
                      : '${status.label} (${_countOf(status)})',
                ),
            ],
          ),
          const Divider(height: 1, color: OpsColors.border),
          Expanded(
            child: TabBarView(
              children: [for (final status in _tabs) _listFor(status)],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsRow() {
    final broadcasts = _rows.where((r) => r.isBroadcast).length;
    return Row(
      children: [
        Expanded(
          child: StatTile(
            label: 'Live now',
            value: '${_countOf(NotificationStatus.active)}',
            color: OpsColors.success,
            icon: Icons.podcasts_outlined,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            label: 'Scheduled',
            value: '${_countOf(NotificationStatus.scheduled)}',
            color: OpsColors.info,
            icon: Icons.schedule_outlined,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatTile(
            label: 'Broadcasts',
            value: '$broadcasts',
            icon: Icons.groups_outlined,
          ),
        ),
      ],
    );
  }

  Widget _listFor(NotificationStatus? status) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final items = _filtered(status);

    return RefreshIndicator(
      color: OpsColors.brand,
      backgroundColor: OpsColors.card,
      onRefresh: () => _load(silent: true),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        children: [
          if (_error != null)
            OpsError(message: _error!, onRetry: () => _load())
          else if (items.isEmpty)
            OpsEmpty(
              message: _query.trim().isNotEmpty
                  ? 'No notifications match "$_query".'
                  : status == null
                      ? 'No notifications yet. Tap New to send your first update.'
                      : 'Nothing ${status.label.toLowerCase()} right now.',
              icon: Icons.notifications_off_outlined,
            )
          else
            for (final row in items) _row(row),
        ],
      ),
    );
  }

  Widget _row(AgentNotification row) {
    final status = row.status;
    return NotifPanel(
      accent: status.color,
      onTap: () => _openDetail(row),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: status.color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(status.icon, size: 17, color: status.color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row.title.isEmpty ? 'Untitled' : row.title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      row.message,
                      style: const TextStyle(color: Colors.white60, fontSize: 12.5, height: 1.35),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(left: 4, top: 6),
                child: Icon(Icons.chevron_right, size: 18, color: Colors.white24),
              ),
            ],
          ),
          const SizedBox(height: 10),
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
              NotifTag(
                label: row.isBroadcast ? 'All agents' : _agentLabel(row.targetAgentId),
                color: row.isBroadcast ? OpsColors.brand : OpsColors.warning,
                icon: row.isBroadcast ? Icons.groups_outlined : Icons.person_outline,
              ),
              if (row.templateName != null)
                NotifTag(
                  label: row.templateName!,
                  color: const Color(0xFFC084FC),
                  icon: Icons.bookmark_outline,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${formatDateTime(row.startDate?.toIso8601String())}  →  '
            '${formatDateTime(row.endDate?.toIso8601String())}',
            style: const TextStyle(color: Colors.white38, fontSize: 11),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

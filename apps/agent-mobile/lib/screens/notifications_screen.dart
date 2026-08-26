import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;
  String? _agentId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<bool> _shouldShow(
    Map<String, dynamic> notification,
    List<Map<String, dynamic>> dismissals,
    String agentId,
  ) async {
    final id = notification['id']?.toString();
    if (id == null) return false;
    final frequency = notification['frequency']?.toString() ?? 'once_per_session';

    Map<String, dynamic>? dismissal;
    for (final d in dismissals) {
      if (d['notification_id']?.toString() == id) {
        dismissal = d;
        break;
      }
    }

    if (dismissal == null) return true;
    if (frequency == 'always') return true;

    final dismissedAt = DateTime.tryParse(dismissal['dismissed_at']?.toString() ?? '');
    if (dismissedAt == null) return true;

    if (frequency == 'once_per_day') {
      final now = DateTime.now();
      final local = dismissedAt.toLocal();
      return local.day != now.day || local.month != now.month || local.year != now.year;
    }

    if (frequency == 'once_per_session') {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('notif_session_${agentId}_$id') != '1';
    }

    return true;
  }

  Future<void> _load({bool force = true}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final agent = await SessionStore.instance.getAgent();
      final agentId = agent?['id']?.toString() ?? '';
      _agentId = agentId;

      final data = await ApiClient.instance.notifications(forceRefresh: force);
      final list = data['notifications'] is List
          ? (data['notifications'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : <Map<String, dynamic>>[];
      final dismissals = data['dismissals'] is List
          ? (data['dismissals'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : <Map<String, dynamic>>[];

      final visible = <Map<String, dynamic>>[];
      for (final n in list) {
        if (agentId.isEmpty || await _shouldShow(n, dismissals, agentId)) {
          visible.add(n);
        }
      }

      setState(() => _items = visible);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _dismiss(String id) async {
    try {
      final agentId = _agentId;
      final item = _items.cast<Map<String, dynamic>?>().firstWhere(
            (e) => e?['id']?.toString() == id,
            orElse: () => null,
          );
      final frequency = item?['frequency']?.toString() ?? 'once_per_session';
      if (agentId != null && frequency == 'once_per_session') {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('notif_session_${agentId}_$id', '1');
      }
      await ApiClient.instance.dismissNotification(id);
      setState(() => _items.removeWhere((e) => e['id']?.toString() == id));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : RefreshIndicator(
                  onRefresh: () => _load(force: true),
                  color: DfColors.brand,
                  child: _items.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 100),
                            Center(child: Text('You\'re all caught up', style: TextStyle(color: DfColors.muted))),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final n = _items[i];
                            final created = DateTime.tryParse(n['created_at']?.toString() ?? '');
                            final when = created == null
                                ? ''
                                : DateFormat('dd MMM · HH:mm').format(created.toLocal());
                            final freq = n['frequency']?.toString() ?? '';
                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: DfColors.brand.withValues(alpha: 0.12)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          n['title']?.toString() ?? 'Update',
                                          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.close, size: 18),
                                        onPressed: () => _dismiss(n['id'].toString()),
                                      ),
                                    ],
                                  ),
                                  Text(n['message']?.toString() ?? '', style: const TextStyle(height: 1.35)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      if (when.isNotEmpty)
                                        Text(when, style: const TextStyle(color: DfColors.muted, fontSize: 11)),
                                      if (freq.isNotEmpty) ...[
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: DfColors.sand,
                                            borderRadius: BorderRadius.circular(999),
                                          ),
                                          child: Text(
                                            freq.replaceAll('_', ' '),
                                            style: const TextStyle(fontSize: 10, color: DfColors.muted),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}

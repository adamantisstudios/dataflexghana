import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

/// Shows admin-triggered agent notifications as an in-app slide-down popup,
/// matching website `AgentDashboardNotification` frequency rules.
class AgentNotificationHost extends StatefulWidget {
  const AgentNotificationHost({super.key, required this.child});

  final Widget child;

  @override
  State<AgentNotificationHost> createState() => _AgentNotificationHostState();
}

class _AgentNotificationHostState extends State<AgentNotificationHost> {
  Map<String, dynamic>? _notification;
  bool _visible = false;
  String? _agentId;

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(seconds: 2), _loadAndShow);
  }

  Future<void> _loadAndShow() async {
    if (!mounted) return;
    try {
      final agent = await SessionStore.instance.getAgent();
      final agentId = agent?['id']?.toString();
      if (agentId == null || agentId.isEmpty) return;
      _agentId = agentId;

      final data = await ApiClient.instance.notifications(forceRefresh: true);
      final list = (data['notifications'] is List)
          ? (data['notifications'] as List)
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
          : <Map<String, dynamic>>[];
      final dismissals = (data['dismissals'] is List)
          ? (data['dismissals'] as List)
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
          : <Map<String, dynamic>>[];

      Map<String, dynamic>? next;
      for (final n in list) {
        if (await _shouldShow(n, dismissals, agentId)) {
          next = n;
          break;
        }
      }

      if (next != null && mounted) {
        setState(() {
          _notification = next;
          _visible = true;
        });
      }
    } catch (_) {
      // Non-blocking — dashboard still works without popup.
    }
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
      return dismissedAt.toLocal().day != now.day ||
          dismissedAt.toLocal().month != now.month ||
          dismissedAt.toLocal().year != now.year;
    }

    if (frequency == 'once_per_session') {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('notif_session_${agentId}_$id') != '1';
    }

    return true;
  }

  Future<void> _dismiss() async {
    final n = _notification;
    final agentId = _agentId;
    setState(() => _visible = false);

    if (n == null || agentId == null) return;
    final id = n['id']?.toString();
    if (id == null) return;

    final frequency = n['frequency']?.toString() ?? 'once_per_session';
    if (frequency == 'once_per_session') {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('notif_session_${agentId}_$id', '1');
    }

    try {
      await ApiClient.instance.dismissNotification(id);
    } catch (_) {}
  }

  Future<void> _openLinks(String message) async {
    final match = RegExp(r'https?://[^\s]+').firstMatch(message);
    if (match != null) {
      final uri = Uri.tryParse(match.group(0)!);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_visible && _notification != null)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Material(
                color: Colors.transparent,
                child: AnimatedSlide(
                  duration: const Duration(milliseconds: 320),
                  offset: _visible ? Offset.zero : const Offset(0, -1),
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                    padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
                    decoration: BoxDecoration(
                      color: DfColors.brandDark,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
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
                          child: Icon(Icons.campaign_outlined, color: Colors.white),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => _openLinks(_notification!['message']?.toString() ?? ''),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _notification!['title']?.toString() ?? 'Admin update',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _notification!['message']?.toString() ?? '',
                                  style: const TextStyle(color: Colors.white70, height: 1.35, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: _dismiss,
                          icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

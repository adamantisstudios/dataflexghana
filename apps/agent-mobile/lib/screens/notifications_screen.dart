import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = true}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.notifications(forceRefresh: force);
      final list = data['notifications'];
      setState(() {
        _items = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
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
                                  if (when.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(when, style: const TextStyle(color: DfColors.muted, fontSize: 11)),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}

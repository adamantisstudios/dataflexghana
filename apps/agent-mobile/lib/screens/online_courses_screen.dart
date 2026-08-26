import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';

class OnlineCoursesScreen extends StatefulWidget {
  const OnlineCoursesScreen({super.key});

  @override
  State<OnlineCoursesScreen> createState() => _OnlineCoursesScreenState();
}

class _OnlineCoursesScreenState extends State<OnlineCoursesScreen> {
  List<Map<String, dynamic>> _courses = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getOnlineCourses();
      setState(() {
        _courses = (data['courses'] is List)
            ? (data['courses'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Future<void> _openCourse(Map<String, dynamic> c) async {
    final structure = c['course_structure_url']?.toString();
    final signup = c['signup_url']?.toString() ?? c['registration_url']?.toString();
    final url = (structure != null && structure.isNotEmpty)
        ? structure
        : (signup != null && signup.isNotEmpty)
            ? signup
            : null;
    if (url != null) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      return;
    }
    final base = await SessionStore.instance.getBaseUrl();
    await launchUrl(Uri.parse('$base/agent/dashboard?tab=online-courses'), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Online Courses')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: _error != null
                  ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                  : _courses.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No published courses yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _courses.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final c = _courses[i];
                            final fee = _n(c['course_fee']);
                            return Card(
                              child: ListTile(
                                title: Text(c['title']?.toString() ?? 'Course',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                                subtitle: Text(
                                  '${c['instructor'] ?? 'Instructor'} · '
                                  '${c['modules_count'] ?? '—'} modules · '
                                  '${fee <= 0 ? 'Free' : 'GHS ${fee.toStringAsFixed(0)}'}',
                                ),
                                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                onTap: () => _openCourse(c),
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}

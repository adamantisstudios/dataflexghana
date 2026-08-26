import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

/// Extracts a playable URL from a tutorial embed iframe / raw URL.
String? tutorialPlayUrl(String? embedOrUrl) {
  if (embedOrUrl == null || embedOrUrl.trim().isEmpty) return null;
  final s = embedOrUrl.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  final src = RegExp(r'''src=["']([^"']+)["']''', caseSensitive: false).firstMatch(s);
  if (src != null) return src.group(1);
  final vimeo = RegExp(r'vimeo\.com/(?:video/)?(\d+)').firstMatch(s);
  if (vimeo != null) return 'https://player.vimeo.com/video/${vimeo.group(1)}';
  final yt = RegExp(r'(?:youtube\.com/embed/|youtu\.be/)([A-Za-z0-9_-]+)').firstMatch(s);
  if (yt != null) return 'https://www.youtube.com/watch?v=${yt.group(1)}';
  return null;
}

class TutorialsScreen extends StatefulWidget {
  const TutorialsScreen({super.key});

  @override
  State<TutorialsScreen> createState() => _TutorialsScreenState();
}

class _TutorialsScreenState extends State<TutorialsScreen> {
  List<Map<String, dynamic>> _videos = [];
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
      final data = await ApiClient.instance.getTutorials();
      setState(() {
        _videos = (data['videos'] is List)
            ? (data['videos'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Future<void> _open(Map<String, dynamic> video) async {
    final url = tutorialPlayUrl(video['embed_code']?.toString());
    if (url == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No playable link for this tutorial')));
      return;
    }
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Video Tutorials')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: _error != null
                  ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                  : _videos.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No tutorials yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _videos.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final v = _videos[i];
                            final platform = v['platform']?.toString() ?? 'video';
                            return Card(
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: DfColors.brand.withValues(alpha: 0.15),
                                  child: const Icon(Icons.play_arrow, color: DfColors.brandDark),
                                ),
                                title: Text(
                                  v['title']?.toString() ?? 'Tutorial',
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                                ),
                                subtitle: Text(platform.toUpperCase()),
                                trailing: const Icon(Icons.open_in_new),
                                onTap: () => _open(v),
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}

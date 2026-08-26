import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

/// Extracts a playable embed URL from tutorial embed HTML / raw URL.
String? tutorialPlayUrl(String? embedOrUrl, {bool autoplayMuted = true}) {
  if (embedOrUrl == null || embedOrUrl.trim().isEmpty) return null;
  final s = embedOrUrl.trim();
  String? raw;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    raw = s;
  } else {
    final src = RegExp(r'''src=["']([^"']+)["']''', caseSensitive: false).firstMatch(s);
    raw = src?.group(1);
    if (raw == null) {
      final vimeo = RegExp(r'vimeo\.com/(?:video/)?(\d+)').firstMatch(s);
      if (vimeo != null) raw = 'https://player.vimeo.com/video/${vimeo.group(1)}';
      final yt = RegExp(r'(?:youtube\.com/embed/|youtu\.be/)([A-Za-z0-9_-]+)').firstMatch(s);
      if (yt != null) raw = 'https://www.youtube.com/embed/${yt.group(1)}';
    }
  }
  if (raw == null) return null;
  final uri = Uri.tryParse(raw);
  if (uri == null) return raw;
  final q = Map<String, String>.from(uri.queryParameters);
  if (uri.host.contains('vimeo')) {
    q['playsinline'] = '1';
    q['autoplay'] = autoplayMuted ? '1' : '0';
    q['muted'] = autoplayMuted ? '1' : '0';
    q['loop'] = '1';
    q['title'] = '0';
    q['byline'] = '0';
    q['portrait'] = '0';
    q['dnt'] = '1';
  } else if (uri.host.contains('youtube')) {
    q['autoplay'] = autoplayMuted ? '1' : '0';
    q['mute'] = autoplayMuted ? '1' : '0';
    q['playsinline'] = '1';
    q['rel'] = '0';
    q['modestbranding'] = '1';
  }
  return uri.replace(queryParameters: q).toString();
}

class TutorialsScreen extends StatefulWidget {
  const TutorialsScreen({super.key});

  @override
  State<TutorialsScreen> createState() => _TutorialsScreenState();
}

class _TutorialsScreenState extends State<TutorialsScreen> {
  static const _soundKey = 'tutorial_sound_enabled';

  List<Map<String, dynamic>> _videos = [];
  bool _loading = true;
  String? _error;
  int _active = 0;
  bool _soundEnabled = false;
  bool _showSoundPrompt = true;
  bool _commentsOpen = false;
  bool _showSwipeHint = true;
  final _pageController = PageController();
  final _commentCtrl = TextEditingController();
  List<Map<String, dynamic>> _comments = [];
  bool _loadingComments = false;
  bool _postingComment = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _boot() async {
    final prefs = await SharedPreferences.getInstance();
    _soundEnabled = prefs.getString(_soundKey) == '1';
    _showSoundPrompt = !_soundEnabled;
    await _load();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showSwipeHint = false);
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getTutorials(forceRefresh: true);
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

  Future<void> _enableSound() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_soundKey, '1');
    setState(() {
      _soundEnabled = true;
      _showSoundPrompt = false;
    });
  }

  Future<void> _openComments() async {
    if (_videos.isEmpty) return;
    final id = _videos[_active]['id']?.toString();
    if (id == null) return;
    setState(() {
      _commentsOpen = true;
      _loadingComments = true;
    });
    try {
      final data = await ApiClient.instance.getTutorialComments(id);
      final list = data['comments'];
      setState(() {
        _comments = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } catch (_) {
      setState(() => _comments = []);
    } finally {
      if (mounted) setState(() => _loadingComments = false);
    }
  }

  Future<void> _postComment() async {
    final text = _commentCtrl.text.trim();
    final id = _videos[_active]['id']?.toString();
    if (text.isEmpty || id == null) return;
    setState(() => _postingComment = true);
    try {
      await ApiClient.instance.postTutorialComment(videoId: id, content: text);
      _commentCtrl.clear();
      await _openComments();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _postingComment = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Video Tutorials')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _load, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }
    if (_videos.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Video Tutorials')),
        body: const Center(child: Text('No tutorials yet', style: TextStyle(color: DfColors.muted))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: _videos.length,
            onPageChanged: (i) {
              setState(() {
                _active = i;
                _commentsOpen = false;
              });
            },
            itemBuilder: (context, index) {
              // Mount active ± 1 for smoother feel
              if ((index - _active).abs() > 1) {
                return const ColoredBox(color: Colors.black);
              }
              final video = _videos[index];
              final url = tutorialPlayUrl(
                video['embed_code']?.toString(),
                autoplayMuted: index == _active,
              );
              return _TutorialSlide(
                key: ValueKey('${video['id']}_$index$_soundEnabled'),
                title: video['title']?.toString() ?? 'Tutorial',
                playUrl: url,
                active: index == _active,
                soundEnabled: _soundEnabled,
                onOpenComments: _openComments,
              );
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  Expanded(
                    child: Text(
                      'Video Tutorials',
                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                  ),
                  Text(
                    '${_active + 1}/${_videos.length}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          if (_showSwipeHint)
            const Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  Icon(Icons.keyboard_arrow_up, color: Colors.white70),
                  Text('Swipe up for next', style: TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
          if (_showSoundPrompt)
            Positioned.fill(
              child: Material(
                color: Colors.black54,
                child: Center(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                    onPressed: _enableSound,
                    icon: const Icon(Icons.volume_up_rounded),
                    label: const Text('Tap for sound'),
                  ),
                ),
              ),
            ),
          if (_commentsOpen)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: MediaQuery.of(context).size.height * 0.55,
              child: Material(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                child: Column(
                  children: [
                    ListTile(
                      title: Text('Comments', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                      trailing: IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() => _commentsOpen = false),
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: _loadingComments
                          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
                          : _comments.isEmpty
                              ? const Center(child: Text('No comments yet', style: TextStyle(color: DfColors.muted)))
                              : ListView.builder(
                                  padding: const EdgeInsets.all(12),
                                  itemCount: _comments.length,
                                  itemBuilder: (_, i) {
                                    final c = _comments[i];
                                    return ListTile(
                                      dense: true,
                                      title: Text(
                                        c['agent_name']?.toString() ?? 'Agent',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13),
                                      ),
                                      subtitle: Text(c['content']?.toString() ?? ''),
                                    );
                                  },
                                ),
                    ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _commentCtrl,
                                decoration: const InputDecoration(hintText: 'Add a comment…', isDense: true),
                              ),
                            ),
                            IconButton(
                              onPressed: _postingComment ? null : _postComment,
                              icon: _postingComment
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                                    )
                                  : const Icon(Icons.send_rounded, color: DfColors.brand),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _TutorialSlide extends StatefulWidget {
  const _TutorialSlide({
    super.key,
    required this.title,
    required this.playUrl,
    required this.active,
    required this.soundEnabled,
    required this.onOpenComments,
  });

  final String title;
  final String? playUrl;
  final bool active;
  final bool soundEnabled;
  final VoidCallback onOpenComments;

  @override
  State<_TutorialSlide> createState() => _TutorialSlideState();
}

class _TutorialSlideState extends State<_TutorialSlide> {
  WebViewController? _controller;

  @override
  void initState() {
    super.initState();
    _initWeb();
  }

  @override
  void didUpdateWidget(covariant _TutorialSlide oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.soundEnabled != widget.soundEnabled || oldWidget.playUrl != widget.playUrl) {
      _initWeb();
    }
  }

  void _initWeb() {
    final url = widget.playUrl;
    if (url == null) {
      _controller = null;
      return;
    }
    final playUrl = tutorialPlayUrl(url, autoplayMuted: !widget.soundEnabled) ?? url;
    final html = '''
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}
iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
</style></head><body>
<iframe src="$playUrl" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
 allowfullscreen></iframe>
</body></html>''';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..loadHtmlString(html, baseUrl: 'https://www.dataflexghana.com');
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (_controller != null && widget.active)
          WebViewWidget(controller: _controller!)
        else
          const ColoredBox(color: Colors.black),
        Positioned(
          left: 16,
          right: 72,
          bottom: 36,
          child: Text(
            widget.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 18,
              shadows: const [Shadow(blurRadius: 8, color: Colors.black)],
            ),
          ),
        ),
        Positioned(
          right: 12,
          bottom: 48,
          child: Column(
            children: [
              IconButton(
                onPressed: widget.onOpenComments,
                icon: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 30),
              ),
              const Text('Comments', style: TextStyle(color: Colors.white70, fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }
}

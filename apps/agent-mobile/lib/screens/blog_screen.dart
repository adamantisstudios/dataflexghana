import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/blog_api.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

final _blogDate = DateFormat('d MMM yyyy');

String? _cleanText(Object? value) {
  final s = value?.toString().trim() ?? '';
  return s.isEmpty || s == 'null' ? null : s;
}

String _formatDate(Object? raw) {
  final date = DateTime.tryParse(_cleanText(raw) ?? '');
  if (date == null) return '';
  return _blogDate.format(date.toLocal());
}

Color _categoryColor(Object? raw) {
  final hex = (_cleanText(raw) ?? '').replaceAll('#', '');
  if (hex.length == 6) {
    final value = int.tryParse(hex, radix: 16);
    if (value != null) return Color(0xFF000000 | value);
  }
  return DfColors.brand;
}

List<Map<String, dynamic>> _mapList(Object? raw) {
  if (raw is! List) return <Map<String, dynamic>>[];
  return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}

Future<void> _openUrl(BuildContext context, String? url) async {
  var raw = _cleanText(url);
  if (raw == null) return;
  if (!raw.contains(':')) raw = 'https://$raw';
  final uri = Uri.tryParse(raw);
  if (uri == null) return;
  final messenger = ScaffoldMessenger.of(context);
  try {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) throw Exception('no handler');
  } catch (_) {
    messenger.showSnackBar(SnackBar(content: Text('Could not open $raw')));
  }
}

// ── List screen ─────────────────────────────────────────────────────────────

class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> {
  final _search = TextEditingController();
  String _category = 'all';
  List<Map<String, dynamic>> _posts = [];
  List<Map<String, dynamic>> _categories = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await BlogApi.instance.listPosts(
        search: _search.text,
        category: _category,
        page: _page,
        forceRefresh: force,
      );
      if (!mounted) return;
      final pagination = data['pagination'];
      var totalPages = 1;
      if (pagination is Map && pagination['totalPages'] is num) {
        totalPages = (pagination['totalPages'] as num).toInt().clamp(1, 999);
      }
      setState(() {
        _posts = _mapList(data['posts']);
        _categories = _mapList(data['categories']);
        _totalPages = totalPages;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onFilter(String slug) {
    setState(() {
      _category = slug;
      _page = 1;
    });
    _load(force: true);
  }

  void _onSearch() {
    setState(() => _page = 1);
    _load(force: true);
  }

  void _goToPage(int page) {
    setState(() => _page = page);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final chips = <(String, String)>[
      ('all', 'All Posts'),
      for (final c in _categories)
        (_cleanText(c['slug']) ?? '', _cleanText(c['name']) ?? 'Category'),
    ].where((e) => e.$1.isNotEmpty).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Blog'),
        actions: [
          IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search articles…',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(onPressed: _onSearch, icon: const Icon(Icons.arrow_forward)),
              ),
              onSubmitted: (_) => _onSearch(),
            ),
          ),
          if (chips.length > 1)
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: chips.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final (slug, label) = chips[i];
                  return FilterChip(
                    label: Text(label),
                    selected: _category == slug,
                    onSelected: (_) => _onFilter(slug),
                    selectedColor: DfColors.brand.withValues(alpha: 0.2),
                    checkmarkColor: DfColors.brandDark,
                  );
                },
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
                : _error != null
                    ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
                    : RefreshIndicator(
                        onRefresh: () => _load(force: true),
                        color: DfColors.brand,
                        child: _posts.isEmpty
                            ? ListView(
                                children: const [
                                  SizedBox(height: 80),
                                  Center(
                                    child: Text(
                                      'No articles match your search.',
                                      style: TextStyle(color: DfColors.muted),
                                    ),
                                  ),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: _posts.length + 1,
                                separatorBuilder: (_, _) => const SizedBox(height: 12),
                                itemBuilder: (context, i) {
                                  if (i == _posts.length) return _pager();
                                  final post = _posts[i];
                                  return _BlogCard(
                                    post: post,
                                    onTap: () {
                                      final slug = _cleanText(post['slug']);
                                      if (slug == null) return;
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => BlogDetailScreen(slug: slug),
                                        ),
                                      );
                                    },
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _pager() {
    if (_totalPages <= 1) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          OutlinedButton.icon(
            onPressed: _page <= 1 ? null : () => _goToPage(_page - 1),
            icon: const Icon(Icons.chevron_left, size: 18),
            label: const Text('Previous'),
          ),
          Text(
            'Page $_page / $_totalPages',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
          OutlinedButton.icon(
            onPressed: _page >= _totalPages ? null : () => _goToPage(_page + 1),
            icon: const Icon(Icons.chevron_right, size: 18),
            label: const Text('Next'),
          ),
        ],
      ),
    );
  }
}

class _BlogCard extends StatelessWidget {
  const _BlogCard({required this.post, required this.onTap});
  final Map<String, dynamic> post;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = DisplayFormat.resolveImageUrl(_cleanText(post['featured_image_url']));
    final title = _cleanText(post['title']) ?? 'Untitled post';
    final excerpt = _cleanText(post['excerpt']);
    final date = _formatDate(post['published_at']);
    final readingTime = post['reading_time'];
    final category = post['category'] is Map ? Map<String, dynamic>.from(post['category'] as Map) : null;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: DfColors.brand.withValues(alpha: 0.12)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (image.isNotEmpty)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                  child: CachedNetworkImage(
                    imageUrl: image,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => _imageFallback(),
                    placeholder: (_, _) => _imageFallback(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (category != null && _cleanText(category['name']) != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _CategoryPill(category: category),
                      ),
                    Text(
                      title,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                    if (excerpt != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        excerpt,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, color: DfColors.muted, height: 1.4),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.event_outlined, size: 14, color: DfColors.muted),
                        const SizedBox(width: 4),
                        Text(
                          date.isEmpty ? 'Unpublished' : date,
                          style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                        ),
                        if (readingTime is num) ...[
                          const SizedBox(width: 12),
                          const Icon(Icons.schedule, size: 14, color: DfColors.muted),
                          const SizedBox(width: 4),
                          Text(
                            '${readingTime.toInt()} min read',
                            style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                          ),
                        ],
                        const Spacer(),
                        const Icon(Icons.chevron_right, color: DfColors.muted),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _imageFallback() => Container(
        height: 160,
        color: DfColors.brand.withValues(alpha: 0.1),
        child: const Center(child: Icon(Icons.article_outlined, color: DfColors.brand, size: 32)),
      );
}

class _CategoryPill extends StatelessWidget {
  const _CategoryPill({required this.category});
  final Map<String, dynamic> category;

  @override
  Widget build(BuildContext context) {
    final color = _categoryColor(category['color']);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        _cleanText(category['name']) ?? 'Category',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

// ── Detail screen ───────────────────────────────────────────────────────────

class BlogDetailScreen extends StatefulWidget {
  const BlogDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  Map<String, dynamic>? _post;
  List<Map<String, dynamic>> _related = [];
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
      final data = await BlogApi.instance.getPost(widget.slug);
      final post = data['post'];
      if (post is! Map) throw ApiException('Post not found');
      if (!mounted) return;
      setState(() {
        _post = Map<String, dynamic>.from(post);
        _related = _mapList(data['related']);
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Article'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : _post == null
                  ? const Center(child: Text('Post not found'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: DfColors.brand,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: _buildBody(_post!),
                      ),
                    ),
    );
  }

  List<Widget> _buildBody(Map<String, dynamic> post) {
    final image = DisplayFormat.resolveImageUrl(_cleanText(post['featured_image_url']));
    final title = _cleanText(post['title']) ?? 'Untitled post';
    final date = _formatDate(post['published_at']);
    final readingTime = post['reading_time'];
    final views = post['views_count'];
    final category = post['category'] is Map ? Map<String, dynamic>.from(post['category'] as Map) : null;
    final tags = (post['tags'] is List)
        ? (post['tags'] as List).map(_cleanText).whereType<String>().toList()
        : <String>[];

    return [
      if (image.isNotEmpty)
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: CachedNetworkImage(
            imageUrl: image,
            height: 200,
            width: double.infinity,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => const SizedBox.shrink(),
            placeholder: (_, _) => Container(
              height: 200,
              color: DfColors.brand.withValues(alpha: 0.08),
            ),
          ),
        ),
      if (image.isNotEmpty) const SizedBox(height: 16),
      if (category != null && _cleanText(category['name']) != null) ...[
        _CategoryPill(category: category),
        const SizedBox(height: 8),
      ],
      Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 24, height: 1.25)),
      const SizedBox(height: 10),
      Wrap(
        spacing: 14,
        runSpacing: 6,
        children: [
          if (date.isNotEmpty) _MetaChip(icon: Icons.event_outlined, label: date),
          if (readingTime is num) _MetaChip(icon: Icons.schedule, label: '${readingTime.toInt()} min read'),
          if (views is num) _MetaChip(icon: Icons.visibility_outlined, label: '${views.toInt()} views'),
        ],
      ),
      if (tags.isNotEmpty) ...[
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final tag in tags)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: DfColors.sand,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
                ),
                child: Text(
                  '#$tag',
                  style: const TextStyle(fontSize: 11.5, color: DfColors.brandDark, fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ),
      ],
      const SizedBox(height: 8),
      const Divider(height: 32),
      ..._MarkdownBody.render(context, _cleanText(post['content']) ?? _cleanText(post['excerpt']) ?? ''),
      if (_related.isNotEmpty) ...[
        const Divider(height: 40),
        Text('Related posts', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
        const SizedBox(height: 12),
        for (final rel in _related)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _BlogCard(
              post: rel,
              onTap: () {
                final slug = _cleanText(rel['slug']);
                if (slug == null) return;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => BlogDetailScreen(slug: slug)),
                );
              },
            ),
          ),
      ],
      const SizedBox(height: 24),
    ];
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: DfColors.muted),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
      ],
    );
  }
}

// ── Minimal markdown renderer ───────────────────────────────────────────────

/// Renders the subset of Markdown the admin blog editor produces. Raw HTML tags
/// are stripped rather than rendered so untrusted markup can never leak through.
class _MarkdownBody {
  static final _htmlTag = RegExp(r'<[^>]+>');
  static final _heading = RegExp(r'^(#{1,3})\s+(.*)$');
  static final _bullet = RegExp(r'^[-*+]\s+(.*)$');
  static final _ordered = RegExp(r'^(\d+)[.)]\s+(.*)$');
  static final _quote = RegExp(r'^>\s?(.*)$');
  static final _rule = RegExp(r'^(-{3,}|\*{3,}|_{3,})$');
  static final _image = RegExp(r'^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)$');
  static final _inline = RegExp(
    r'\[([^\]]+)\]\(([^)\s]+)[^)]*\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`',
  );

  static List<Widget> render(BuildContext context, String markdown) {
    if (markdown.trim().isEmpty) {
      return const [Text('No content available.', style: TextStyle(color: DfColors.muted))];
    }

    final widgets = <Widget>[];
    final lines = markdown.replaceAll('\r\n', '\n').split('\n');
    final paragraph = <String>[];

    void flushParagraph() {
      if (paragraph.isEmpty) return;
      final text = paragraph.join(' ').trim();
      paragraph.clear();
      if (text.isEmpty) return;
      widgets.add(Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: _richText(context, text, const TextStyle(fontSize: 15, height: 1.6)),
      ));
    }

    var i = 0;
    while (i < lines.length) {
      final raw = lines[i];
      final line = _strip(raw).trimRight();
      final trimmed = line.trim();

      if (raw.trimLeft().startsWith('```')) {
        flushParagraph();
        final code = <String>[];
        i++;
        while (i < lines.length && !lines[i].trimLeft().startsWith('```')) {
          code.add(lines[i]);
          i++;
        }
        i++;
        widgets.add(_codeBlock(code.join('\n')));
        continue;
      }

      if (trimmed.isEmpty) {
        flushParagraph();
        i++;
        continue;
      }

      if (_rule.hasMatch(trimmed)) {
        flushParagraph();
        widgets.add(const Divider(height: 28));
        i++;
        continue;
      }

      final imageMatch = _image.firstMatch(trimmed);
      if (imageMatch != null) {
        flushParagraph();
        widgets.add(_inlineImage(imageMatch.group(2) ?? ''));
        i++;
        continue;
      }

      final headingMatch = _heading.firstMatch(trimmed);
      if (headingMatch != null) {
        flushParagraph();
        final level = headingMatch.group(1)!.length;
        final size = level == 1 ? 22.0 : (level == 2 ? 19.0 : 16.5);
        widgets.add(Padding(
          padding: EdgeInsets.only(top: level == 1 ? 8 : 12, bottom: 8),
          child: _richText(
            context,
            headingMatch.group(2) ?? '',
            GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: size, height: 1.3),
          ),
        ));
        i++;
        continue;
      }

      final quoteMatch = _quote.firstMatch(trimmed);
      if (quoteMatch != null) {
        flushParagraph();
        final quoted = <String>[quoteMatch.group(1) ?? ''];
        i++;
        while (i < lines.length) {
          final next = _strip(lines[i]).trim();
          final m = _quote.firstMatch(next);
          if (m == null) break;
          quoted.add(m.group(1) ?? '');
          i++;
        }
        widgets.add(_blockquote(context, quoted.join(' ').trim()));
        continue;
      }

      if (_bullet.hasMatch(trimmed) || _ordered.hasMatch(trimmed)) {
        flushParagraph();
        final items = <(String, String)>[];
        while (i < lines.length) {
          final next = _strip(lines[i]).trim();
          final bullet = _bullet.firstMatch(next);
          final ordered = _ordered.firstMatch(next);
          if (bullet != null) {
            items.add(('•', bullet.group(1) ?? ''));
          } else if (ordered != null) {
            items.add(('${ordered.group(1)}.', ordered.group(2) ?? ''));
          } else {
            break;
          }
          i++;
        }
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final (marker, text) in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 26,
                        child: Text(
                          marker,
                          style: const TextStyle(
                            fontSize: 15,
                            height: 1.6,
                            fontWeight: FontWeight.w700,
                            color: DfColors.brandDark,
                          ),
                        ),
                      ),
                      Expanded(
                        child: _richText(
                          context,
                          text,
                          const TextStyle(fontSize: 15, height: 1.6),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ));
        continue;
      }

      paragraph.add(trimmed);
      i++;
    }

    flushParagraph();
    return widgets;
  }

  static String _strip(String input) => input.replaceAll(_htmlTag, '').replaceAll('&nbsp;', ' ');

  static Widget _codeBlock(String code) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: DfColors.ink.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: DfColors.ink.withValues(alpha: 0.12)),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Text(
            code,
            style: const TextStyle(fontFamily: 'monospace', fontSize: 13, height: 1.5),
          ),
        ),
      );

  static Widget _blockquote(BuildContext context, String text) => Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.fromLTRB(14, 10, 12, 10),
        decoration: BoxDecoration(
          color: DfColors.brand.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: DfColors.brand, width: 4)),
        ),
        child: _richText(
          context,
          text,
          const TextStyle(fontSize: 15, height: 1.6, fontStyle: FontStyle.italic, color: DfColors.brandDark),
        ),
      );

  static Widget _inlineImage(String url) {
    final resolved = DisplayFormat.resolveImageUrl(url);
    if (resolved.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: CachedNetworkImage(
          imageUrl: resolved,
          width: double.infinity,
          fit: BoxFit.cover,
          errorWidget: (_, _, _) => const SizedBox.shrink(),
          placeholder: (_, _) => Container(height: 160, color: DfColors.brand.withValues(alpha: 0.08)),
        ),
      ),
    );
  }

  static Widget _richText(BuildContext context, String text, TextStyle base) {
    return Text.rich(
      TextSpan(style: base, children: _spans(context, text, base)),
    );
  }

  static List<InlineSpan> _spans(BuildContext context, String text, TextStyle base) {
    final spans = <InlineSpan>[];
    var index = 0;
    for (final match in _inline.allMatches(text)) {
      if (match.start > index) {
        spans.add(TextSpan(text: text.substring(index, match.start)));
      }
      index = match.end;

      final linkLabel = match.group(1);
      if (linkLabel != null) {
        final href = match.group(2) ?? '';
        spans.add(TextSpan(
          text: linkLabel,
          style: base.merge(const TextStyle(
            color: DfColors.brand,
            fontWeight: FontWeight.w600,
            decoration: TextDecoration.underline,
          )),
          recognizer: TapGestureRecognizer()..onTap = () => _openUrl(context, href),
        ));
        continue;
      }

      final bold = match.group(3) ?? match.group(4);
      if (bold != null) {
        spans.add(TextSpan(text: bold, style: base.merge(const TextStyle(fontWeight: FontWeight.w800))));
        continue;
      }

      final italic = match.group(5) ?? match.group(6);
      if (italic != null) {
        spans.add(TextSpan(text: italic, style: base.merge(const TextStyle(fontStyle: FontStyle.italic))));
        continue;
      }

      final code = match.group(7);
      if (code != null) {
        spans.add(TextSpan(
          text: code,
          style: base.merge(const TextStyle(fontFamily: 'monospace', backgroundColor: Color(0x14000000))),
        ));
      }
    }
    if (index < text.length) {
      spans.add(TextSpan(text: text.substring(index)));
    }
    return spans;
  }
}

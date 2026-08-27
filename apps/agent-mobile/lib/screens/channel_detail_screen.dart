import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/channels_api.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

/// In-app member view of a DataFlex teaching channel: feed, Q&A, videos, audio.
/// Backed by /api/agent/mobile/channels/[channelId]/feed.
class ChannelDetailScreen extends StatefulWidget {
  const ChannelDetailScreen({
    super.key,
    required this.channelId,
    this.channelName,
    this.imageUrl,
    this.onJoinRequested,
  });

  final String channelId;
  final String? channelName;
  final String? imageUrl;

  /// Called when a non-member taps the join call-to-action.
  final Future<void> Function()? onJoinRequested;

  @override
  State<ChannelDetailScreen> createState() => _ChannelDetailScreenState();
}

class _ChannelDetailScreenState extends State<ChannelDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  Map<String, dynamic> _channel = {};
  Map<String, dynamic> _membership = {};
  List<Map<String, dynamic>> _posts = [];
  List<Map<String, dynamic>> _qa = [];
  List<Map<String, dynamic>> _videos = [];
  List<Map<String, dynamic>> _audio = [];
  List<Map<String, dynamic>> _pinned = [];

  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  int _page = 1;
  String? _error;
  bool _needsJoin = false;

  final _dateFmt = DateFormat('d MMM yyyy · h:mm a');
  final _busy = <String>{};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _tabs.addListener(() => setState(() {}));
    if (widget.channelName != null) {
      _channel = {'name': widget.channelName, 'image_url': widget.imageUrl};
    }
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _list(Object? raw) {
    if (raw is List) {
      return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<void> _load({bool forceRefresh = false}) async {
    setState(() {
      _loading = true;
      _error = null;
      _needsJoin = false;
      _page = 1;
    });
    try {
      final data = await ChannelsApi.instance.feed(
        widget.channelId,
        page: 1,
        forceRefresh: forceRefresh,
      );
      if (!mounted) return;
      setState(() {
        if (data['channel'] is Map) _channel = Map<String, dynamic>.from(data['channel'] as Map);
        if (data['membership'] is Map) _membership = Map<String, dynamic>.from(data['membership'] as Map);
        _posts = _list(data['posts']);
        _qa = _list(data['qa']);
        _videos = _list(data['videos']);
        _audio = _list(data['audio']);
        _pinned = _list(data['pinned']);
        final pagination = data['pagination'];
        _hasMore = pagination is Map && pagination['hasMore'] == true;
      });
    } on ChannelAccessException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _needsJoin = e.requiresJoin;
        if (e.channel != null) _channel = e.channel!;
        if (e.membership != null) _membership = e.membership!;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final data = await ChannelsApi.instance.feed(
        widget.channelId,
        page: _page + 1,
        forceRefresh: true,
      );
      if (!mounted) return;
      setState(() {
        _page += 1;
        _posts = [..._posts, ..._list(data['posts'])];
        final pagination = data['pagination'];
        _hasMore = pagination is Map && pagination['hasMore'] == true;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _replaceItem(Map<String, dynamic> updated) {
    bool matches(Map<String, dynamic> m) =>
        m['id'] == updated['id'] && m['type'] == updated['type'];
    _posts = _posts.map((m) => matches(m) ? updated : m).toList();
    _qa = _qa.map((m) => matches(m) ? updated : m).toList();
    _videos = _videos.map((m) => matches(m) ? updated : m).toList();
    _pinned = _pinned.map((m) => matches(m) ? updated : m).toList();
  }

  /// Optimistic like/save toggle — reverted if the request fails.
  Future<void> _toggle(Map<String, dynamic> item, {required bool isLike}) async {
    final id = item['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final key = '${isLike ? 'like' : 'save'}:$id';
    if (_busy.contains(key)) return;

    final field = isLike ? 'liked_by_me' : 'saved_by_me';
    final was = item[field] == true;
    final likeCount = item['like_count'] is num ? (item['like_count'] as num).toInt() : 0;

    final optimistic = {
      ...item,
      field: !was,
      if (isLike) 'like_count': (was ? likeCount - 1 : likeCount + 1).clamp(0, 1 << 30),
    };

    setState(() {
      _busy.add(key);
      _replaceItem(optimistic);
    });

    final postType = item['type']?.toString() == 'qa' ? 'qa' : (item['type']?.toString() ?? 'post');
    try {
      if (isLike) {
        was
            ? await ChannelsApi.instance.unlike(widget.channelId, id, postType: postType)
            : await ChannelsApi.instance.like(widget.channelId, id, postType: postType);
      } else {
        was
            ? await ChannelsApi.instance.unsave(widget.channelId, id, postType: postType)
            : await ChannelsApi.instance.save(widget.channelId, id, postType: postType);
      }
      await ChannelsApi.instance.invalidateFeed(widget.channelId);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _replaceItem(item));
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy.remove(key));
    }
  }

  Future<void> _openUrl(String? raw) async {
    final url = (raw ?? '').trim();
    if (url.isEmpty) return;
    final resolved = url.startsWith('http')
        ? url
        : '${await SessionStore.instance.getBaseUrl()}$url';
    final uri = Uri.tryParse(resolved);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String _when(Object? raw) {
    final parsed = DateTime.tryParse(raw?.toString() ?? '');
    if (parsed == null) return 'Recently';
    return _dateFmt.format(parsed.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final name = _channel['name']?.toString() ?? widget.channelName ?? 'Channel';
    return Scaffold(
      appBar: AppBar(
        title: Text(name, overflow: TextOverflow.ellipsis),
        bottom: _needsJoin || _loading
            ? null
            : TabBar(
                controller: _tabs,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(text: 'Feed'),
                  Tab(text: 'Q&A'),
                  Tab(text: 'Videos'),
                  Tab(text: 'Audio'),
                ],
              ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _needsJoin
              ? _buildJoinGate()
              : _error != null
                  ? _buildError()
                  : Column(
                      children: [
                        _buildHeader(),
                        Expanded(
                          child: TabBarView(
                            controller: _tabs,
                            children: [
                              _buildFeedTab(),
                              _buildQaTab(),
                              _buildVideosTab(),
                              _buildAudioTab(),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildError() {
    return RefreshIndicator(
      onRefresh: () => _load(forceRefresh: true),
      color: DfColors.brand,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 40),
          const Icon(Icons.error_outline, color: DfColors.danger, size: 40),
          const SizedBox(height: 12),
          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
          const SizedBox(height: 16),
          Center(
            child: OutlinedButton(
              onPressed: () => _load(forceRefresh: true),
              child: const Text('Try again'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinGate() {
    final expired = _membership['status']?.toString() == 'expired';
    final fee = _membership['subscription_fee'];
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const SizedBox(height: 24),
        Center(child: _channelAvatar(size: 96)),
        const SizedBox(height: 16),
        Text(
          _channel['name']?.toString() ?? widget.channelName ?? 'Channel',
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Text(
          _error ?? 'Join this channel to read its lessons, quizzes and lectures.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: DfColors.muted, height: 1.5),
        ),
        if (fee is num) ...[
          const SizedBox(height: 12),
          Center(
            child: Chip(
              label: Text('${DisplayFormat.money(fee)} / month'),
              backgroundColor: DfColors.sand,
            ),
          ),
        ],
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () async {
            if (widget.onJoinRequested != null) {
              await widget.onJoinRequested!.call();
              if (!mounted) return;
              await _load(forceRefresh: true);
            } else if (mounted) {
              Navigator.pop(context, 'join');
            }
          },
          icon: Icon(expired ? Icons.autorenew : Icons.person_add_alt),
          label: Text(expired ? 'Renew membership' : 'Request to join'),
          style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: () => _load(forceRefresh: true),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(46)),
          child: const Text('I already joined — refresh'),
        ),
      ],
    );
  }

  Widget _channelAvatar({double size = 64}) {
    final img = DisplayFormat.resolveImageUrl(
      _channel['image_url']?.toString() ?? widget.imageUrl,
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(size / 2),
      child: img.isEmpty
          ? Container(
              width: size,
              height: size,
              color: DfColors.sand,
              child: const Icon(Icons.podcasts, color: DfColors.brand),
            )
          : CachedNetworkImage(imageUrl: img, width: size, height: size, fit: BoxFit.cover),
    );
  }

  Widget _buildHeader() {
    final status = _membership['status']?.toString() ?? 'active';
    final days = _membership['days_until_expiry'];
    final memberCount = _membership['member_count'] ?? _channel['member_count'] ?? 0;
    final expiresAt = DateTime.tryParse(_membership['subscription_expires_at']?.toString() ?? '');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: const BoxDecoration(
        color: DfColors.card,
        border: Border(bottom: BorderSide(color: Color(0x14000000))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _channelAvatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _channel['name']?.toString() ?? 'Channel',
                  style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                if ((_channel['description']?.toString() ?? '').isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      _channel['description'].toString(),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: DfColors.muted),
                    ),
                  ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _pill('$memberCount members', Icons.group_outlined),
                    _pill(
                      status == 'active' ? 'Active member' : status,
                      status == 'active' ? Icons.verified_outlined : Icons.info_outline,
                      color: status == 'active' ? DfColors.brand : DfColors.danger,
                    ),
                    if (_channel['is_official'] == true) _pill('Official', Icons.workspace_premium_outlined),
                    if (expiresAt != null)
                      _pill(
                        days is num && days <= 7
                            ? 'Expires in ${days.toInt()} days'
                            : 'Renews ${DateFormat('d MMM').format(expiresAt.toLocal())}',
                        Icons.event_outlined,
                        color: days is num && days <= 7 ? DfColors.danger : null,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String label, IconData icon, {Color? color}) {
    final c = color ?? DfColors.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c)),
        ],
      ),
    );
  }

  Widget _empty(String message, IconData icon) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 60),
        Icon(icon, size: 40, color: DfColors.muted),
        const SizedBox(height: 10),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.muted)),
      ],
    );
  }

  Widget _buildFeedTab() {
    final items = _posts;
    return RefreshIndicator(
      onRefresh: () => _load(forceRefresh: true),
      color: DfColors.brand,
      child: items.isEmpty
          ? _empty('No posts yet. Check back soon!', Icons.forum_outlined)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
              itemCount: items.length + (_pinned.isNotEmpty ? 1 : 0) + (_hasMore ? 1 : 0),
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                var i = index;
                if (_pinned.isNotEmpty) {
                  if (i == 0) return _buildPinnedStrip();
                  i -= 1;
                }
                if (i >= items.length) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Center(
                      child: _loadingMore
                          ? const CircularProgressIndicator(color: DfColors.brand)
                          : OutlinedButton(onPressed: _loadMore, child: const Text('Load more')),
                    ),
                  );
                }
                return _buildPostCard(items[i]);
              },
            ),
    );
  }

  Widget _buildPinnedStrip() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: DfColors.sand,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.push_pin_outlined, size: 15, color: DfColors.brandDark),
              const SizedBox(width: 6),
              Text('Pinned', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 6),
          ..._pinned.take(3).map(
                (p) => Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '• ${p['title']?.toString() ?? 'Post'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12.5, color: DfColors.ink),
                  ),
                ),
              ),
        ],
      ),
    );
  }

  Widget _buildQaTab() {
    return RefreshIndicator(
      onRefresh: () => _load(forceRefresh: true),
      color: DfColors.brand,
      child: _qa.isEmpty
          ? _empty('No quizzes posted yet.', Icons.quiz_outlined)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
              itemCount: _qa.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _buildQaCard(_qa[i]),
            ),
    );
  }

  Widget _buildVideosTab() {
    return RefreshIndicator(
      onRefresh: () => _load(forceRefresh: true),
      color: DfColors.brand,
      child: _videos.isEmpty
          ? _empty('No videos yet.', Icons.play_circle_outline)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
              itemCount: _videos.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _buildVideoCard(_videos[i]),
            ),
    );
  }

  Widget _buildAudioTab() {
    return RefreshIndicator(
      onRefresh: () => _load(forceRefresh: true),
      color: DfColors.brand,
      child: _audio.isEmpty
          ? _empty('No audio lectures yet.', Icons.headphones_outlined)
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
              itemCount: _audio.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final a = _audio[i];
                final duration = a['duration'];
                return Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: DfColors.sand,
                      child: Icon(Icons.headphones, color: DfColors.brand),
                    ),
                    title: Text(
                      a['title']?.toString() ?? 'Lecture',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Text(
                      [
                        _when(a['created_at']),
                        if (duration is num && duration > 0) _formatDuration(duration.toInt()),
                      ].join(' · '),
                      style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.play_arrow_rounded, color: DfColors.brand),
                      onPressed: () => _openUrl(
                        a['stream_url']?.toString() ?? a['audio_url']?.toString(),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  Widget _cardShell({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x14000000)),
      ),
      child: child,
    );
  }

  Widget _cardHeader(Map<String, dynamic> item, {String? badge, Color? badgeColor}) {
    final author = item['author_name']?.toString() ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                item['title']?.toString().isNotEmpty == true ? item['title'].toString() : 'Update',
                style: GoogleFonts.outfit(fontSize: 15.5, fontWeight: FontWeight.w700),
              ),
            ),
            if (badge != null && badge.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (badgeColor ?? DfColors.brand).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: badgeColor ?? DfColors.brand,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          [_when(item['created_at']), if (author.isNotEmpty) 'By $author'].join(' · '),
          style: const TextStyle(fontSize: 11, color: DfColors.muted),
        ),
      ],
    );
  }

  Widget _buildPostCard(Map<String, dynamic> item) {
    final type = item['type']?.toString() ?? 'post';
    if (type == 'youtube' || type == 'video' || type == 'embed') {
      return _buildVideoCard(item);
    }
    if (type == 'qa') return _buildQaCard(item);

    final body = item['body']?.toString() ?? '';
    final media = _list(item['media']);
    final images = media.where((m) => m['media_type']?.toString() == 'image').toList();
    final others = media.where((m) => m['media_type']?.toString() != 'image').toList();

    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(
            item,
            badge: item['post_type']?.toString(),
            badgeColor: type == 'message' ? DfColors.brandLight : DfColors.brand,
          ),
          if (body.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              _stripHtml(body),
              style: const TextStyle(fontSize: 13.5, height: 1.55, color: DfColors.ink),
            ),
          ],
          if (images.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildGallery(images),
          ],
          for (final m in others)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: OutlinedButton.icon(
                onPressed: () => _openUrl(m['media_url']?.toString()),
                icon: Icon(_mediaIcon(m['media_type']?.toString()), size: 18),
                label: Text(
                  m['file_name']?.toString() ?? 'Open attachment',
                  overflow: TextOverflow.ellipsis,
                ),
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(42)),
              ),
            ),
          const SizedBox(height: 10),
          _buildActions(item),
        ],
      ),
    );
  }

  IconData _mediaIcon(String? type) {
    switch (type) {
      case 'audio':
        return Icons.headphones;
      case 'video':
        return Icons.play_circle_outline;
      default:
        return Icons.description_outlined;
    }
  }

  Widget _buildGallery(List<Map<String, dynamic>> images) {
    if (images.length == 1) {
      return _galleryImage(images.first, height: 200, width: double.infinity);
    }
    return SizedBox(
      height: 140,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) => _galleryImage(images[i], height: 140, width: 180),
      ),
    );
  }

  Widget _galleryImage(Map<String, dynamic> media, {required double height, required double width}) {
    final url = DisplayFormat.resolveImageUrl(media['media_url']?.toString());
    if (url.isEmpty) return const SizedBox.shrink();
    return GestureDetector(
      onTap: () => _openUrl(url),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: url,
          height: height,
          width: width,
          fit: BoxFit.cover,
          errorWidget: (_, __, ___) => Container(
            height: height,
            width: width == double.infinity ? null : width,
            color: DfColors.sand,
            child: const Icon(Icons.broken_image_outlined, color: DfColors.muted),
          ),
        ),
      ),
    );
  }

  Widget _buildVideoCard(Map<String, dynamic> item) {
    final type = item['type']?.toString() ?? 'video';
    final thumb = DisplayFormat.resolveImageUrl(item['thumbnail_url']?.toString());
    final youtubeId = item['youtube_video_id']?.toString() ?? '';
    final poster = thumb.isNotEmpty
        ? thumb
        : youtubeId.isNotEmpty
            ? 'https://img.youtube.com/vi/$youtubeId/hqdefault.jpg'
            : '';
    final playable = item['video_url']?.toString() ?? '';

    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(
            item,
            badge: type == 'embed' ? 'Embedded' : 'Video',
            badgeColor: DfColors.danger,
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: playable.isEmpty ? null : () => _openUrl(playable),
            child: Stack(
              alignment: Alignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: poster.isEmpty
                      ? Container(height: 170, width: double.infinity, color: Colors.black87)
                      : CachedNetworkImage(
                          imageUrl: poster,
                          height: 170,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) =>
                              Container(height: 170, color: Colors.black87),
                        ),
                ),
                if (playable.isNotEmpty)
                  const CircleAvatar(
                    radius: 26,
                    backgroundColor: Colors.black54,
                    child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 32),
                  ),
              ],
            ),
          ),
          if ((item['body']?.toString() ?? '').isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              _stripHtml(item['body'].toString()),
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, height: 1.5, color: DfColors.ink),
            ),
          ],
          if (type == 'embed' && playable.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Embedded from ${item['platform']?.toString() ?? 'the web'} — open on the website to watch.',
                style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
              ),
            ),
          const SizedBox(height: 10),
          _buildActions(item),
        ],
      ),
    );
  }

  Widget _buildQaCard(Map<String, dynamic> item) {
    final qa = item['qa'] is Map ? Map<String, dynamic>.from(item['qa'] as Map) : <String, dynamic>{};
    final options = <String, Object?>{
      'A': qa['option_a'],
      'B': qa['option_b'],
      'C': qa['option_c'],
      'D': qa['option_d'],
      'E': qa['option_e'],
    };
    final revealed = qa['is_revealed'] == true;
    final correct = qa['correct_answer']?.toString();

    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(item, badge: 'Quiz', badgeColor: const Color(0xFF7B4FBF)),
          const SizedBox(height: 10),
          Text(
            _stripHtml(qa['question']?.toString() ?? item['body']?.toString() ?? ''),
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, height: 1.4),
          ),
          const SizedBox(height: 8),
          for (final entry in options.entries)
            if ((entry.value?.toString() ?? '').isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: revealed && correct == entry.key
                        ? DfColors.brand.withValues(alpha: 0.1)
                        : DfColors.sand.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${entry.key}. ${_stripHtml(entry.value!.toString())}',
                    style: const TextStyle(fontSize: 13, color: DfColors.ink),
                  ),
                ),
              ),
          if (revealed && (qa['explanation']?.toString() ?? '').isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              'Answer: ${correct ?? '-'} — ${_stripHtml(qa['explanation'].toString())}',
              style: const TextStyle(fontSize: 12.5, color: DfColors.brandDark, height: 1.5),
            ),
          ] else if (!revealed) ...[
            const SizedBox(height: 10),
            const Text(
              'The answer has not been revealed yet.',
              style: TextStyle(fontSize: 11.5, color: DfColors.muted),
            ),
          ],
          const SizedBox(height: 10),
          _buildActions(item),
        ],
      ),
    );
  }

  Widget _buildActions(Map<String, dynamic> item) {
    final liked = item['liked_by_me'] == true;
    final saved = item['saved_by_me'] == true;
    final likes = item['like_count'] is num ? (item['like_count'] as num).toInt() : 0;
    final views = item['view_count'] is num ? (item['view_count'] as num).toInt() : 0;
    final canInteract = item['type']?.toString() != 'message' && item['type']?.toString() != 'embed';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 1),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.visibility_outlined, size: 14, color: DfColors.muted),
            const SizedBox(width: 4),
            Text('$views', style: const TextStyle(fontSize: 11.5, color: DfColors.muted)),
            const SizedBox(width: 14),
            const Icon(Icons.favorite_outline, size: 14, color: DfColors.muted),
            const SizedBox(width: 4),
            Text('$likes', style: const TextStyle(fontSize: 11.5, color: DfColors.muted)),
            const Spacer(),
            if (canInteract) ...[
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () => _toggle(item, isLike: true),
                icon: Icon(
                  liked ? Icons.favorite : Icons.favorite_border,
                  size: 20,
                  color: liked ? DfColors.danger : DfColors.muted,
                ),
                tooltip: liked ? 'Unlike' : 'Like',
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () => _toggle(item, isLike: false),
                icon: Icon(
                  saved ? Icons.bookmark : Icons.bookmark_border,
                  size: 20,
                  color: saved ? DfColors.brand : DfColors.muted,
                ),
                tooltip: saved ? 'Unsave' : 'Save',
              ),
            ],
          ],
        ),
      ],
    );
  }

  /// Channel bodies are rich text from the web editor; render them as plain text.
  String _stripHtml(String input) {
    return input
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .trim();
  }
}

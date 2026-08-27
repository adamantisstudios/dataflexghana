import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_client.dart';
import 'cache_store.dart';
import 'session_store.dart';

/// Member-facing DataFlex Channels endpoints (feed + interactions).
/// Mirrors the conventions in [ApiClient] and reuses its [ApiException].
class ChannelsApi {
  ChannelsApi._();
  static final instance = ChannelsApi._();

  Future<Uri> _uri(String path, [Map<String, String>? query]) async {
    final base = await SessionStore.instance.getBaseUrl();
    return Uri.parse('$base$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _decode(http.Response res) async {
    Map<String, dynamic> body = {};
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final err = body['error']?.toString() ?? 'Request failed (${res.statusCode})';
    final photoGate = err.toLowerCase().contains('photo verification');
    throw ChannelAccessException(
      err,
      statusCode: res.statusCode,
      photoGate: photoGate,
      code: body['code']?.toString(),
      banned: body['banned'] == true,
      requiresJoin: body['requires_join'] == true,
      channel: body['channel'] is Map ? Map<String, dynamic>.from(body['channel'] as Map) : null,
      membership: body['membership'] is Map ? Map<String, dynamic>.from(body['membership'] as Map) : null,
    );
  }

  /// Aggregated member feed: channel, membership, posts, qa, videos, audio, pinned.
  /// Throws a [ChannelAccessException] with `requiresJoin` set when the caller is
  /// not an active member (HTTP 403).
  Future<Map<String, dynamic>> feed(
    String channelId, {
    int page = 1,
    int limit = 20,
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'channel_feed_${channelId}_$page';
    if (!forceRefresh) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
      if (cached != null) return cached;
    }
    final res = await http.get(
      await _uri('/api/agent/mobile/channels/$channelId/feed', {
        'page': '$page',
        'limit': '$limit',
      }),
      headers: await SessionStore.instance.authHeaders(),
    );
    final data = await _decode(res);
    await CacheStore.instance.putJson(cacheKey, data, ttl: const Duration(minutes: 2));
    return data;
  }

  Future<Map<String, dynamic>> interact({
    required String channelId,
    required String action,
    required String postId,
    String postType = 'post',
  }) async {
    final res = await http.post(
      await _uri('/api/agent/mobile/channels/$channelId/interact'),
      headers: await SessionStore.instance.authHeaders(),
      body: jsonEncode({
        'action': action,
        'post_id': postId,
        'post_type': postType,
      }),
    );
    return _decode(res);
  }

  Future<void> like(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'like', postId: postId, postType: postType).then((_) {});

  Future<void> unlike(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'unlike', postId: postId, postType: postType).then((_) {});

  Future<void> save(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'save', postId: postId, postType: postType).then((_) {});

  Future<void> unsave(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'unsave', postId: postId, postType: postType).then((_) {});

  Future<void> markViewed(String channelId, String postId, {String postType = 'post'}) =>
      interact(channelId: channelId, action: 'view', postId: postId, postType: postType).then((_) {});

  Future<void> invalidateFeed(String channelId) =>
      CacheStore.instance.invalidatePrefix('channel_feed_$channelId');

  // ── Host / channel-admin surface ─────────────────────────────────────────
  //
  // Every endpoint below lives under /api/agent/mobile/channels/[channelId]/
  // and rejects callers who are not the channel teacher, admin, owner or the
  // platform administrator with HTTP 403.

  String _base(String channelId) => '/api/agent/mobile/channels/$channelId';

  /// Creates a channel and makes the caller its teacher. The website currently
  /// limits this to the platform administrator, so ordinary agents get a 403
  /// [ApiException] telling them to contact support.
  Future<Map<String, dynamic>> createChannel({
    required String name,
    String description = '',
    String category = 'General',
    bool isPublic = true,
  }) async =>
      _send('POST', await _uri('/api/agent/channels/create'), body: {
        'name': name,
        'description': description,
        'category': category,
        'is_public': isPublic,
      });

  Future<Map<String, dynamic>> _send(
    String method,
    Uri uri, {
    Map<String, dynamic>? body,
  }) async {
    final headers = await SessionStore.instance.authHeaders();
    final payload = body == null ? null : jsonEncode(body);
    late http.Response res;
    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: headers, body: payload);
      case 'PATCH':
        res = await http.patch(uri, headers: headers, body: payload);
      case 'PUT':
        res = await http.put(uri, headers: headers, body: payload);
      case 'DELETE':
        res = await http.delete(uri, headers: headers, body: payload);
      default:
        res = await http.get(uri, headers: headers);
    }
    return _decode(res);
  }

  /// Aggregated host dashboard: channel settings, stats, members count,
  /// pending requests, posts, messages, quizzes, videos, audio and notes.
  Future<Map<String, dynamic>> hostDashboard(String channelId) async =>
      _send('GET', await _uri('${_base(channelId)}/manage'));

  // ── Channel settings ──

  Future<Map<String, dynamic>> updateChannelSettings(
    String channelId, {
    String? name,
    String? description,
    String? category,
    bool? isActive,
    bool? isPublic,
    int? maxMembers,
  }) async =>
      _send('PATCH', await _uri('${_base(channelId)}/manage'), body: {
        'name': ?name,
        'description': ?description,
        'category': ?category,
        'is_active': ?isActive,
        'is_public': ?isPublic,
        'max_members': ?maxMembers,
      });

  // ── Members ──

  Future<List<Map<String, dynamic>>> members(
    String channelId, {
    String status = 'active',
    String? search,
  }) async {
    final data = await _send(
      'GET',
      await _uri('${_base(channelId)}/members', {
        'status': status,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      }),
    );
    return _rows(data['members']);
  }

  Future<Map<String, dynamic>> addMember(
    String channelId, {
    required String query,
    String role = 'member',
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/members'),
          body: {'query': query, 'role': role});

  Future<void> updateMember(
    String channelId, {
    required String memberId,
    String? role,
    String? status,
  }) async {
    await _send('PATCH', await _uri('${_base(channelId)}/members'), body: {
      'member_id': memberId,
      'role': ?role,
      'status': ?status,
    });
  }

  Future<void> removeMember(String channelId, String memberId) async {
    await _send(
      'DELETE',
      await _uri('${_base(channelId)}/members', {'memberId': memberId}),
    );
  }

  // ── Join requests ──

  Future<List<Map<String, dynamic>>> joinRequests(
    String channelId, {
    String status = 'pending',
    String? search,
  }) async {
    final data = await _send(
      'GET',
      await _uri('${_base(channelId)}/requests', {
        'status': status,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      }),
    );
    return _rows(data['requests']);
  }

  Future<Map<String, dynamic>> respondToRequest(
    String channelId, {
    required String requestId,
    required bool approve,
    String? notes,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/requests'), body: {
        'request_id': requestId,
        'action': approve ? 'approve' : 'reject',
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      });

  // ── Posts ──

  Future<Map<String, dynamic>> createPost(
    String channelId, {
    required String title,
    required String content,
    String postType = 'lesson',
    bool pinned = false,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/posts'), body: {
        'title': title,
        'content': content,
        'post_type': postType,
        'is_pinned': pinned,
      });

  Future<void> updatePost(
    String channelId, {
    required String postId,
    String? title,
    String? content,
    String? postType,
    bool? pinned,
    bool? archived,
  }) async {
    await _send('PATCH', await _uri('${_base(channelId)}/posts'), body: {
      'post_id': postId,
      'title': ?title,
      'content': ?content,
      'post_type': ?postType,
      'is_pinned': ?pinned,
      'is_archived': ?archived,
    });
  }

  Future<void> deletePost(
    String channelId,
    String postId, {
    bool permanent = false,
  }) async {
    await _send(
      'DELETE',
      await _uri('${_base(channelId)}/posts', {
        'postId': postId,
        'mode': permanent ? 'permanent' : 'soft',
      }),
    );
  }

  // ── Quizzes ──

  Future<Map<String, dynamic>> createQuiz(
    String channelId, {
    required String question,
    required String optionA,
    required String optionB,
    required String optionC,
    required String optionD,
    String? optionE,
    required String correctAnswer,
    String? explanation,
    bool revealed = false,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/qa'), body: {
        'question': question,
        'option_a': optionA,
        'option_b': optionB,
        'option_c': optionC,
        'option_d': optionD,
        if (optionE != null && optionE.trim().isNotEmpty) 'option_e': optionE.trim(),
        'correct_answer': correctAnswer,
        if (explanation != null && explanation.trim().isNotEmpty)
          'explanation': explanation.trim(),
        'is_revealed': revealed,
      });

  Future<void> revealQuiz(
    String channelId, {
    required String quizId,
    required bool revealed,
  }) async {
    await _send('PATCH', await _uri('${_base(channelId)}/qa'),
        body: {'qa_id': quizId, 'is_revealed': revealed});
  }

  Future<void> deleteQuiz(
    String channelId,
    String quizId, {
    bool permanent = false,
  }) async {
    await _send(
      'DELETE',
      await _uri('${_base(channelId)}/qa', {
        'qaId': quizId,
        'mode': permanent ? 'permanent' : 'soft',
      }),
    );
  }

  // ── Videos ──

  Future<Map<String, dynamic>> postYouTubeVideo(
    String channelId, {
    required String title,
    required String youtubeUrl,
    String? description,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/videos'), body: {
        'source': 'youtube',
        'title': title,
        'youtube_url': youtubeUrl,
        'description': ?description,
      });

  Future<Map<String, dynamic>> postEmbedVideo(
    String channelId, {
    required String title,
    required String embedCode,
    String platform = 'other',
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/videos'), body: {
        'source': 'embed',
        'title': title,
        'embed_code': embedCode,
        'platform': platform,
      });

  /// [source] is `youtube`, `upload` or `embed`.
  Future<void> deleteVideo(
    String channelId,
    String videoId, {
    required String source,
    bool permanent = false,
  }) async {
    await _send(
      'DELETE',
      await _uri('${_base(channelId)}/videos', {
        'videoId': videoId,
        'source': source,
        'mode': permanent ? 'permanent' : 'soft',
      }),
    );
  }

  // ── Audio lectures ──

  Future<List<Map<String, dynamic>>> audioLectures(String channelId) async {
    final data = await _send('GET', await _uri('${_base(channelId)}/audio'));
    return _rows(data['lectures']);
  }

  Future<void> updateAudioLecture(
    String channelId, {
    required String lectureId,
    String? title,
    String? description,
  }) async {
    await _send('PATCH', await _uri('${_base(channelId)}/audio'), body: {
      'lecture_id': lectureId,
      'title': ?title,
      'description': ?description,
    });
  }

  Future<void> deleteAudioLecture(String channelId, String lectureId) async {
    await _send(
      'DELETE',
      await _uri('${_base(channelId)}/audio', {'lectureId': lectureId}),
    );
  }

  // ── Lesson notes ──

  Future<List<Map<String, dynamic>>> lessonNotes(String channelId) async {
    final data = await _send('GET', await _uri('${_base(channelId)}/notes'));
    return _rows(data['notes']);
  }

  Future<Map<String, dynamic>> createLessonNote(
    String channelId, {
    required String title,
    required String content,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/notes'),
          body: {'title': title, 'content': content});

  Future<void> updateLessonNote(
    String channelId, {
    required String noteId,
    String? title,
    String? content,
  }) async {
    await _send('PATCH', await _uri('${_base(channelId)}/notes'), body: {
      'note_id': noteId,
      'title': ?title,
      'content': ?content,
    });
  }

  Future<void> deleteLessonNote(String channelId, String noteId) async {
    await _send('DELETE', await _uri('${_base(channelId)}/notes', {'noteId': noteId}));
  }

  // ── Messages & moderation ──

  Future<List<Map<String, dynamic>>> channelMessages(String channelId) async {
    final data = await _send('GET', await _uri('${_base(channelId)}/moderate'));
    return _rows(data['messages']);
  }

  Future<Map<String, dynamic>> _moderate(
    String channelId,
    Map<String, dynamic> body,
  ) async =>
      _send('POST', await _uri('${_base(channelId)}/moderate'), body: body);

  Future<Map<String, dynamic>> postAnnouncement(
    String channelId, {
    required String content,
    List<Map<String, String>> links = const [],
  }) =>
      _moderate(channelId, {
        'action': 'post_message',
        'content': content,
        if (links.isNotEmpty) 'links': links,
      });

  Future<void> deleteMessage(
    String channelId,
    String messageId, {
    bool permanent = false,
  }) async {
    await _moderate(channelId, {
      'action': permanent ? 'purge_message' : 'delete_message',
      'message_id': messageId,
    });
  }

  Future<void> deleteMessageMedia(String channelId, String mediaId) async {
    await _moderate(channelId, {'action': 'delete_media', 'media_id': mediaId});
  }

  Future<void> clearChat(String channelId) async {
    await _moderate(channelId, {'action': 'clear_chat'});
  }

  // ── Subscription settings ──

  Future<Map<String, dynamic>> subscriptionSettings(String channelId) =>
      _sendGet('${_base(channelId)}/subscription');

  Future<Map<String, dynamic>> saveSubscriptionSettings(
    String channelId, {
    required bool enabled,
    required double monthlyFee,
    required String instructions,
    String? contactName,
    String? contactNumber,
  }) async =>
      _send('PUT', await _uri('${_base(channelId)}/subscription'), body: {
        'is_enabled': enabled,
        'monthly_fee': monthlyFee,
        'payment_instructions': instructions,
        'payment_contact_name': ?contactName,
        'payment_contact_number': ?contactNumber,
      });

  Future<Map<String, dynamic>> setMemberSubscription(
    String channelId, {
    required String agentId,
    required bool extend,
    double? amount,
    String? notes,
  }) async =>
      _send('POST', await _uri('${_base(channelId)}/subscription'), body: {
        'agent_id': agentId,
        'action': extend ? 'extend' : 'revoke',
        'amount': ?amount,
        'notes': ?notes,
      });

  Future<Map<String, dynamic>> _sendGet(String path) async =>
      _send('GET', await _uri(path));

  List<Map<String, dynamic>> _rows(Object? raw) {
    if (raw is List) {
      return raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return const [];
  }
}

/// [ApiException] plus the membership context the feed endpoint returns on 403.
class ChannelAccessException extends ApiException {
  ChannelAccessException(
    super.message, {
    super.statusCode,
    super.photoGate,
    super.code,
    super.banned,
    this.requiresJoin = false,
    this.channel,
    this.membership,
  });

  final bool requiresJoin;
  final Map<String, dynamic>? channel;
  final Map<String, dynamic>? membership;
}

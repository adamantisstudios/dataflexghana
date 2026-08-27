import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../services/session_store.dart';
import '../theme/app_theme.dart';

/// Image loader for endpoints that require the agent Bearer token, such as
/// `/api/agent/dating/photos/{id}/serve`. A plain [CachedNetworkImage] sends no
/// headers, so those requests come back 401 and render as broken images.
class AuthedNetworkImage extends StatefulWidget {
  const AuthedNetworkImage({
    super.key,
    required this.imageUrl,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholderIcon = Icons.person_outline,
  });

  final String imageUrl;
  final double? height;
  final double? width;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final IconData placeholderIcon;

  @override
  State<AuthedNetworkImage> createState() => _AuthedNetworkImageState();
}

class _AuthedNetworkImageState extends State<AuthedNetworkImage> {
  static Map<String, String>? _cachedHeaders;
  Map<String, String>? _headers;

  @override
  void initState() {
    super.initState();
    _resolveHeaders();
  }

  Future<void> _resolveHeaders() async {
    if (_cachedHeaders != null) {
      setState(() => _headers = _cachedHeaders);
      return;
    }
    final headers = await SessionStore.instance.authHeaders();
    // Only the auth material matters for a GET; keep the map small.
    final slim = <String, String>{
      if (headers['Authorization'] != null) 'Authorization': headers['Authorization']!,
      if (headers['x-agent-id'] != null) 'x-agent-id': headers['x-agent-id']!,
    };
    _cachedHeaders = slim;
    if (mounted) setState(() => _headers = slim);
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      height: widget.height,
      width: widget.width,
      color: DfColors.sand,
      child: Icon(widget.placeholderIcon, color: DfColors.muted, size: 34),
    );

    if (widget.imageUrl.trim().isEmpty) return _clip(fallback);
    if (_headers == null) {
      return _clip(Container(
        height: widget.height,
        width: widget.width,
        color: DfColors.sand,
      ));
    }

    return _clip(
      CachedNetworkImage(
        imageUrl: widget.imageUrl,
        httpHeaders: _headers,
        height: widget.height,
        width: widget.width,
        fit: widget.fit,
        placeholder: (_, _) => Container(
          height: widget.height,
          width: widget.width,
          color: DfColors.sand,
        ),
        errorWidget: (_, _, _) => fallback,
      ),
    );
  }

  Widget _clip(Widget child) {
    final radius = widget.borderRadius;
    return radius == null ? child : ClipRRect(borderRadius: radius, child: child);
  }
}

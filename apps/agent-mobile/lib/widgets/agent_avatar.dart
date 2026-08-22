import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class AgentAvatar extends StatelessWidget {
  const AgentAvatar({super.key, this.imageUrl, this.name, this.size = 44});

  final String? imageUrl;
  final String? name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initials = _initials(name);
    if (imageUrl == null || imageUrl!.trim().isEmpty) {
      return _fallback(initials);
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(size / 2),
      child: CachedNetworkImage(
        imageUrl: imageUrl!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        memCacheWidth: (size * 3).toInt(),
        placeholder: (_, __) => _fallback(initials),
        errorWidget: (_, __, ___) => _fallback(initials),
      ),
    );
  }

  Widget _fallback(String initials) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [DfColors.brand, DfColors.brandDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.34,
        ),
      ),
    );
  }

  String _initials(String? name) {
    final parts = (name ?? 'A').trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return 'A';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
  }
}

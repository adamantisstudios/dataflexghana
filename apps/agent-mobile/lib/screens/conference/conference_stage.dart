import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart' as lk;

import '../../services/livekit_service.dart';
import 'conference_theme.dart';

/// Speaker grid. Renders video tiles when any camera is live, otherwise a
/// compact avatar grid with active-speaker rings.
class ConferenceStage extends StatelessWidget {
  const ConferenceStage({super.key, required this.service});

  final LiveKitService service;

  @override
  Widget build(BuildContext context) {
    final participants = service.participants;
    if (participants.isEmpty) {
      return const Center(
        child: Text(
          'Waiting for the room to fill up…',
          style: TextStyle(color: StageColors.textMuted),
        ),
      );
    }

    final hasVideo = participants.any((p) => service.videoTrackFor(p) != null);
    final columns = hasVideo
        ? (participants.length <= 2 ? 1 : 2)
        : math.min(3, math.max(2, (participants.length / 3).ceil() + 1));

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 20),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: hasVideo ? 0.86 : 0.92,
      ),
      itemCount: participants.length,
      itemBuilder: (context, index) {
        final participant = participants[index];
        return _ParticipantTile(
          service: service,
          participant: participant,
          isLocal: participant.identity == service.localIdentity,
        );
      },
    );
  }
}

class _ParticipantTile extends StatelessWidget {
  const _ParticipantTile({
    required this.service,
    required this.participant,
    required this.isLocal,
  });

  final LiveKitService service;
  final lk.Participant participant;
  final bool isLocal;

  @override
  Widget build(BuildContext context) {
    final speaking = participant.isSpeaking;
    final videoTrack = service.videoTrackFor(participant);
    final name = service.displayNameOf(participant);
    final role = service.roleOf(participant);
    final muted = participant.audioTrackPublications.isEmpty ||
        participant.audioTrackPublications.every((p) => p.muted);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: StageColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: speaking ? StageColors.accent : StageColors.outline,
          width: speaking ? 2.5 : 1,
        ),
        boxShadow: speaking
            ? [
                BoxShadow(
                  color: StageColors.accent.withValues(alpha: 0.35),
                  blurRadius: 18,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(17),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (videoTrack != null)
              lk.VideoTrackRenderer(
                videoTrack,
                fit: lk.VideoViewFit.cover,
                autoCenter: false,
              )
            else
              _AvatarBody(name: name, speaking: speaking),
            Positioned(
              left: 8,
              right: 8,
              bottom: 8,
              child: Row(
                children: [
                  Icon(
                    muted ? Icons.mic_off_rounded : Icons.mic_rounded,
                    size: 14,
                    color: muted ? StageColors.textMuted : StageColors.accent,
                  ),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      isLocal ? 'You' : name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: StageColors.text,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (role != 'listener')
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: StageColors.accentSoft.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    role,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AvatarBody extends StatelessWidget {
  const _AvatarBody({required this.name, required this.speaking});

  final String name;
  final bool speaking;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isEmpty
        ? '?'
        : name.trim().split(RegExp(r'\s+')).take(2).map((w) => w[0].toUpperCase()).join();

    return Center(
      child: Container(
        width: 62,
        height: 62,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: speaking
                ? const [StageColors.accent, StageColors.accentSoft]
                : const [StageColors.surfaceHigh, StageColors.outline],
          ),
        ),
        child: Center(
          child: Text(
            initials,
            style: TextStyle(
              color: speaking ? const Color(0xFF04170B) : StageColors.text,
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
        ),
      ),
    );
  }
}

/// Emoji reactions floating up from the bottom of the stage.
class ReactionOverlay extends StatelessWidget {
  const ReactionOverlay({super.key, required this.reactions});

  final List<FloatingReaction> reactions;

  @override
  Widget build(BuildContext context) {
    if (reactions.isEmpty) return const SizedBox.shrink();
    return IgnorePointer(
      child: Stack(
        children: [
          for (final reaction in reactions)
            Align(
              alignment: Alignment(reaction.horizontal, 1),
              child: _FloatingEmoji(key: ValueKey(reaction.id), emoji: reaction.emoji),
            ),
        ],
      ),
    );
  }
}

class FloatingReaction {
  FloatingReaction({required this.id, required this.emoji, required this.horizontal});

  final String id;
  final String emoji;

  /// -1 (left) to 1 (right).
  final double horizontal;
}

class _FloatingEmoji extends StatefulWidget {
  const _FloatingEmoji({super.key, required this.emoji});

  final String emoji;

  @override
  State<_FloatingEmoji> createState() => _FloatingEmojiState();
}

class _FloatingEmojiState extends State<_FloatingEmoji> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        return Padding(
          padding: EdgeInsets.only(bottom: 40 + 220 * t),
          child: Opacity(opacity: (1 - t).clamp(0.0, 1.0), child: child),
        );
      },
      child: Text(widget.emoji, style: const TextStyle(fontSize: 34)),
    );
  }
}

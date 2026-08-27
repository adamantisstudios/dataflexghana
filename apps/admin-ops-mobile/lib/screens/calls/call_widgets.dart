import 'package:flutter/material.dart';

import '../../theme.dart';

/// Circular caller avatar with a soft pulse while ringing and a ring that
/// lights up while the other side is talking.
class CallAvatar extends StatefulWidget {
  const CallAvatar({
    super.key,
    required this.name,
    this.pulsing = false,
    this.speaking = false,
  });

  final String name;
  final bool pulsing;
  final bool speaking;

  @override
  State<CallAvatar> createState() => _CallAvatarState();
}

class _CallAvatarState extends State<CallAvatar> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  @override
  void initState() {
    super.initState();
    if (widget.pulsing) _controller.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant CallAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pulsing && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.pulsing && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String get _initials {
    final parts = widget.name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts[1].characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final glow = widget.speaking ? OpsColors.success : OpsColors.brand;

    return Center(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(scale: 1 + 0.08 * _controller.value, child: child);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          width: 148,
          height: 148,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [OpsColors.brand, OpsColors.cardAlt],
            ),
            border: Border.all(
              color: glow.withValues(alpha: widget.speaking ? 0.9 : 0.35),
              width: widget.speaking ? 3 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: glow.withValues(alpha: widget.speaking ? 0.4 : 0.22),
                blurRadius: 38,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Center(
            child: Text(
              _initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 46,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Large filled round button — accept, decline, hang up.
class CallActionButton extends StatelessWidget {
  const CallActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    this.onPressed,
    this.busy = false,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: color.withValues(alpha: onPressed == null ? 0.4 : 1),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onPressed,
            child: SizedBox(
              width: 72,
              height: 72,
              child: busy
                  ? const Center(
                      child: SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : Icon(icon, color: Colors.white, size: 30),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      ],
    );
  }
}

/// Outlined round toggle — mute, speaker.
class CallToggleButton extends StatelessWidget {
  const CallToggleButton({
    super.key,
    required this.icon,
    required this.label,
    required this.active,
    this.onPressed,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final fg = !enabled
        ? Colors.white24
        : active
            ? const Color(0xFF06121F)
            : Colors.white;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: active ? Colors.white : Colors.white.withValues(alpha: 0.08),
          shape: CircleBorder(
            side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
          ),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onPressed,
            child: SizedBox(
              width: 62,
              height: 62,
              child: Icon(icon, color: fg, size: 26),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: TextStyle(
            color: enabled ? Colors.white70 : Colors.white24,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

/// Dark "stage" palette used by every live screen. Deliberately separate from
/// the light app theme so the conference feels like a dedicated surface.
class StageColors {
  static const backdrop = Color(0xFF07100C);
  static const surface = Color(0xFF0E1A14);
  static const surfaceHigh = Color(0xFF16261D);
  static const outline = Color(0xFF1F3428);
  static const accent = Color(0xFF35B24A);
  static const accentSoft = Color(0xFF0E8F3D);
  static const live = Color(0xFFE53935);
  static const text = Color(0xFFF2F7F3);
  static const textMuted = Color(0xFF8FA396);
}

/// Circular control used across the conference and call screens.
class StageControlButton extends StatelessWidget {
  const StageControlButton({
    super.key,
    required this.icon,
    required this.label,
    this.onPressed,
    this.active = false,
    this.danger = false,
    this.busy = false,
    this.size = 58,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final bool active;
  final bool danger;
  final bool busy;
  final double size;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !busy;
    final Color background;
    final Color foreground;
    if (danger) {
      background = StageColors.live;
      foreground = Colors.white;
    } else if (active) {
      background = StageColors.accent;
      foreground = const Color(0xFF04170B);
    } else {
      background = StageColors.surfaceHigh;
      foreground = enabled ? StageColors.text : StageColors.textMuted;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Opacity(
          opacity: enabled ? 1 : 0.45,
          child: Material(
            color: background,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: enabled ? onPressed : null,
              child: SizedBox(
                width: size,
                height: size,
                child: Center(
                  child: busy
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: foreground),
                        )
                      : Icon(icon, color: foreground, size: 24),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(color: StageColors.textMuted, fontSize: 11),
        ),
      ],
    );
  }
}

/// Thin status strip shown under the app bar for connection changes.
class StageBanner extends StatelessWidget {
  const StageBanner({
    super.key,
    required this.message,
    this.color = StageColors.accentSoft,
    this.showSpinner = false,
    this.icon,
  });

  final String message;
  final Color color;
  final bool showSpinner;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: color.withValues(alpha: 0.18),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          if (showSpinner)
            SizedBox(
              width: 15,
              height: 15,
              child: CircularProgressIndicator(strokeWidth: 2, color: color),
            )
          else
            Icon(icon ?? Icons.info_outline, size: 17, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

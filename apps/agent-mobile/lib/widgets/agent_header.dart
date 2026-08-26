import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/agent_avatar.dart';

/// Sticky header matching web `AgentHeader.tsx` — wallet, settings, notifications, logout.
class AgentDashboardHeader extends StatelessWidget {
  const AgentDashboardHeader({
    super.key,
    required this.name,
    required this.phone,
    this.photoUrl,
    required this.onNotificationsTap,
    required this.onSettingsTap,
    required this.onLogout,
    this.notifCount = 0,
  });

  final String name;
  final String phone;
  final String? photoUrl;
  final VoidCallback onNotificationsTap;
  final VoidCallback onSettingsTap;
  final VoidCallback onLogout;
  final int notifCount;

  String get _displayName {
    final trimmed = name.trim();
    return trimmed.isEmpty ? 'Agent' : trimmed;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 4,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF15803D), Color(0xFF047857), Color(0xFF166534)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          border: Border(bottom: BorderSide(color: Color(0x6606463C))),
        ),
        child: SafeArea(
          bottom: false,
          child: SizedBox(
            height: 56,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  AgentAvatar(imageUrl: photoUrl, name: name, size: 36),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _displayName,
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'DataFlex Ghana Agent',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  _HeaderIconBtn(icon: Icons.settings_outlined, onTap: onSettingsTap, tooltip: 'Settings'),
                  _HeaderIconBtn(
                    icon: Icons.notifications_outlined,
                    onTap: onNotificationsTap,
                    tooltip: 'Notifications',
                    badge: notifCount,
                  ),
                  _HeaderIconBtn(icon: Icons.logout, onTap: onLogout, tooltip: 'Logout'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderIconBtn extends StatelessWidget {
  const _HeaderIconBtn({
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.badge = 0,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      tooltip: tooltip,
      icon: Badge(
        isLabelVisible: badge > 0,
        label: Text('$badge'),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
      style: IconButton.styleFrom(
        backgroundColor: Colors.white.withValues(alpha: 0.12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
        ),
      ),
    );
  }
}

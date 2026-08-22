import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

class MenuCardData {
  const MenuCardData({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.asset,
    required this.gradient,
    required this.cta,
  });

  final String id;
  final String title;
  final String subtitle;
  final String asset;
  final List<Color> gradient;
  final String cta;
}

const mvpMenus = <MenuCardData>[
  MenuCardData(
    id: 'tutorials',
    title: 'Video Tutorials',
    subtitle: 'Learn the platform fast',
    asset: 'assets/images/tutorial.png',
    gradient: [Color(0xFF6366F1), Color(0xFF4338CA)],
    cta: 'WATCH',
  ),
  MenuCardData(
    id: 'referral-hub',
    title: 'Referral Hub',
    subtitle: 'Your storefront & marketplace',
    asset: 'assets/images/referral-hub.png',
    gradient: [Color(0xFF0EA5E9), Color(0xFF0369A1)],
    cta: 'OPEN',
  ),
  MenuCardData(
    id: 'voice-conference',
    title: 'Agent Conference',
    subtitle: 'Join live agent meetings',
    asset: 'assets/images/voice-conference.png',
    gradient: [DfColors.brand, DfColors.brandLight],
    cta: 'JOIN',
  ),
  MenuCardData(
    id: 'data-bundles',
    title: 'Data Bundles',
    subtitle: 'MTN · AirtelTigo · Telecel',
    asset: 'assets/images/data-bundles.png',
    gradient: [Color(0xFF8E24AA), Color(0xFF5E35B1)],
    cta: 'BUY DATA',
  ),
  MenuCardData(
    id: 'compliance',
    title: 'Compliance',
    subtitle: 'Birth cert, passport, business forms',
    asset: 'assets/images/compliance.png',
    gradient: [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    cta: 'FORMS',
  ),
];

class AgentMenuCard extends StatelessWidget {
  const AgentMenuCard({super.key, required this.data, required this.onTap});

  final MenuCardData data;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(
              colors: data.gradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: data.gradient.last.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.asset(
                    data.asset,
                    width: 72,
                    height: 72,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 72,
                      height: 72,
                      color: Colors.white24,
                      child: const Icon(Icons.apps, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.title,
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        data.subtitle,
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          data.cta,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.white70),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

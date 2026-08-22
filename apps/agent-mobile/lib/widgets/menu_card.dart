import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

enum MenuKind { nativeData, nativeCompliance, underConstruction }

class MenuCardData {
  const MenuCardData({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.asset,
    required this.gradient,
    required this.cta,
    required this.kind,
    this.webPath,
    this.networkImage,
  });

  final String id;
  final String title;
  final String subtitle;
  final String asset;
  final List<Color> gradient;
  final String cta;
  final MenuKind kind;
  final String? webPath;
  final String? networkImage;
}

/// Menu order matches web `AgentMenuCards.tsx`.
const agentMenus = <MenuCardData>[
  MenuCardData(
    id: 'tutorials',
    title: 'Video Tutorials',
    subtitle: 'Learn how to use the platform',
    asset: 'assets/images/tutorial.png',
    gradient: [Color(0xFF6366F1), Color(0xFF4338CA)],
    cta: 'WATCH NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/tutorials',
  ),
  MenuCardData(
    id: 'referral-hub',
    title: 'Referral Hub',
    subtitle: 'Your white-label storefront & QR',
    asset: 'assets/images/referral-hub.png',
    gradient: [Color(0xFF0EA5E9), Color(0xFF0369A1)],
    cta: 'OPEN HUB',
    kind: MenuKind.underConstruction,
    webPath: '/agent/referralhub',
  ),
  MenuCardData(
    id: 'voice-conference',
    title: 'Agent Conference',
    subtitle: 'Join live audio & video sessions',
    asset: 'assets/images/voice-conference.png',
    gradient: [DfColors.brand, DfColors.brandLight],
    cta: 'JOIN MEETING',
    kind: MenuKind.underConstruction,
    webPath: '/agent/voice-rooms',
  ),
  MenuCardData(
    id: 'data-bundles',
    title: 'Data Bundles',
    subtitle: 'Order Data Bundles',
    asset: 'assets/images/data-bundles.png',
    gradient: [Color(0xFF8E24AA), Color(0xFF5E35B1)],
    cta: 'BUY DATA',
    kind: MenuKind.nativeData,
  ),
  MenuCardData(
    id: 'compliance',
    title: 'Compliance',
    subtitle: 'Business Registration Etc',
    asset: 'assets/images/compliance.png',
    gradient: [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    cta: 'MANAGE FORMS',
    kind: MenuKind.nativeCompliance,
  ),
  MenuCardData(
    id: 'services',
    title: 'Referral Services',
    subtitle: 'Refer & earn big',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/referral-services.png',
    gradient: [Color(0xFF26A69A), Color(0xFF1565C0)],
    cta: 'REFER NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dashboard?tab=services',
  ),
  MenuCardData(
    id: 'jobs',
    title: 'Job Opportunities',
    subtitle: 'Find and apply for jobs',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/job-opportunities.png',
    gradient: [Color(0xFF1E88E5), Color(0xFF1565C0)],
    cta: 'FIND JOBS',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dashboard?tab=jobs',
  ),
  MenuCardData(
    id: 'professional-writing',
    title: 'Professional Writing',
    subtitle: 'Resume, CV, and more',
    asset: 'assets/images/compliance.png',
    networkImage: 'https://www.dataflexghana.com/images/professional-writing.preview.png',
    gradient: [Color(0xFFEC4899), Color(0xFFBE185D)],
    cta: 'WRITING SERVICES',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dashboard?tab=professional-writing',
  ),
  MenuCardData(
    id: 'online-courses',
    title: 'Online Courses',
    subtitle: 'Sign up to courses today',
    asset: 'assets/images/tutorial.png',
    networkImage: 'https://www.dataflexghana.com/images/online-courses.png',
    gradient: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
    cta: 'SIGN UP NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dashboard?tab=online-courses',
  ),
  MenuCardData(
    id: 'Channels',
    title: 'Dataflex Channels',
    subtitle: 'Follow or join channels',
    asset: 'assets/images/tutorial.png',
    networkImage: 'https://www.dataflexghana.com/images/teaching-platform.png',
    gradient: [DfColors.brand, DfColors.brandLight],
    cta: 'EXPLORE CHANNELS',
    kind: MenuKind.underConstruction,
    webPath: '/agent/teaching',
  ),
  MenuCardData(
    id: 'voucher',
    title: 'Voucher',
    subtitle: 'Vouchers, routers & digital products',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/voucher.png',
    gradient: [Color(0xFFF97316), Color(0xFFEA580C)],
    cta: 'OPEN VOUCHER',
    kind: MenuKind.underConstruction,
    webPath: '/voucher',
  ),
  MenuCardData(
    id: 'referral-program',
    title: 'Referral Program',
    subtitle: 'Invite & earn commissions',
    asset: 'assets/images/referral-hub.png',
    networkImage: 'https://www.dataflexghana.com/images/referral-program.png',
    gradient: [Color(0xFFF59E0B), Color(0xFFD97706)],
    cta: 'INVITE NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dashboard?tab=referral-program',
  ),
  MenuCardData(
    id: 'withdrawals',
    title: 'Withdrawals',
    subtitle: 'Withdraw your earnings',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/withdrawals.png',
    gradient: [Color(0xFFE53935), Color(0xFFB71C1C)],
    cta: 'WITHDRAW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/withdraw',
  ),
  MenuCardData(
    id: 'savings',
    title: 'Savings Plans',
    subtitle: 'Save money with our plans',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/savings-plans.png',
    gradient: [Color(0xFFFF7043), Color(0xFFD84315)],
    cta: 'SAVE NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/savings',
  ),
  MenuCardData(
    id: 'wholesale',
    title: 'Wholesale',
    subtitle: 'Buy products in bulk',
    asset: 'assets/images/bulkorder.jpg',
    networkImage: 'https://www.dataflexghana.com/images/wholesale.png',
    gradient: [Color(0xFF43A047), Color(0xFF2E7D32)],
    cta: 'SHOP BULK',
    kind: MenuKind.underConstruction,
    webPath: '/agent/wholesale',
  ),
  MenuCardData(
    id: 'publish-products',
    title: 'Publish Products',
    subtitle: 'Upload products for wholesale',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/publish-products.png',
    gradient: [Color(0xFF1976D2), Color(0xFF1565C0)],
    cta: 'PUBLISH NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/publish-products',
  ),
  MenuCardData(
    id: 'publish-properties',
    title: 'Publish Properties',
    subtitle: 'List properties for sale or rent',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/publish-properties.png',
    gradient: [Color(0xFFD97706), Color(0xFFB45309)],
    cta: 'PUBLISH NOW',
    kind: MenuKind.underConstruction,
    webPath: '/agent/publish-properties',
  ),
  MenuCardData(
    id: 'real-estate-store',
    title: 'Real Estate',
    subtitle: 'Promote listings on your storefront',
    asset: 'assets/images/referral-hub.png',
    networkImage: 'https://www.dataflexghana.com/images/promote-listings.png',
    gradient: [Color(0xFFF59E0B), Color(0xFFD97706)],
    cta: 'OPEN HUB',
    kind: MenuKind.underConstruction,
    webPath: '/agent/referralhub?hubTab=marketplace&marketplaceTab=real-estate',
  ),
  MenuCardData(
    id: 'fashion-avenue',
    title: 'Fashion Avenue',
    subtitle: 'Request projects or refer & earn',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/fashion-avenue.png',
    gradient: [Color(0xFFD946A6), Color(0xFF9D174D)],
    cta: 'VISIT FASHION',
    kind: MenuKind.underConstruction,
    webPath: '/fashion-avenue',
  ),
  MenuCardData(
    id: 'find-a-date',
    title: 'Find a Date',
    subtitle: 'Connections for approved agents',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/find_a_date.png',
    gradient: [Color(0xFFE11D48), Color(0xFFBE123C)],
    cta: 'OPEN',
    kind: MenuKind.underConstruction,
    webPath: '/agent/dating',
  ),
  MenuCardData(
    id: 'profile',
    title: 'Profile Settings',
    subtitle: 'Manage your account',
    asset: 'assets/images/data-bundles.png',
    networkImage: 'https://www.dataflexghana.com/images/profile-settings.png',
    gradient: [Color(0xFF546E7A), Color(0xFF37474F)],
    cta: 'SETTINGS',
    kind: MenuKind.underConstruction,
    webPath: '/agent/settings',
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
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: data.networkImage != null
                        ? CachedNetworkImage(
                            imageUrl: data.networkImage!,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Image.asset(
                              data.asset,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Colors.white24,
                                child: const Icon(Icons.apps, color: Colors.white),
                              ),
                            ),
                          )
                        : Image.asset(
                            data.asset,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: Colors.white24,
                              child: const Icon(Icons.apps, color: Colors.white),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              data.title,
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 17,
                              ),
                            ),
                          ),
                          if (data.kind == MenuKind.underConstruction)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'DEV',
                                style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        data.subtitle,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
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

/// Horizontal scroll menu — matches web mobile `AgentMenuCards`.
class AgentMenuCarousel extends StatelessWidget {
  const AgentMenuCarousel({super.key, required this.onTap});

  final ValueChanged<MenuCardData> onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        itemCount: agentMenus.length,
        separatorBuilder: (context, index) => const SizedBox(width: 14),
        itemBuilder: (context, i) => AgentMenuHorizontalCard(data: agentMenus[i], onTap: () => onTap(agentMenus[i])),
      ),
    );
  }
}

class AgentMenuHorizontalCard extends StatelessWidget {
  const AgentMenuHorizontalCard({super.key, required this.data, required this.onTap});

  final MenuCardData data;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 288,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: data.gradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: data.gradient.last.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                data.title,
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (data.kind == MenuKind.underConstruction)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.black26,
                                  borderRadius: BorderRadius.circular(5),
                                ),
                                child: const Text('DEV', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          data.subtitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.2),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            data.cta,
                            style: const TextStyle(
                              color: Color(0xFF111827),
                              fontWeight: FontWeight.w700,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 96,
                    height: 96,
                    child: _MenuImage(data: data),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MenuImage extends StatelessWidget {
  const _MenuImage({required this.data});
  final MenuCardData data;

  @override
  Widget build(BuildContext context) {
    if (data.networkImage != null) {
      return CachedNetworkImage(
        imageUrl: data.networkImage!,
        fit: BoxFit.contain,
        errorWidget: (context, url, error) => Image.asset(data.asset, fit: BoxFit.contain),
      );
    }
    return Image.asset(data.asset, fit: BoxFit.contain);
  }
}

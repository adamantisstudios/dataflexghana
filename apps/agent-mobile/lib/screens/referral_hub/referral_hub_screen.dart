import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../theme/app_theme.dart';
import 'hub_farmers_tab.dart';
import 'hub_listings_tab.dart';
import 'hub_marketplace_tab.dart';
import 'hub_orders_tab.dart';
import 'hub_profile_tab.dart';
import 'hub_qr_tab.dart';

class ReferralHubScreen extends StatelessWidget {
  const ReferralHubScreen({
    super.key,
    this.initialTab = 0,
    this.initialMarketplaceSection,
  });

  /// 0 Profile | 1 Listings | 2 Marketplace | 3 Farmers | 4 Orders | 5 QR
  final int initialTab;

  /// Marketplace sub-section key to open on, e.g. `'real-estate'`. Passing a
  /// value implies the Marketplace tab; unknown keys fall back to Data bundles.
  final String? initialMarketplaceSection;

  static const int marketplaceTabIndex = 2;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 6,
      initialIndex: initialMarketplaceSection != null
          ? marketplaceTabIndex
          : initialTab.clamp(0, 5),
      child: Scaffold(
        backgroundColor: DfColors.sand,
        appBar: AppBar(
          title: Text(
            'Referral Hub',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: Colors.white),
          ),
          bottom: TabBar(
            isScrollable: true,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13),
            tabs: const [
              Tab(text: 'Profile'),
              Tab(text: 'Listings'),
              Tab(text: 'Marketplace'),
              Tab(text: 'Farmers'),
              Tab(text: 'Orders'),
              Tab(text: 'QR'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            const HubProfileTab(),
            const HubListingsTab(),
            HubMarketplaceTab(initialSection: initialMarketplaceSection),
            const HubFarmersTab(),
            const HubOrdersTab(),
            const HubQrTab(),
          ],
        ),
      ),
    );
  }
}

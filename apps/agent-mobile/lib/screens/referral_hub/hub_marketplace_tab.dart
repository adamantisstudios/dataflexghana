import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'marketplace/advertising_section.dart';
import 'marketplace/bundles_section.dart';
import 'marketplace/compliance_section.dart';
import 'marketplace/influencers_section.dart';
import 'marketplace/marketplace_common.dart';
import 'marketplace/real_estate_section.dart';
import 'marketplace/services_section.dart';
import 'marketplace/wholesale_section.dart';
import 'marketplace/writing_section.dart';

export 'marketplace/marketplace_common.dart' show MarketplaceSection, marketplaceSectionFromKey;

/// Shell for the Referral Hub → Marketplace tab: sub-section chips plus the
/// lazily built section that is currently selected. Each section owns its own
/// loading and paging; they share [StoreSettingsStore] so a visibility change in
/// one is reflected in the others.
class HubMarketplaceTab extends StatefulWidget {
  const HubMarketplaceTab({super.key, this.initialSection});

  /// Website sub-tab key, e.g. `bundles`, `real-estate`, `influencers`.
  /// Unknown values fall back to Data bundles.
  final String? initialSection;

  @override
  State<HubMarketplaceTab> createState() => _HubMarketplaceTabState();
}

class _HubMarketplaceTabState extends State<HubMarketplaceTab> {
  final _store = StoreSettingsStore();
  late MarketplaceSection _section;

  /// Keys for the chip row so a deep-linked section can be scrolled into view —
  /// otherwise sections like Real Estate open with their chip off-screen.
  final _chipKeys = {
    for (final s in MarketplaceSection.values) s: GlobalKey(),
  };

  @override
  void initState() {
    super.initState();
    _section =
        marketplaceSectionFromKey(widget.initialSection) ?? MarketplaceSection.bundles;
    if (_section != MarketplaceSection.bundles) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _revealChip());
    }
  }

  void _revealChip() {
    final ctx = _chipKeys[_section]?.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      alignment: 0.5,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _store.dispose();
    super.dispose();
  }

  Widget _body() {
    // Keyed so switching sections rebuilds state from scratch rather than
    // reusing the previous section's controllers.
    return switch (_section) {
      MarketplaceSection.bundles => BundlesSection(key: const ValueKey('bundles'), store: _store),
      MarketplaceSection.services => ServicesSection(key: const ValueKey('services'), store: _store),
      MarketplaceSection.wholesale =>
        WholesaleSection(key: const ValueKey('wholesale'), store: _store),
      MarketplaceSection.compliance =>
        ComplianceSection(key: const ValueKey('compliance'), store: _store),
      MarketplaceSection.advertising =>
        AdvertisingSection(key: const ValueKey('advertising'), store: _store),
      MarketplaceSection.writing => WritingSection(key: const ValueKey('writing'), store: _store),
      MarketplaceSection.realEstate =>
        RealEstateSection(key: const ValueKey('real-estate'), store: _store),
      MarketplaceSection.influencers => const InfluencersSection(key: ValueKey('influencers')),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
            itemCount: MarketplaceSection.values.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final section = MarketplaceSection.values[i];
              final selected = _section == section;
              return ChoiceChip(
                key: _chipKeys[section],
                label: Text(section.chipLabel),
                selected: selected,
                selectedColor: DfColors.brand.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: selected ? DfColors.brandDark : DfColors.ink,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 12,
                ),
                onSelected: (_) {
                  if (_section == section) return;
                  setState(() => _section = section);
                },
              );
            },
          ),
        ),
        Expanded(child: _body()),
      ],
    );
  }
}

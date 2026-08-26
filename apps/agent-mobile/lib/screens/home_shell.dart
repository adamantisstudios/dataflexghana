import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../widgets/agent_header.dart';
import '../widgets/agent_notification_popup.dart';
import '../widgets/menu_card.dart';
import 'apple_service_screen.dart';
import 'channels_screen.dart';
import 'compliance_screen.dart';
import 'data_bundles_screen.dart';
import 'dating_screen.dart';
import 'domestic_workers_screen.dart';
import 'fashion_screen.dart';
import 'groceries_screen.dart';
import 'jobs_screen.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';
import 'online_courses_screen.dart';
import 'orders_screen.dart';
import 'placeholder_feature_screen.dart';
import 'professional_writing_screen.dart';
import 'publish_products_screen.dart';
import 'publish_properties_screen.dart';
import 'referral_hub/referral_hub_screen.dart';
import 'referral_program_screen.dart';
import 'referral_services_screen.dart';
import 'savings_screen.dart';
import 'settings_screen.dart';
import 'tutorials_screen.dart';
import 'voice_conference_screen.dart';
import 'voucher_screen.dart';
import 'wallet_screen.dart';
import 'wholesale_screen.dart';
import 'withdrawals_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  Map<String, dynamic>? _agent;
  int _notifCount = 0;
  bool _loading = true;
  String? _error;
  final _bundlesKey = GlobalKey<DataBundlesScreenState>();
  final _ordersKey = GlobalKey<OrdersScreenState>();
  final _walletKey = GlobalKey<WalletScreenState>();
  final _menuSearch = TextEditingController();
  MenuCategory _menuCategory = MenuCategory.all;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _menuSearch.dispose();
    super.dispose();
  }

  void _onTab(int i) {
    setState(() => _tab = i);
    if (i == 1) _bundlesKey.currentState?.reload(force: true);
    if (i == 2) _ordersKey.currentState?.reload();
    if (i == 3) _walletKey.currentState?.reload();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final refreshed = await ApiClient.instance.refreshAgentProfile(forceRefresh: true);
      final agent = refreshed['agent'];
      if (agent is Map<String, dynamic>) {
        setState(() => _agent = agent);
      }
      try {
        final n = await ApiClient.instance.notifications(forceRefresh: true);
        final list = n['notifications'];
        setState(() => _notifCount = list is List ? list.length : 0);
      } catch (_) {}
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await SessionStore.instance.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _openMenu(MenuCardData item) {
    switch (item.kind) {
      case MenuKind.nativeData:
        _onTab(1);
        break;
      case MenuKind.nativeCompliance:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ComplianceScreen()));
        break;
      case MenuKind.nativeJobs:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const JobsScreen()));
        break;
      case MenuKind.nativeDomesticWorkers:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DomesticWorkersScreen()));
        break;
      case MenuKind.nativeFashion:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FashionScreen()));
        break;
      case MenuKind.nativeWriting:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfessionalWritingScreen()));
        break;
      case MenuKind.nativeSettings:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen()));
        break;
      case MenuKind.nativeAppleService:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AppleServiceScreen()));
        break;
      case MenuKind.nativeGroceries:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GroceriesScreen()));
        break;
      case MenuKind.nativeReferralHub:
        final openMarketplace = item.id == 'real-estate-store';
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ReferralHubScreen(initialTab: openMarketplace ? 2 : 0),
          ),
        );
        break;
      case MenuKind.nativeWithdrawals:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WithdrawalsScreen()));
        break;
      case MenuKind.nativeReferralProgram:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReferralProgramScreen()));
        break;
      case MenuKind.nativeWholesale:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WholesaleScreen()));
        break;
      case MenuKind.nativeSavings:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SavingsScreen()));
        break;
      case MenuKind.nativeTutorials:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TutorialsScreen()));
        break;
      case MenuKind.nativePublishProducts:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PublishProductsScreen()));
        break;
      case MenuKind.nativePublishProperties:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PublishPropertiesScreen()));
        break;
      case MenuKind.nativeServices:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReferralServicesScreen()));
        break;
      case MenuKind.nativeVoucher:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoucherScreen()));
        break;
      case MenuKind.nativeOnlineCourses:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OnlineCoursesScreen()));
        break;
      case MenuKind.nativeDating:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DatingScreen()));
        break;
      case MenuKind.nativeVoiceConference:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceConferenceScreen()));
        break;
      case MenuKind.nativeChannels:
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChannelsScreen()));
        break;
      case MenuKind.underConstruction:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PlaceholderFeatureScreen(
              title: item.title,
              webPath: item.webPath ?? '/agent/dashboard',
              blurb:
                  'This section is under development in the app. Use the DataFlex website for the full experience today.',
            ),
          ),
        );
        break;
    }
  }

  double _balance(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  Widget _homeTab() {
    final name = _agent?['full_name']?.toString() ?? 'Agent';
    final phone = _agent?['phone_number']?.toString() ?? '';
    final photo = _agent?['profile_image_url']?.toString();
    final wallet = _balance(_agent?['wallet_balance']);
    final commission = _balance(_agent?['commission_balance']);

    return ColoredBox(
      color: const Color(0xFFF9FAFB),
      child: Column(
        children: [
          AgentDashboardHeader(
            name: name,
            phone: phone,
            photoUrl: photo,
            notifCount: _notifCount,
            onNotificationsTap: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
              _bootstrap();
            },
            onSettingsTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
            onLogout: _logout,
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _bootstrap,
              color: DfColors.brand,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'DataFlex Agent',
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20),
                          ),
                          const Text(
                            'Order data, track deliveries, manage wallet — full menus below.',
                            style: TextStyle(color: DfColors.muted, fontSize: 13),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _BalanceChip(label: 'Wallet', value: wallet, onTap: () => _onTab(3)),
                              const SizedBox(width: 10),
                              _BalanceChip(label: 'Commission', value: commission),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _QuickAction(
                                  icon: Icons.shopping_bag_outlined,
                                  label: 'Buy data',
                                  onTap: () => _onTab(1),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _QuickAction(
                                  icon: Icons.receipt_long_outlined,
                                  label: 'My orders',
                                  onTap: () => _onTab(2),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _QuickAction(
                                  icon: Icons.account_balance_wallet_outlined,
                                  label: 'Wallet',
                                  onTap: () => _onTab(3),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Menu finder — does NOT touch balances / overview above.
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Menus',
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _menuSearch,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: 'Search menus…',
                              prefixIcon: const Icon(Icons.search),
                              suffixIcon: _menuSearch.text.isEmpty
                                  ? null
                                  : IconButton(
                                      icon: const Icon(Icons.clear),
                                      onPressed: () {
                                        _menuSearch.clear();
                                        setState(() {});
                                      },
                                    ),
                              isDense: true,
                              filled: true,
                              fillColor: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 40,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: MenuCategory.values.length,
                              separatorBuilder: (_, _) => const SizedBox(width: 8),
                              itemBuilder: (context, i) {
                                final cat = MenuCategory.values[i];
                                final selected = _menuCategory == cat;
                                return FilterChip(
                                  selected: selected,
                                  showCheckmark: false,
                                  avatar: Icon(cat.icon, size: 16, color: selected ? Colors.white : DfColors.brandDark),
                                  label: Text(cat.label),
                                  labelStyle: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                    color: selected ? Colors.white : DfColors.ink,
                                  ),
                                  selectedColor: DfColors.brand,
                                  backgroundColor: Colors.white,
                                  side: BorderSide(
                                    color: selected ? DfColors.brand : DfColors.brand.withValues(alpha: 0.25),
                                  ),
                                  onSelected: (_) => setState(() => _menuCategory = cat),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_loading)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: CircularProgressIndicator(color: DfColors.brand)),
                      ),
                    ),
                  if (_error != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                      ),
                    ),
                  Builder(
                    builder: (context) {
                      final filtered = filterAgentMenus(
                        category: _menuCategory,
                        query: _menuSearch.text,
                      );
                      if (filtered.isEmpty) {
                        return const SliverToBoxAdapter(
                          child: Padding(
                            padding: EdgeInsets.fromLTRB(16, 28, 16, 40),
                            child: Center(
                              child: Text(
                                'No menus match your search.\nTry another category or keyword.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: DfColors.muted),
                              ),
                            ),
                          ),
                        );
                      }
                      return SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                        sliver: SliverList.separated(
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 14),
                          itemBuilder: (context, i) {
                            final item = filtered[i];
                            return AgentMenuCard(data: item, onTap: () => _openMenu(item));
                          },
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _homeTab(),
      DataBundlesScreen(key: _bundlesKey, embedded: true),
      OrdersScreen(key: _ordersKey, embedded: true),
      WalletScreen(key: _walletKey, embedded: true),
    ];

    return AgentNotificationHost(
      child: Scaffold(
        body: IndexedStack(index: _tab, children: pages),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: _onTab,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.sim_card_outlined), selectedIcon: Icon(Icons.sim_card), label: 'Buy'),
            NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
            NavigationDestination(
              icon: Icon(Icons.account_balance_wallet_outlined),
              selectedIcon: Icon(Icons.account_balance_wallet),
              label: 'Wallet',
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceChip extends StatelessWidget {
  const _BalanceChip({required this.label, required this.value, this.onTap});
  final String label;
  final double value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: DfColors.muted, fontSize: 12)),
              const SizedBox(height: 4),
              Text(
                'GHS ${value.toStringAsFixed(2)}',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Icon(icon, color: DfColors.brandDark),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

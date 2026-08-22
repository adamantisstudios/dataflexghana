import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../widgets/agent_avatar.dart';
import '../widgets/menu_card.dart';
import 'compliance_screen.dart';
import 'data_bundles_screen.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';
import 'orders_screen.dart';
import 'placeholder_feature_screen.dart';
import 'wallet_screen.dart';

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

  @override
  void initState() {
    super.initState();
    _bootstrap();
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
      final local = await SessionStore.instance.getAgent();
      if (local != null) setState(() => _agent = local);
      final home = await ApiClient.instance.home(forceRefresh: true);
      final agent = home['agent'];
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
      case MenuKind.underConstruction:
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PlaceholderFeatureScreen(
              title: item.title,
              webPath: item.webPath ?? '/agent/dashboard',
              blurb:
                  'This feature is under construction in the app. Open it on the DataFlex website for the full experience.',
            ),
          ),
        );
        break;
    }
  }

  Widget _homeTab() {
    final name = _agent?['full_name']?.toString() ?? 'Agent';
    final phone = _agent?['phone_number']?.toString() ?? '';
    final photo = _agent?['profile_image_url']?.toString();
    final wallet = _agent?['wallet_balance'];
    final commission = _agent?['commission_balance'];

    return RefreshIndicator(
      onRefresh: _bootstrap,
      color: DfColors.brand,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 168,
            pinned: true,
            actions: [
              IconButton(
                onPressed: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  );
                  _bootstrap();
                },
                icon: Badge(
                  isLabelVisible: _notifCount > 0,
                  label: Text('$_notifCount'),
                  child: const Icon(Icons.notifications_outlined),
                ),
              ),
              IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [DfColors.brandDark, DfColors.brand],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    AgentAvatar(imageUrl: photo, name: name, size: 64),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(phone, style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    Image.asset('assets/images/dataflex_logo.png', height: 40),
                  ],
                ),
              ),
            ),
          ),
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
                      _BalanceChip(
                        label: 'Wallet',
                        value: wallet,
                        onTap: () => setState(() => _tab = 3),
                      ),
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
                          onTap: () => setState(() => _tab = 1),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.receipt_long_outlined,
                          label: 'My orders',
                          onTap: () => setState(() => _tab = 2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.account_balance_wallet_outlined,
                          label: 'Wallet',
                          onTap: () => setState(() => _tab = 3),
                        ),
                      ),
                    ],
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
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            sliver: SliverList.separated(
              itemCount: agentMenus.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, i) {
                final item = agentMenus[i];
                return AgentMenuCard(data: item, onTap: () => _openMenu(item));
              },
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

    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: _onTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.sim_card_outlined),
            selectedIcon: Icon(Icons.sim_card),
            label: 'Buy',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Wallet',
          ),
        ],
      ),
    );
  }
}

class _BalanceChip extends StatelessWidget {
  const _BalanceChip({required this.label, required this.value, this.onTap});
  final String label;
  final Object? value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final n = value is num ? value as num : num.tryParse(value?.toString() ?? '') ?? 0;
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
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: DfColors.muted, fontSize: 12)),
              const SizedBox(height: 4),
              Text(
                'GHS ${n.toStringAsFixed(2)}',
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

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
import 'placeholder_feature_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  Map<String, dynamic>? _agent;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
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
    switch (item.id) {
      case 'data-bundles':
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DataBundlesScreen()));
        break;
      case 'compliance':
        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ComplianceScreen()));
        break;
      case 'tutorials':
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const PlaceholderFeatureScreen(
              title: 'Video Tutorials',
              webPath: '/agent/tutorials',
              blurb: 'Full tutorial library opens on the web while we finish the native player.',
            ),
          ),
        );
        break;
      case 'referral-hub':
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const PlaceholderFeatureScreen(
              title: 'Referral Hub',
              webPath: '/agent/referralhub',
              blurb: 'Manage storefront listings and marketplace on the web for now — native hub is next.',
            ),
          ),
        );
        break;
      case 'voice-conference':
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const PlaceholderFeatureScreen(
              title: 'Agent Conference',
              webPath: '/agent/voice-rooms',
              blurb: 'Live voice rooms stay on the website for this release.',
            ),
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _agent?['full_name']?.toString() ?? 'Agent';
    final phone = _agent?['phone_number']?.toString() ?? '';
    final photo = _agent?['profile_image_url']?.toString();
    final wallet = _agent?['wallet_balance'];
    final commission = _agent?['commission_balance'];

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _bootstrap,
        color: DfColors.brand,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 168,
              pinned: true,
              actions: [
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
                      Image.asset('assets/images/logo.png', height: 36),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  children: [
                    _BalanceChip(label: 'Wallet', value: wallet),
                    const SizedBox(width: 10),
                    _BalanceChip(label: 'Commission', value: commission),
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
                itemCount: mvpMenus.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, i) {
                  final item = mvpMenus[i];
                  return AgentMenuCard(data: item, onTap: () => _openMenu(item));
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceChip extends StatelessWidget {
  const _BalanceChip({required this.label, required this.value});
  final String label;
  final Object? value;

  @override
  Widget build(BuildContext context) {
    final n = value is num ? value as num : num.tryParse(value?.toString() ?? '') ?? 0;
    return Expanded(
      child: Container(
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
    );
  }
}

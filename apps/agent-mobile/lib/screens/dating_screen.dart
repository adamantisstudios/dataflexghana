import 'package:flutter/material.dart';

import '../services/dating_api.dart';
import '../theme/app_theme.dart';
import 'dating/counselling_screen.dart';
import 'dating/discover_tab.dart';
import 'dating/matches_tab.dart';
import 'dating/profile_tab.dart';
import 'dating/subscription_screen.dart';

/// Entry point for "Find a Date" — routes into discover, matches, the profile
/// editor, plans and counselling. Kept at this path/name because home_shell.dart
/// links to it.
class DatingScreen extends StatefulWidget {
  const DatingScreen({super.key});

  @override
  State<DatingScreen> createState() => _DatingScreenState();
}

class _DatingScreenState extends State<DatingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  final _discoverKey = GlobalKey<DiscoverTabState>();
  final _matchesKey = GlobalKey<MatchesTabState>();
  final _profileKey = GlobalKey<ProfileTabState>();

  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    // Photo URLs arrive as relative proxy paths, so the API base has to be
    // known before any dating image is built.
    DatingApi.primeBaseUrl().whenComplete(() {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _goToTab(int index) {
    _tabs.animateTo(index);
  }

  Future<void> _openPlans() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const DatingSubscriptionScreen()),
    );
    if (mounted) _discoverKey.currentState?.load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find a Date'),
        actions: [
          IconButton(
            tooltip: 'Plans & coins',
            icon: const Icon(Icons.workspace_premium_outlined),
            onPressed: _openPlans,
          ),
          IconButton(
            tooltip: 'Counselling',
            icon: const Icon(Icons.volunteer_activism_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CounsellingScreen()),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Discover'),
            Tab(text: 'Matches'),
            Tab(text: 'My profile'),
          ],
        ),
      ),
      body: !_ready
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : TabBarView(
              controller: _tabs,
              children: [
                DiscoverTab(
                  key: _discoverKey,
                  onEditProfile: () => _goToTab(2),
                  onOpenPlans: _openPlans,
                  onMatched: () => _matchesKey.currentState?.load(),
                ),
                MatchesTab(
                  key: _matchesKey,
                  onOpenDiscover: () => _goToTab(0),
                ),
                ProfileTab(
                  key: _profileKey,
                  onProfileChanged: () {
                    _discoverKey.currentState?.load();
                    _matchesKey.currentState?.load();
                  },
                ),
              ],
            ),
    );
  }
}

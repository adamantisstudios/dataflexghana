import 'package:flutter/material.dart';

import '../../services/admin_session.dart';
import '../../theme.dart';
import 'storefront_cashout_tab.dart';
import 'storefront_compliance_tab.dart';
import 'storefront_orders_tab.dart';

/// Native mirror of the admin website's "Storefront Management" tab.
///
/// Renders body content only — it is mounted inside the ops app's existing
/// Scaffold, so tabs live in a local [DefaultTabController].
class StorefrontPage extends StatefulWidget {
  const StorefrontPage({super.key});

  @override
  State<StorefrontPage> createState() => _StorefrontPageState();
}

class _StorefrontPageState extends State<StorefrontPage> {
  final _pendingCount = ValueNotifier<int>(0);
  final _cashoutKey = GlobalKey<StorefrontCashoutTabState>();
  final _ordersKey = GlobalKey<StorefrontOrdersTabState>();
  final _complianceKey = GlobalKey<StorefrontComplianceTabState>();
  bool _refreshing = false;

  @override
  void dispose() {
    _pendingCount.dispose();
    super.dispose();
  }

  Future<void> _refreshAll() async {
    setState(() => _refreshing = true);
    await Future.wait([
      _cashoutKey.currentState?.load() ?? Future<void>.value(),
      _ordersKey.currentState?.load() ?? Future<void>.value(),
      _complianceKey.currentState?.load() ?? Future<void>.value(),
    ]);
    if (!mounted) return;
    setState(() => _refreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final admin = AdminSession.instance.admin;

    return DefaultTabController(
      length: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(13),
                    gradient: const LinearGradient(
                      colors: [OpsColors.brand, Color(0xFF115E59)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Icon(Icons.storefront_outlined, size: 22, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Storefront Management',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        admin == null
                            ? 'Cashouts · transaction log · compliance'
                            : 'Cashouts · transaction log · compliance — ${admin.displayName}',
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: 'Refresh everything',
                  onPressed: _refreshing ? null : _refreshAll,
                  icon: _refreshing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh),
                ),
              ],
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: OpsColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: OpsColors.border),
            ),
            child: TabBar(
              isScrollable: false,
              dividerColor: Colors.transparent,
              indicatorSize: TabBarIndicatorSize.tab,
              indicator: BoxDecoration(
                color: OpsColors.brand.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: OpsColors.brand.withValues(alpha: 0.55)),
              ),
              labelColor: OpsColors.success,
              unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
              unselectedLabelStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500),
              labelPadding: const EdgeInsets.symmetric(horizontal: 4),
              tabs: [
                const Tab(
                  height: 44,
                  child: _TabLabel(icon: Icons.wallet_outlined, label: 'Cashout'),
                ),
                Tab(
                  height: 44,
                  child: ValueListenableBuilder<int>(
                    valueListenable: _pendingCount,
                    builder: (context, count, _) => _TabLabel(
                      icon: Icons.receipt_long_outlined,
                      label: 'Orders',
                      badge: count,
                    ),
                  ),
                ),
                const Tab(
                  height: 44,
                  child: _TabLabel(icon: Icons.assignment_outlined, label: 'Compliance'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: TabBarView(
              children: [
                StorefrontCashoutTab(key: _cashoutKey),
                StorefrontOrdersTab(key: _ordersKey, pendingCount: _pendingCount),
                StorefrontComplianceTab(key: _complianceKey),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TabLabel extends StatelessWidget {
  const _TabLabel({required this.icon, required this.label, this.badge = 0});

  final IconData icon;
  final String label;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16),
        const SizedBox(width: 5),
        Flexible(
          child: Text(label, overflow: TextOverflow.ellipsis, maxLines: 1),
        ),
        if (badge > 0) ...[
          const SizedBox(width: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(
              color: OpsColors.warning,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              badge > 99 ? '99+' : '$badge',
              style: const TextStyle(
                color: Color(0xFF1F2937),
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

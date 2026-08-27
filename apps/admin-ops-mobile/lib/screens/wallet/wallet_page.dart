import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'agent_wallet_sheet.dart';
import 'pending_topups_tab.dart';
import 'wallet_api.dart';
import 'wallet_dialogs.dart';

/// Admin wallet management — the phone equivalent of the website's Wallets tab.
///
/// Renders its own body only; it is mounted inside the shell's Scaffold.
class WalletPage extends StatefulWidget {
  const WalletPage({super.key});

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  bool _statsLoading = true;
  String? _statsError;
  Map<String, dynamic> _stats = const {};
  int _pendingCount = 0;

  bool _agentsLoading = true;
  String? _agentsError;
  List<Map<String, dynamic>> _agents = const [];
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadStats();
    _loadAgents();
  }

  Future<void> _loadStats() async {
    setState(() {
      _statsLoading = true;
      _statsError = null;
    });
    try {
      // The pending counter comes from the top-up queue itself so the banner and
      // the queue tab can never disagree.
      final stats = await WalletApi.overview();
      final pending = await WalletApi.topups(status: 'pending', limit: 1);
      if (!mounted) return;
      setState(() {
        _stats = stats;
        _pendingCount = pending.total;
        _statsLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _statsLoading = false;
        _statsError = walletErrorText(e);
      });
    }
  }

  Future<void> _loadAgents() async {
    setState(() {
      _agentsLoading = true;
      _agentsError = null;
    });
    try {
      final term = _search.trim();
      // `agents/list` ignores search terms shorter than 4 characters, so short
      // queries go through the dedicated search route instead.
      final rows = term.isNotEmpty && term.length < 4
          ? await WalletApi.searchAgents(term)
          : await WalletApi.agents(search: term);
      if (!mounted) return;
      setState(() {
        _agents = rows;
        _agentsLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _agentsLoading = false;
        _agentsError = walletErrorText(e);
      });
    }
  }

  Future<void> _refreshAll() async {
    await Future.wait([_loadStats(), _loadAgents()]);
  }

  Future<void> _openAgent(Map<String, dynamic> agent) async {
    final changed = await showAgentWalletSheet(context, agent);
    if (!mounted || !changed) return;
    await _refreshAll();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          Container(
            color: OpsColors.card,
            child: const TabBar(
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              indicatorColor: OpsColors.brand,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white54,
              tabs: [
                Tab(text: 'Overview'),
                Tab(text: 'Top-up queue'),
                Tab(text: 'Agents'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _overviewTab(),
                PendingTopupsTab(onQueueChanged: _loadStats),
                _agentsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- overview

  Widget _overviewTab() {
    return RefreshIndicator(
      onRefresh: _loadStats,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SectionHeader(
            title: 'Wallet overview',
            subtitle: 'Live totals across every agent wallet',
          ),
          if (_statsLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_statsError != null)
            OpsError(message: _statsError!, onRetry: _loadStats)
          else ...[
            _totalCard(),
            const SizedBox(height: 14),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.7,
              children: [
                StatTile(
                  label: 'Commission balance',
                  value: formatMoney(_stats['totalCommissionBalance']),
                  color: OpsColors.info,
                  icon: Icons.savings_outlined,
                ),
                StatTile(
                  label: 'Agents',
                  value: '${_stats['totalAgents'] ?? 0}',
                  color: OpsColors.brand,
                  icon: Icons.people_outline,
                ),
                StatTile(
                  label: 'Agents with balance',
                  value: '${_stats['agentsWithBalance'] ?? 0}',
                  color: OpsColors.success,
                  icon: Icons.account_balance_wallet_outlined,
                ),
                StatTile(
                  label: 'Average balance',
                  value: formatMoney(_stats['averageBalance']),
                  color: OpsColors.info,
                  icon: Icons.stacked_line_chart,
                ),
                StatTile(
                  label: 'Highest balance',
                  value: formatMoney(_stats['highestBalance']),
                  color: OpsColors.success,
                  icon: Icons.trending_up,
                ),
                StatTile(
                  label: 'Lowest balance',
                  value: formatMoney(_stats['lowestBalance']),
                  color: OpsColors.warning,
                  icon: Icons.trending_down,
                ),
              ],
            ),
            const SizedBox(height: 16),
            _pendingBanner(),
            const SizedBox(height: 16),
            _noAutoCreditNote(),
            const SizedBox(height: 10),
            Text(
              'Last updated ${formatDateTime(_stats['lastUpdated'])}',
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }

  Widget _totalCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [OpsColors.brand.withValues(alpha: 0.45), OpsColors.card],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: OpsColors.brand.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.account_balance_wallet, size: 18, color: Colors.white70),
              SizedBox(width: 8),
              Text(
                'TOTAL SPENDABLE BALANCE',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 10,
                  letterSpacing: 1.1,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            formatMoney(_stats['totalBalance']),
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          const Text(
            'Approved wallet transactions only — commission deposits are tracked separately.',
            style: TextStyle(color: Colors.white54, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _noAutoCreditNote() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: OpsColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: OpsColors.warning.withValues(alpha: 0.35)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield_outlined, color: OpsColors.warning, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Wallet top-ups are never auto-credited. Every credit, debit and approval on this '
              'tab requires an explicit confirmation.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pendingBanner() {
    final count = _pendingCount;
    final color = count > 0 ? OpsColors.warning : OpsColors.success;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(count > 0 ? Icons.pending_actions : Icons.check_circle_outline, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              count > 0
                  ? '$count top-up request${count == 1 ? '' : 's'} awaiting approval — '
                      'open the Top-up queue tab to review them'
                  : 'No top-up requests waiting for approval',
              style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  // ------------------------------------------------------------------ agents

  Widget _agentsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: OpsSearchField(
            hint: 'Search agents by name, phone or email…',
            onChanged: (value) {
              _search = value;
              _loadAgents();
            },
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadAgents,
            child: _agentsLoading
                ? const Center(child: CircularProgressIndicator())
                : _agentsError != null
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [OpsError(message: _agentsError!, onRetry: _loadAgents)],
                      )
                    : _agents.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              OpsEmpty(
                                message: _search.trim().isEmpty
                                    ? 'No agents found.'
                                    : 'No agents match "${_search.trim()}".',
                                icon: Icons.person_search_outlined,
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount: _agents.length,
                            itemBuilder: (_, i) => _agentCard(_agents[i]),
                          ),
          ),
        ),
      ],
    );
  }

  Widget _agentCard(Map<String, dynamic> agent) {
    final name = pick(agent, const ['full_name', 'name'], fallback: 'Unnamed agent');
    final phone = pick(agent, const ['phone_number', 'phone']);
    final balance = asAmount(agent['wallet_balance']);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _openAgent(agent),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: OpsColors.brand.withValues(alpha: 0.2),
                child: Text(
                  name.characters.first.toUpperCase(),
                  style: const TextStyle(color: OpsColors.brand, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      phone,
                      style: const TextStyle(color: Colors.white54, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      formatMoney(balance),
                      style: const TextStyle(
                        color: OpsColors.success,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white38),
            ],
          ),
        ),
      ),
    );
  }
}

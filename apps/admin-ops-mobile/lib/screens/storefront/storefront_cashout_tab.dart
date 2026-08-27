import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'storefront_api.dart';
import 'storefront_common.dart';

class StorefrontCashoutTab extends StatefulWidget {
  const StorefrontCashoutTab({super.key});

  @override
  State<StorefrontCashoutTab> createState() => StorefrontCashoutTabState();
}

class StorefrontCashoutTabState extends State<StorefrontCashoutTab>
    with AutomaticKeepAliveClientMixin {
  bool _loading = true;
  bool _exporting = false;
  String? _error;
  String _search = '';
  bool _positiveOnly = true;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  List<Map<String, dynamic>> _profiles = const [];
  final Set<String> _busyIds = <String>{};

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await StorefrontApi.instance.fetchCashoutProfiles(
        page: _page,
        positiveOnly: _positiveOnly,
        search: _search,
      );
      if (!mounted) return;
      setState(() {
        _profiles = result.items;
        _totalPages = result.totalPages;
        _total = result.total;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeAdminError(e);
        _loading = false;
      });
    }
  }

  void _applySearch(String value) {
    if (value.trim() == _search) return;
    setState(() {
      _search = value.trim();
      _page = 1;
    });
    load();
  }

  void _togglePositiveOnly(bool value) {
    setState(() {
      _positiveOnly = value;
      _page = 1;
    });
    load();
  }

  void _goToPage(int page) {
    setState(() => _page = page);
    load();
  }

  Future<void> _markPaid(Map<String, dynamic> profile) async {
    final agentId = (profile['agent_id'] ?? '').toString();
    if (agentId.isEmpty) return;
    final balance = asDouble(profile['storefront_commission_balance']);
    final name = pick(profile, ['agent_name'], fallback: 'this agent');

    final ok = await confirmAction(
      context,
      title: 'Mark MoMo cashout as paid?',
      message:
          "This resets $name's storefront commission balance of ${formatMoney(balance)} to zero and "
          'marks their pending storefront withdrawal as paid. Only do this after you have actually '
          'sent the MoMo transfer.',
      confirmLabel: 'Confirm payment',
    );
    if (!ok || !mounted) return;

    setState(() => _busyIds.add(agentId));
    try {
      final message = await StorefrontApi.instance.markCashoutPaid(agentId);
      if (!mounted) return;
      showOpsSnack(context, message);
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _busyIds.remove(agentId));
    }
    await load();
  }

  Future<void> _deleteEntry(Map<String, dynamic> profile) async {
    final agentId = (profile['agent_id'] ?? '').toString();
    if (agentId.isEmpty) return;
    final balance = asDouble(profile['storefront_commission_balance']);
    final name = pick(profile, ['agent_name'], fallback: 'this agent');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        var acknowledged = false;
        return StatefulBuilder(
          builder: (ctx2, setDialogState) {
            final blocked = balance > 0 && !acknowledged;
            return AlertDialog(
              backgroundColor: OpsColors.card,
              title: const Text('Delete cashout entry?'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "This resets $name's storefront commission balance to zero. The agent will no "
                    'longer appear in the positive-balance cashout list.',
                    style: const TextStyle(color: Colors.white70, height: 1.4),
                  ),
                  if (balance > 0) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: OpsColors.warning.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: OpsColors.warning.withValues(alpha: 0.4)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Current balance: ${formatMoney(balance)}',
                            style: const TextStyle(
                              color: OpsColors.warning,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: () => setDialogState(() => acknowledged = !acknowledged),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Checkbox(
                                  value: acknowledged,
                                  onChanged: (v) => setDialogState(() => acknowledged = v == true),
                                ),
                                const Expanded(
                                  child: Padding(
                                    padding: EdgeInsets.only(top: 12),
                                    child: Text(
                                      'I understand this permanently clears the unpaid commission '
                                      'balance without marking it as paid.',
                                      style: TextStyle(color: Colors.white70, fontSize: 12.5),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx2, false), child: const Text('Cancel')),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: OpsColors.danger),
                  onPressed: blocked ? null : () => Navigator.pop(ctx2, true),
                  child: const Text('Delete entry'),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirmed != true || !mounted) return;

    setState(() => _busyIds.add(agentId));
    try {
      final message = await StorefrontApi.instance.deleteCashoutEntry(
        agentId,
        confirmClearBalance: true,
      );
      if (!mounted) return;
      showOpsSnack(context, message);
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _busyIds.remove(agentId));
    }
    await load();
  }

  Future<void> _exportCsv() async {
    setState(() => _exporting = true);
    try {
      final all = <Map<String, dynamic>>[];
      var page = 1;
      var totalPages = 1;
      while (page <= totalPages && page <= kStorefrontExportMaxPages) {
        final result = await StorefrontApi.instance.fetchCashoutProfiles(
          page: page,
          limit: kStorefrontExportLimit,
          positiveOnly: _positiveOnly,
          search: _search,
        );
        all.addAll(result.items);
        totalPages = result.totalPages;
        page += 1;
      }
      final csv = buildCsv(
        const [
          'Agent Name',
          'MoMo',
          'Balance',
          'Requested Amount',
          'Request Status',
          'Requested At',
          'Last Order Date',
        ],
        [
          for (final p in all)
            [
              pick(p, ['agent_name'], fallback: 'Unknown'),
              pick(p, ['phone_number'], fallback: ''),
              asDouble(p['storefront_commission_balance']).toStringAsFixed(2),
              asDouble(asMap(p['payout_request'])?['amount']).toStringAsFixed(2),
              asMap(p['payout_request'])?['status'] ?? '',
              asMap(p['payout_request'])?['requested_at'] ?? '',
              p['last_order_date'] ?? '',
            ],
        ],
      );
      if (!mounted) return;
      await copyToClipboard(context, csv, 'CSV for ${all.length} agent(s)');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  void _openDetail(Map<String, dynamic> profile) {
    final agentId = (profile['agent_id'] ?? '').toString();
    showOpsSheet<void>(
      context: context,
      title: pick(profile, ['agent_name'], fallback: 'Agent'),
      subtitle: pick(profile, ['store_name'], fallback: 'Storefront payout request'),
      builder: (sheetCtx) => _CashoutDetailSheet(
        profile: profile,
        busy: _busyIds.contains(agentId),
        onMarkPaid: () async {
          Navigator.pop(sheetCtx);
          await _markPaid(profile);
        },
        onDelete: () async {
          Navigator.pop(sheetCtx);
          await _deleteEntry(profile);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final totalBalance = _profiles.fold<double>(
      0,
      (sum, p) => sum + asDouble(p['storefront_commission_balance']),
    );
    final totalRequested = _profiles.fold<double>(
      0,
      (sum, p) => sum + asDouble(asMap(p['payout_request'])?['amount']),
    );

    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: const LinearGradient(
                colors: [Color(0xFF134E4A), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: OpsColors.brand.withValues(alpha: 0.35)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.account_balance_wallet_outlined, color: OpsColors.success),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Cashout requests',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Agents appear here after requesting a storefront commission payout. '
                        'Pay their MoMo manually, then mark the request as paid.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.65),
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: StatTile(
                  label: 'Agents on page',
                  value: '${_profiles.length}',
                  color: OpsColors.info,
                  icon: Icons.people_alt_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatTile(
                  label: 'Unpaid balance',
                  value: formatMoney(totalBalance),
                  color: OpsColors.success,
                  icon: Icons.savings_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatTile(
                  label: 'Requested',
                  value: formatMoney(totalRequested),
                  color: OpsColors.warning,
                  icon: Icons.outbound_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          OpsSearchField(hint: 'Search agent name or phone…', onChanged: _applySearch),
          const SizedBox(height: 12),
          OpsPanel(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Positive balances only',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ),
                Switch(value: _positiveOnly, onChanged: _togglePositiveOnly),
              ],
            ),
          ),
          const SizedBox(height: 4),
          OpsActionButton(
            icon: Icons.copy_all_outlined,
            label: 'Copy balances CSV',
            busy: _exporting,
            color: OpsColors.info,
            onPressed: _loading ? null : _exportCsv,
          ),
          const SizedBox(height: 16),
          OpsListState(
            loading: _loading,
            error: _error,
            isEmpty: _profiles.isEmpty,
            emptyIcon: Icons.account_balance_wallet_outlined,
            emptyMessage: _search.isNotEmpty
                ? 'No agents match your search.'
                : 'No pending storefront payout requests.',
            onRetry: load,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final profile in _profiles)
                  _CashoutRow(
                    profile: profile,
                    busy: _busyIds.contains((profile['agent_id'] ?? '').toString()),
                    onTap: () => _openDetail(profile),
                    onMarkPaid: () => _markPaid(profile),
                  ),
                OpsPager(
                  page: _page,
                  totalPages: _totalPages,
                  total: _total,
                  onChanged: _goToPage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CashoutRow extends StatelessWidget {
  const _CashoutRow({
    required this.profile,
    required this.busy,
    required this.onTap,
    required this.onMarkPaid,
  });

  final Map<String, dynamic> profile;
  final bool busy;
  final VoidCallback onTap;
  final VoidCallback onMarkPaid;

  @override
  Widget build(BuildContext context) {
    final balance = asDouble(profile['storefront_commission_balance']);
    final request = asMap(profile['payout_request']);
    final requestStatus = (request?['status'] ?? 'requested').toString();

    return OpsPanel(
      onTap: onTap,
      accent: OpsColors.statusColor(requestStatus),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pick(profile, ['agent_name'], fallback: 'Unknown agent'),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      pick(profile, ['phone_number'], fallback: 'No MoMo on file'),
                      style: const TextStyle(color: Colors.white54, fontSize: 12.5),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatMoney(balance),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: OpsColors.success,
                    ),
                  ),
                  const SizedBox(height: 4),
                  StatusChip(status: requestStatus),
                ],
              ),
            ],
          ),
          if (request != null) ...[
            const SizedBox(height: 8),
            Text(
              'Requested ${formatMoney(request['amount'])} · ${formatDateTime(request['requested_at'])}',
              style: const TextStyle(color: Colors.white38, fontSize: 11.5),
            ),
          ],
          const SizedBox(height: 4),
          Text(
            'Last order: ${formatDateTime(profile['last_order_date'])}',
            style: const TextStyle(color: Colors.white38, fontSize: 11.5),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OpsActionButton(
              icon: Icons.check_circle_outline,
              label: 'Mark as paid',
              filled: true,
              busy: busy,
              onPressed: balance <= 0 ? null : onMarkPaid,
            ),
          ),
        ],
      ),
    );
  }
}

class _CashoutDetailSheet extends StatelessWidget {
  const _CashoutDetailSheet({
    required this.profile,
    required this.busy,
    required this.onMarkPaid,
    required this.onDelete,
  });

  final Map<String, dynamic> profile;
  final bool busy;
  final VoidCallback onMarkPaid;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final balance = asDouble(profile['storefront_commission_balance']);
    final request = asMap(profile['payout_request']);
    final phone = pick(profile, ['phone_number'], fallback: '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: OpsColors.success.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: OpsColors.success.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Commission balance',
                style: TextStyle(color: Colors.white60, fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                formatMoney(balance),
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: OpsColors.success,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const SectionHeader(title: 'Agent'),
        DetailRow(label: 'Name', value: pick(profile, ['agent_name'])),
        DetailRow(label: 'Store', value: pick(profile, ['store_name'])),
        if (phone.isNotEmpty)
          Row(
            children: [
              Expanded(child: DetailRow(label: 'MoMo number', value: phone)),
              IconButton(
                tooltip: 'Copy MoMo number',
                icon: const Icon(Icons.copy, size: 17),
                onPressed: () => copyToClipboard(context, phone, 'MoMo number'),
              ),
            ],
          ),
        DetailRow(label: 'Agent ID', value: pick(profile, ['agent_id'])),
        DetailRow(label: 'Last order', value: formatDateTime(profile['last_order_date'])),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Payout request'),
        if (request == null)
          const DetailRow(label: 'Request', value: 'No pending withdrawal on file')
        else ...[
          DetailRow(label: 'Amount', value: formatMoney(request['amount'])),
          DetailRow(label: 'Status', value: pick(request, ['status'], fallback: 'requested')),
          DetailRow(label: 'Requested', value: formatDateTime(request['requested_at'])),
          DetailRow(label: 'MoMo', value: pick(request, ['momo_number'])),
          DetailRow(label: 'Request ID', value: pick(request, ['id'])),
        ],
        const SizedBox(height: 22),
        OpsActionButton(
          icon: Icons.check_circle_outline,
          label: 'Mark cashout as paid',
          filled: true,
          busy: busy,
          onPressed: balance <= 0 ? null : onMarkPaid,
        ),
        const SizedBox(height: 10),
        OpsActionButton(
          icon: Icons.delete_outline,
          label: 'Delete cashout entry',
          color: OpsColors.danger,
          busy: busy,
          onPressed: onDelete,
        ),
        const SizedBox(height: 8),
        const Text(
          'Deleting clears the commission balance without recording a payment.',
          style: TextStyle(color: Colors.white38, fontSize: 11.5),
        ),
      ],
    );
  }
}

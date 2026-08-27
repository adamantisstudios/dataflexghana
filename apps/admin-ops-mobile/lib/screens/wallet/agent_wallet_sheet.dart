import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'wallet_api.dart';
import 'wallet_dialogs.dart';

/// Opens the agent wallet detail sheet. Resolves to true when anything that
/// could change a balance succeeded, so the caller can refresh its own data.
Future<bool> showAgentWalletSheet(BuildContext context, Map<String, dynamic> agent) async {
  final changed = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: OpsColors.cardAlt,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (_) => AgentWalletSheet(agent: agent),
  );
  return changed ?? false;
}

class AgentWalletSheet extends StatefulWidget {
  const AgentWalletSheet({super.key, required this.agent});

  final Map<String, dynamic> agent;

  @override
  State<AgentWalletSheet> createState() => _AgentWalletSheetState();
}

class _AgentWalletSheetState extends State<AgentWalletSheet> {
  bool _loading = true;
  bool _busy = false;
  String? _error;
  bool _changed = false;

  double _balance = 0;
  Map<String, dynamic> _summary = const {};
  List<Map<String, dynamic>> _transactions = const [];

  String get _agentId => (widget.agent['id'] ?? '').toString();
  String get _agentName => pick(widget.agent, const ['full_name', 'name', 'agent_name'], fallback: 'Agent');
  String get _agentPhone => pick(widget.agent, const ['phone_number', 'phone', 'momo_number']);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (_agentId.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'This agent record has no id, so its wallet cannot be loaded.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        WalletApi.summary(_agentId),
        WalletApi.transactions(_agentId),
      ]);
      if (!mounted) return;
      final summary = results[0] as Map<String, dynamic>;
      final txs = results[1] as List<Map<String, dynamic>>;
      final inner = summary['summary'];
      setState(() {
        _balance = asAmount(summary['balance']);
        _summary = inner is Map ? inner.cast<String, dynamic>() : const {};
        _transactions = txs;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = walletErrorText(e);
      });
    }
  }

  /// Runs a money action behind a single in-flight guard so a double tap can
  /// never submit twice.
  Future<void> _run(Future<String> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    String? message;
    bool ok = false;
    try {
      message = await action();
      ok = true;
    } catch (e) {
      message = walletErrorText(e);
    }
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (ok) _changed = true;
    });
    showWalletSnack(context, message, success: ok);
    if (ok) await _load();
  }

  Future<void> _adjust({required bool isCredit}) async {
    final input = await askAmountAndReason(
      context: context,
      title: isCredit ? 'Manual credit' : 'Manual debit',
      agentName: '$_agentName • $_agentPhone',
      isCredit: isCredit,
    );
    if (input == null || !mounted) return;

    final confirmed = await confirmMoneyAction(
      context: context,
      title: isCredit ? 'Confirm credit' : 'Confirm debit',
      agentName: '$_agentName ($_agentPhone)',
      amount: input.amount,
      isCredit: isCredit,
      reason: input.reason,
      confirmLabel: isCredit ? 'Credit wallet' : 'Debit wallet',
    );
    if (!confirmed || !mounted) return;

    await _run(() async {
      final data = await WalletApi.adjustment(
        agentId: _agentId,
        amount: input.amount,
        reason: input.reason,
        isCredit: isCredit,
      );
      return (data['message'] ?? (isCredit ? 'Wallet credited' : 'Wallet debited')).toString();
    });
  }

  Future<void> _reverse(Map<String, dynamic> tx) async {
    final amount = asAmount(tx['amount']);
    final reason = await askReason(
      context: context,
      title: 'Reverse top-up',
      message: 'This deducts ${formatMoney(amount)} from $_agentName\'s spendable wallet balance.',
      label: 'Reason (required)',
    );
    if (reason == null || !mounted) return;

    final confirmed = await confirmMoneyAction(
      context: context,
      title: 'Confirm reversal',
      agentName: '$_agentName ($_agentPhone)',
      amount: amount,
      isCredit: false,
      reason: reason,
      confirmLabel: 'Reverse top-up',
    );
    if (!confirmed || !mounted) return;

    await _run(() async {
      final data = await WalletApi.reverseTopup(
        transactionId: (tx['id'] ?? '').toString(),
        agentId: _agentId,
        reason: reason,
      );
      return (data['message'] ?? 'Top-up reversed').toString();
    });
  }

  Future<void> _approveTransaction(Map<String, dynamic> tx) async {
    final amount = asAmount(tx['amount']);
    final confirmed = await confirmMoneyAction(
      context: context,
      title: 'Approve pending top-up',
      agentName: '$_agentName ($_agentPhone)',
      amount: amount,
      isCredit: true,
      note: 'Approving credits this amount to the agent. Nothing is credited automatically — '
          'this tap is the approval.',
      confirmLabel: 'Approve & credit',
    );
    if (!confirmed || !mounted) return;

    await _run(() async {
      final data = await WalletApi.setTransactionStatus(
        transactionId: (tx['id'] ?? '').toString(),
        status: 'approved',
      );
      return (data['message'] ?? 'Transaction approved').toString();
    });
  }

  Future<void> _rejectTransaction(Map<String, dynamic> tx) async {
    final amount = asAmount(tx['amount']);
    final notes = await askReason(
      context: context,
      title: 'Reject transaction',
      message: 'Rejecting keeps the wallet balance unchanged. ${formatMoney(amount)} will not be credited.',
      label: 'Admin notes (optional)',
      required: false,
    );
    if (notes == null || !mounted) return;

    final confirmed = await confirmPlainAction(
      context: context,
      title: 'Confirm rejection',
      message: 'Reject the ${formatMoney(amount)} transaction for $_agentName? No money moves.',
      confirmLabel: 'Reject',
    );
    if (!confirmed || !mounted) return;

    await _run(() async {
      final data = await WalletApi.setTransactionStatus(
        transactionId: (tx['id'] ?? '').toString(),
        status: 'rejected',
        adminNotes: notes,
      );
      return (data['message'] ?? 'Transaction rejected').toString();
    });
  }

  Future<void> _syncBalance() async {
    final confirmed = await confirmPlainAction(
      context: context,
      title: 'Sync stored balance',
      message: 'Recalculates $_agentName\'s wallet from approved transactions and writes it to the '
          'agent record. No new transaction is created.',
      confirmLabel: 'Sync',
    );
    if (!confirmed || !mounted) return;

    await _run(() async {
      final data = await WalletApi.syncBalance(_agentId);
      final balance = asAmount(data['new_balance']);
      return 'Balance synced — ${formatMoney(balance)}';
    });
  }

  Future<void> _validate() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final data = await WalletApi.validate(_agentId);
      if (!mounted) return;
      final calculated = asAmount(data['calculated_balance']);
      final stored = asAmount(data['stored_balance']);
      final consistent = data['has_discrepancy'] != true;
      setState(() => _busy = false);
      showWalletSnack(
        context,
        consistent
            ? 'Consistent — calculated and stored balances both ${formatMoney(calculated)}'
            : 'Discrepancy: calculated ${formatMoney(calculated)} vs stored ${formatMoney(stored)}',
        success: consistent,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      showWalletSnack(context, walletErrorText(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    final maxHeight = MediaQuery.of(context).size.height * 0.92;

    return PopScope(
      canPop: !_busy,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _busy) {
          showWalletSnack(context, 'Please wait — a wallet action is still in flight.');
        }
      },
      child: Padding(
        padding: EdgeInsets.only(bottom: viewInsets),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _handle(),
              _header(),
              if (_busy) const LinearProgressIndicator(minHeight: 2),
              Flexible(child: _body()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _handle() => Container(
        margin: const EdgeInsets.only(top: 10, bottom: 6),
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.white24,
          borderRadius: BorderRadius.circular(4),
        ),
      );

  Widget _header() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 4, 10, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _agentName,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _agentPhone,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Reload',
            onPressed: _busy ? null : _load,
            icon: const Icon(Icons.refresh, size: 20),
          ),
          IconButton(
            tooltip: 'Close',
            onPressed: _busy ? null : () => Navigator.of(context).pop(_changed),
            icon: const Icon(Icons.close, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: OpsError(message: _error!, onRetry: _load),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
      children: [
        _balanceCard(),
        const SizedBox(height: 14),
        _summaryGrid(),
        const SizedBox(height: 16),
        _actions(),
        const SizedBox(height: 18),
        const SectionHeader(title: 'Transaction history'),
        if (_transactions.isEmpty)
          const OpsEmpty(message: 'No wallet transactions for this agent yet.', icon: Icons.receipt_long_outlined)
        else
          ..._transactions.map(_transactionCard),
      ],
    );
  }

  Widget _balanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [OpsColors.brand.withValues(alpha: 0.35), OpsColors.card],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: OpsColors.brand.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SPENDABLE WALLET BALANCE',
            style: TextStyle(color: Colors.white60, fontSize: 10, letterSpacing: 1.1, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            formatMoney(_balance),
            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'Live figure from the wallet engine (approved transactions only, commission deposits excluded).',
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _summaryGrid() {
    final tiles = <Widget>[
      StatTile(
        label: 'Total top-ups',
        value: formatMoney(_summary['totalTopups']),
        color: OpsColors.success,
        icon: Icons.arrow_downward,
      ),
      StatTile(
        label: 'Total spent',
        value: formatMoney(_summary['totalSpent'] ?? _summary['totalDeductions']),
        color: OpsColors.warning,
        icon: Icons.arrow_upward,
      ),
      StatTile(
        label: 'Commissions',
        value: formatMoney(_summary['totalCommissions']),
        color: OpsColors.info,
        icon: Icons.savings_outlined,
      ),
      StatTile(
        label: 'Withdrawals',
        value: formatMoney(_summary['totalWithdrawals']),
        color: OpsColors.danger,
        icon: Icons.outbound_outlined,
      ),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.75,
      children: tiles,
    );
  }

  Widget _actions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeader(title: 'Wallet actions'),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: OpsColors.success),
                onPressed: _busy ? null : () => _adjust(isCredit: true),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Credit'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: OpsColors.danger),
                onPressed: _busy ? null : () => _adjust(isCredit: false),
                icon: const Icon(Icons.remove, size: 18),
                label: const Text('Debit'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _syncBalance,
                icon: const Icon(Icons.sync, size: 18),
                label: const Text('Sync balance'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _validate,
                icon: const Icon(Icons.verified_outlined, size: 18),
                label: const Text('Validate'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _transactionCard(Map<String, dynamic> tx) {
    final type = (tx['transaction_type'] ?? '').toString();
    final status = (tx['status'] ?? '').toString();
    final amount = asAmount(tx['amount']);
    final credit = isCreditTransaction(type);
    final isCommission = type.toLowerCase() == 'commission_deposit';
    final tint = isCommission
        ? OpsColors.info
        : credit
            ? OpsColors.success
            : OpsColors.danger;
    final canReverse = type.toLowerCase() == 'topup' && status.toLowerCase() == 'approved';
    final isPendingTopup = type.toLowerCase() == 'topup' && status.toLowerCase() == 'pending';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    transactionTypeLabel(type),
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                StatusChip(status: status),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${isCommission ? '' : (credit ? '+ ' : '- ')}${formatMoney(amount)}',
              style: TextStyle(color: tint, fontWeight: FontWeight.w700, fontSize: 17),
            ),
            const SizedBox(height: 6),
            Text(
              pick(tx, const ['description'], fallback: 'No description'),
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 6),
            DetailRow(label: 'Reference', value: pick(tx, const ['reference_code'])),
            DetailRow(label: 'Created', value: formatDateTime(tx['created_at'])),
            if (pick(tx, const ['admin_notes'], fallback: '').isNotEmpty)
              DetailRow(label: 'Admin notes', value: pick(tx, const ['admin_notes'])),
            if (canReverse) ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(foregroundColor: OpsColors.warning),
                onPressed: _busy ? null : () => _reverse(tx),
                icon: const Icon(Icons.undo, size: 18),
                label: const Text('Reverse top-up'),
              ),
            ],
            if (isPendingTopup) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: OpsColors.success),
                      onPressed: _busy ? null : () => _approveTransaction(tx),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Approve'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(foregroundColor: OpsColors.danger),
                      onPressed: _busy ? null : () => _rejectTransaction(tx),
                      icon: const Icon(Icons.block, size: 18),
                      label: const Text('Reject'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'create_topup_sheet.dart';
import 'wallet_api.dart';
import 'wallet_dialogs.dart';

const _statusFilters = <String, String>{
  'pending': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'all': 'All',
};

/// The wallet top-up queue: list, filter, approve, reject, delete and create.
class PendingTopupsTab extends StatefulWidget {
  const PendingTopupsTab({super.key, required this.onQueueChanged});

  /// Fired after any mutation so the overview counters can be refreshed.
  final Future<void> Function() onQueueChanged;

  @override
  State<PendingTopupsTab> createState() => _PendingTopupsTabState();
}

class _PendingTopupsTabState extends State<PendingTopupsTab> {
  static const _pageSize = 25;

  String _status = 'pending';
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  List<Map<String, dynamic>> _rows = const [];
  int _total = 0;
  bool _hasMore = false;

  /// Id of the row currently being mutated — also the in-flight lock.
  String? _busyId;
  bool get _busy => _busyId != null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await WalletApi.topups(status: _status, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _rows = page.rows;
        _total = page.total;
        _hasMore = page.hasMore;
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

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final page = await WalletApi.topups(
        status: _status,
        limit: _pageSize,
        offset: _rows.length,
      );
      if (!mounted) return;
      setState(() {
        _rows = [..._rows, ...page.rows];
        _total = page.total;
        _hasMore = page.hasMore;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      showWalletSnack(context, walletErrorText(e));
    }
  }

  Future<void> _afterMutation() async {
    await _load();
    if (!mounted) return;
    await widget.onQueueChanged();
  }

  String _agentName(Map<String, dynamic> row) =>
      pick(row, const ['agents.full_name', 'agent_name', 'full_name'], fallback: 'Agent');

  String _agentPhone(Map<String, dynamic> row) =>
      pick(row, const ['agents.phone_number', 'agent_phone', 'phone_number'], fallback: '');

  String _agentLabel(Map<String, dynamic> row) {
    final phone = _agentPhone(row);
    final name = _agentName(row);
    return phone.isEmpty || phone == '—' ? name : '$name ($phone)';
  }

  // ---------------------------------------------------------------- actions

  Future<void> _approve(Map<String, dynamic> row) async {
    if (_busy) return;
    final id = (row['id'] ?? '').toString();
    final amount = asAmount(row['amount']);
    final reference = pick(row, const ['payment_reference'], fallback: '');

    final confirmed = await confirmMoneyAction(
      context: context,
      title: 'Approve top-up request',
      agentName: _agentLabel(row),
      amount: amount,
      isCredit: true,
      reason: reference.isEmpty ? null : 'Payment reference: $reference',
      note: 'Top-ups are never auto-credited. Confirming here is the approval that credits '
          'the agent wallet.',
      confirmLabel: 'Approve & credit',
    );
    if (!confirmed || !mounted) return;

    setState(() => _busyId = id);
    String message;
    bool ok = false;
    try {
      final data = await WalletApi.approveTopupRequest(id);
      final balance = asAmount(data['balance']);
      message = data['idempotent'] == true
          ? 'Already credited earlier — no new credit was made. Balance is ${formatMoney(balance)}.'
          : 'Approved and credited ${formatMoney(amount)}. New balance ${formatMoney(balance)}.';
      ok = true;
    } catch (e) {
      message = walletErrorText(e);
    }
    if (!mounted) return;
    setState(() => _busyId = null);
    showWalletSnack(context, message, success: ok);
    await _afterMutation();
  }

  Future<void> _reject(Map<String, dynamic> row) async {
    if (_busy) return;
    final id = (row['id'] ?? '').toString();
    final amount = asAmount(row['amount']);

    final reason = await askReason(
      context: context,
      title: 'Reject top-up request',
      message: 'Rejecting leaves the wallet untouched — ${formatMoney(amount)} will not be '
          'credited to ${_agentName(row)}.',
      label: 'Reason (optional)',
      required: false,
    );
    if (reason == null || !mounted) return;

    final confirmed = await confirmPlainAction(
      context: context,
      title: 'Confirm rejection',
      message: 'Reject the ${formatMoney(amount)} request from ${_agentLabel(row)}? '
          'No money moves.',
      confirmLabel: 'Reject request',
    );
    if (!confirmed || !mounted) return;

    setState(() => _busyId = id);
    String message;
    bool ok = false;
    bool refresh = true;
    try {
      final data = await WalletApi.rejectTopupRequest(id, reason: reason);
      message = data['idempotent'] == true
          ? 'This request was already rejected.'
          : (data['message'] ?? 'Top-up request rejected').toString();
      ok = true;
    } on AdminApiException catch (e) {
      if (e.statusCode == 400) {
        message = 'Already approved and credited — reject is not possible. '
            'Reverse the top-up from the agent\'s wallet instead.';
      } else if (e.statusCode == 409) {
        message = 'This request is no longer pending — the list has been refreshed.';
      } else {
        message = walletErrorText(e);
      }
      refresh = true;
    } catch (e) {
      message = walletErrorText(e);
    }
    if (!mounted) return;
    setState(() => _busyId = null);
    showWalletSnack(context, message, success: ok);
    if (refresh) await _afterMutation();
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    if (_busy) return;
    final id = (row['id'] ?? '').toString();
    final amount = asAmount(row['amount']);
    final status = (row['status'] ?? '').toString();

    final confirmed = await confirmPlainAction(
      context: context,
      title: 'Delete request record',
      message: 'Remove the $status ${formatMoney(amount)} request from ${_agentLabel(row)}? '
          'This only deletes the request record — any credit that was already made stays.',
      confirmLabel: 'Delete',
    );
    if (!confirmed || !mounted) return;

    setState(() => _busyId = id);
    String message;
    bool ok = false;
    try {
      final data = await WalletApi.deleteTopupRequest(id);
      message = (data['message'] ?? 'Top-up request deleted').toString();
      ok = true;
    } catch (e) {
      message = walletErrorText(e);
    }
    if (!mounted) return;
    setState(() => _busyId = null);
    showWalletSnack(context, message, success: ok);
    await _afterMutation();
  }

  Future<void> _create() async {
    if (_busy) return;
    final created = await showCreateTopupSheet(context);
    if (!mounted || !created) return;
    if (_status != 'pending') {
      setState(() => _status = 'pending');
    }
    await _afterMutation();
  }

  // ------------------------------------------------------------------- view

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _toolbar(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: _list(),
          ),
        ),
      ],
    );
  }

  Widget _toolbar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _busy ? null : _create,
              icon: const Icon(Icons.playlist_add, size: 18),
              label: const Text('New top-up request (queues, no credit)'),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _statusFilters.entries.map((entry) {
                final selected = _status == entry.key;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(entry.value),
                    selected: selected,
                    onSelected: _busy
                        ? null
                        : (_) {
                            if (selected) return;
                            setState(() => _status = entry.key);
                            _load();
                          },
                    selectedColor: OpsColors.brand.withValues(alpha: 0.3),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _list() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [OpsError(message: _error!, onRetry: _load)],
      );
    }
    if (_rows.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          OpsEmpty(
            message: _status == 'pending'
                ? 'No top-up requests are waiting for approval.'
                : 'No ${_statusFilters[_status]?.toLowerCase()} top-up requests.',
            icon: Icons.done_all,
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 28),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: _rows.length + 2,
      itemBuilder: (_, i) {
        if (i == 0) return _countBanner();
        if (i <= _rows.length) return _topupCard(_rows[i - 1]);
        return _footer();
      },
    );
  }

  Widget _countBanner() {
    final pending = _status == 'pending';
    final color = pending && _total > 0 ? OpsColors.warning : OpsColors.info;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Icon(pending ? Icons.pending_actions : Icons.receipt_long, color: color, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                pending
                    ? '$_total request${_total == 1 ? '' : 's'} awaiting your approval — '
                        'nothing is credited until you approve.'
                    : 'Showing ${_rows.length} of $_total ${_statusFilters[_status]?.toLowerCase()} requests.',
                style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _footer() {
    if (!_hasMore) {
      return const Padding(
        padding: EdgeInsets.only(top: 8),
        child: Text(
          'End of list.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white24, fontSize: 11),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: OutlinedButton.icon(
        onPressed: _loadingMore ? null : _loadMore,
        icon: _loadingMore
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.expand_more, size: 18),
        label: Text(_loadingMore ? 'Loading…' : 'Load more (${_rows.length} of $_total)'),
      ),
    );
  }

  Widget _topupCard(Map<String, dynamic> row) {
    final id = (row['id'] ?? '').toString();
    final status = (row['status'] ?? '').toString().toLowerCase();
    final amount = asAmount(row['amount']);
    final isPending = status == 'pending';
    final rowBusy = _busyId == id;
    final tint = OpsColors.statusColor(status);

    return Card(
      color: isPending ? OpsColors.warning.withValues(alpha: 0.07) : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    _agentName(row),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
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
              '+ ${formatMoney(amount)}',
              style: TextStyle(color: tint, fontSize: 22, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            DetailRow(label: 'Phone', value: _agentPhone(row).isEmpty ? '—' : _agentPhone(row)),
            DetailRow(label: 'Reference', value: pick(row, const ['payment_reference'])),
            DetailRow(label: 'Method', value: pick(row, const ['payment_method'])),
            DetailRow(label: 'Requested', value: formatDateTime(row['created_at'])),
            if (row['approved_at'] != null)
              DetailRow(label: 'Resolved', value: formatDateTime(row['approved_at'])),
            if (pick(row, const ['admin_notes'], fallback: '').isNotEmpty)
              DetailRow(label: 'Admin notes', value: pick(row, const ['admin_notes'])),
            const SizedBox(height: 12),
            if (rowBusy)
              const LinearProgressIndicator(minHeight: 2)
            else if (isPending)
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: OpsColors.success),
                      onPressed: _busy ? null : () => _approve(row),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Approve'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(foregroundColor: OpsColors.danger),
                      onPressed: _busy ? null : () => _reject(row),
                      icon: const Icon(Icons.block, size: 18),
                      label: const Text('Reject'),
                    ),
                  ),
                ],
              )
            else
              Row(
                children: [
                  Expanded(
                    child: Text(
                      status == 'approved'
                          ? 'Credited. To undo, reverse the top-up from the agent\'s wallet.'
                          : 'Rejected — no money moved.',
                      style: const TextStyle(color: Colors.white38, fontSize: 11),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton.icon(
                    style: TextButton.styleFrom(foregroundColor: OpsColors.danger),
                    onPressed: _busy ? null : () => _delete(row),
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: const Text('Delete'),
                  ),
                ],
              ),
            if (isPending)
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: Text(
                  'Pending requests cannot be deleted — approve or reject first.',
                  style: TextStyle(color: Colors.white24, fontSize: 11),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

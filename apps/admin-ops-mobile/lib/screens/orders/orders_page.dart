import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'order_common.dart';
import 'order_models.dart';

const _pageSize = 25;

const _statusFilters = <({String value, String label})>[
  (value: 'all', label: 'All orders'),
  (value: 'pending', label: 'Pending'),
  (value: 'processing', label: 'Processing'),
  (value: 'completed', label: 'Completed'),
  (value: 'canceled', label: 'Canceled'),
  (value: 'failed', label: 'Failed'),
];

const _paymentFilters = <({String value, String label})>[
  (value: 'all', label: 'Any payment'),
  (value: 'wallet', label: 'Wallet'),
  (value: 'manual', label: 'Manual'),
];

const _providerFilters = <({String value, String label})>[
  (value: 'all', label: 'All networks'),
  (value: 'MTN', label: 'MTN'),
  (value: 'Telecel', label: 'Telecel'),
  (value: 'AirtelTigo', label: 'AirtelTigo'),
];

const _defaultAdminMessage =
    'We cannot verify this manual order or find proof of payment. Check and ensure you pay '
    'manually to 0557943392 (Alternative Payment Name: Francis Ani-Johnson). Make sure to also '
    'use the payment ID or reference number to ensure your order is processed. If you have paid '
    'but our system did not detect it, send proof of payment to 0246827049. Thank You.';

/// Admin "Orders" tab — agent data orders from `data_orders`.
class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final _orders = <DataOrder>[];

  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _offset = 0;
  int _total = 0;
  bool _hasMore = false;

  String _status = 'all';
  String _payment = 'all';
  String _provider = 'all';
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<DataOrder> get _visible => _orders
      .where((o) => _payment == 'all' || o.paymentMethod == _payment)
      .where((o) => o.matches(_search))
      .toList();

  Future<void> _load({bool more = false}) async {
    if (more && (_loadingMore || !_hasMore)) return;
    setState(() {
      if (more) {
        _loadingMore = true;
      } else {
        _loading = true;
        _error = null;
      }
    });

    final offset = more ? _offset : 0;
    try {
      final res = await AdminApi.instance.getJson(
        '/api/admin/data-orders',
        query: {
          'limit': _pageSize,
          'offset': offset,
          if (_status != 'all') 'status': _status,
          if (_provider != 'all') 'provider': _provider,
        },
      );
      if (!mounted) return;

      final data = res['data'];
      final rows = data is List
          ? data.whereType<Map>().map((e) => DataOrder(e.cast<String, dynamic>())).toList()
          : <DataOrder>[];
      final meta = res['meta'] is Map ? (res['meta'] as Map).cast<String, dynamic>() : const {};

      setState(() {
        if (more) {
          _orders.addAll(rows);
        } else {
          _orders
            ..clear()
            ..addAll(rows);
        }
        _offset = offset + _pageSize;
        _total = (meta['total'] as num?)?.toInt() ?? _orders.length;
        _hasMore = meta['hasMore'] == true && rows.isNotEmpty;
        _loading = false;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadingMore = false;
        if (!more) _error = describeApiError(e);
      });
      if (more) showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  Future<void> _openDetail(DataOrder order) async {
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: OpsColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => _OrderDetailSheet(order: order),
    );
    if (changed == true && mounted) await _load();
  }

  int _countBy(String status) => _orders.where((o) => o.status == status).length;

  @override
  Widget build(BuildContext context) {
    final visible = _visible;

    return RefreshIndicator(
      onRefresh: _load,
      color: OpsColors.brand,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SectionHeader(
            title: 'Data order management',
            subtitle: '$_total total · ${visible.length} shown',
            trailing: IconButton(
              tooltip: 'Refresh',
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _loading ? null : _load,
            ),
          ),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.1,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            children: [
              StatTile(
                label: 'Total orders',
                value: '$_total',
                icon: Icons.receipt_long_outlined,
              ),
              StatTile(
                label: 'Pending (loaded)',
                value: '${_countBy('pending')}',
                color: OpsColors.warning,
                icon: Icons.schedule_rounded,
              ),
              StatTile(
                label: 'Processing (loaded)',
                value: '${_countBy('processing')}',
                color: OpsColors.info,
                icon: Icons.sync_rounded,
              ),
              StatTile(
                label: 'Completed (loaded)',
                value: '${_countBy('completed')}',
                color: OpsColors.success,
                icon: Icons.check_circle_outline,
              ),
            ],
          ),
          const SizedBox(height: 14),
          OpsSearchField(
            hint: 'Search agent, phone, reference, bundle…',
            onChanged: (v) => setState(() => _search = v),
          ),
          const SizedBox(height: 10),
          OpsFilterBar(
            options: _statusFilters,
            selected: _status,
            onSelected: (v) {
              if (v == _status) return;
              setState(() => _status = v);
              _load();
            },
          ),
          const SizedBox(height: 8),
          OpsFilterBar(
            options: _providerFilters,
            selected: _provider,
            onSelected: (v) {
              if (v == _provider) return;
              setState(() => _provider = v);
              _load();
            },
          ),
          const SizedBox(height: 8),
          OpsFilterBar(
            options: _paymentFilters,
            selected: _payment,
            onSelected: (v) => setState(() => _payment = v),
          ),
          const SizedBox(height: 16),
          if (_error != null)
            OpsError(message: _error!, onRetry: _load)
          else if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (visible.isEmpty)
            OpsEmpty(
              message: _search.isNotEmpty || _status != 'all' || _payment != 'all' || _provider != 'all'
                  ? 'No orders match the current filters.'
                  : 'No data orders yet. New agent orders will appear here.',
              icon: Icons.storage_rounded,
            )
          else
            ...visible.map(
              (o) => _OrderCard(order: o, onTap: () => _openDetail(o)),
            ),
          if (!_loading && _error == null && _hasMore) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _loadingMore ? null : () => _load(more: true),
              icon: _loadingMore
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.expand_more_rounded),
              label: Text(_loadingMore ? 'Loading…' : 'Load more orders'),
            ),
          ],
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.onTap});

  final DataOrder order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: OpsColors.border),
      ),
      child: InkWell(
        onTap: onTap,
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
                      order.bundleName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusChip(status: order.status),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  OpsPill(
                    label: order.isWallet ? 'Wallet' : 'Manual',
                    color: order.isWallet ? OpsColors.brand : OpsColors.info,
                    icon: order.isWallet
                        ? Icons.account_balance_wallet_outlined
                        : Icons.credit_card_rounded,
                  ),
                  if (order.provider.isNotEmpty)
                    OpsPill(label: order.provider, color: OpsColors.warning),
                  if (order.commissionPaid)
                    const OpsPill(label: 'Commission paid', color: OpsColors.success),
                ],
              ),
              const SizedBox(height: 10),
              _CardLine(icon: Icons.person_outline, text: order.agentName),
              _CardLine(icon: Icons.phone_iphone_rounded, text: order.recipientPhone),
              _CardLine(icon: Icons.tag_rounded, text: order.reference),
              _CardLine(icon: Icons.schedule_rounded, text: formatDateTime(order.createdAt)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(
                    formatMoney(order.price),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: OpsColors.success,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Commission ${formatMoney(order.commission)}',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Colors.white54),
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Colors.white38),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CardLine extends StatelessWidget {
  const _CardLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: Colors.white38),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12.5, color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderDetailSheet extends StatefulWidget {
  const _OrderDetailSheet({required this.order});

  final DataOrder order;

  @override
  State<_OrderDetailSheet> createState() => _OrderDetailSheetState();
}

class _OrderDetailSheetState extends State<_OrderDetailSheet> {
  late DataOrder _order = widget.order;
  String? _busyAction;
  bool _changed = false;

  bool get _busy => _busyAction != null;

  Future<void> _setStatus(String status) async {
    if (_order.status == status) return;
    final label = status[0].toUpperCase() + status.substring(1);
    final ok = await confirmAction(
      context,
      title: 'Mark as $label?',
      message: status == 'completed'
          ? 'Completing the order finalises it and calculates the agent commission. This cannot be undone.'
          : 'The order status will change from ${_order.status} to $status.',
      confirmLabel: 'Mark $label',
      destructive: status == 'canceled' || status == 'failed',
    );
    if (!ok || !mounted) return;

    setState(() => _busyAction = status);
    try {
      final res = await AdminApi.instance.patch(
        '/api/admin/data-orders/${_order.id}',
        body: {'status': status},
      );
      if (!mounted) return;
      final data = res['data'];
      setState(() {
        if (data is Map) _order = DataOrder(data.cast<String, dynamic>());
        _busyAction = null;
        _changed = true;
      });
      showOpsSnack(context, 'Order marked $label');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyAction = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  Future<void> _sendMessage() async {
    final controller = TextEditingController(
      text: _order.adminMessage.isNotEmpty ? _order.adminMessage : _defaultAdminMessage,
    );
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OpsColors.card,
        title: const Text('Message to agent'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Shown to the agent on their dashboard for this order.',
                style: TextStyle(fontSize: 12, color: Colors.white54),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 7,
                minLines: 4,
                decoration: const InputDecoration(hintText: 'Message…'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Send'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (text == null || text.isEmpty || !mounted) return;

    setState(() => _busyAction = 'message');
    try {
      // PUT is the only route that accepts an admin message; it requires a status,
      // so the current status is resent unchanged.
      final res = await AdminApi.instance.put(
        '/api/admin/data-orders',
        body: {
          'orderId': _order.id,
          'status': _order.status,
          'adminMessage': text,
        },
      );
      if (!mounted) return;
      final data = res['data'];
      setState(() {
        if (data is Map) {
          final merged = Map<String, dynamic>.from(_order.raw)
            ..addAll(data.cast<String, dynamic>());
          _order = DataOrder(merged);
        } else {
          _order.raw['admin_message'] = text;
        }
        _busyAction = null;
        _changed = true;
      });
      showOpsSnack(context, 'Message sent to agent');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyAction = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  Future<void> _delete() async {
    final ok = await confirmAction(
      context,
      title: 'Delete order?',
      message: 'This permanently removes the order from the database. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok || !mounted) return;

    setState(() => _busyAction = 'delete');
    try {
      await AdminApi.instance.delete('/api/admin/data-orders/${_order.id}');
      if (!mounted) return;
      showOpsSnack(context, 'Order deleted');
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyAction = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = _order;
    final locked = o.isLocked;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.82,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) => PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) Navigator.pop(context, _changed);
        },
        child: ListView(
          controller: scrollController,
          padding: EdgeInsets.fromLTRB(
            16,
            12,
            16,
            24 + MediaQuery.of(context).viewInsets.bottom,
          ),
          children: [
            SheetHeader(
              title: o.bundleName,
              subtitle: 'Order ${o.id}',
              trailing: StatusChip(status: o.status),
            ),
            const SizedBox(height: 16),
            CopyField(label: 'Recipient phone', value: o.recipientPhone, color: OpsColors.brand),
            const SizedBox(height: 8),
            CopyField(label: 'Payment reference', value: o.reference, color: OpsColors.info),
            const SizedBox(height: 16),
            const Text(
              'ORDER DETAILS',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.6,
                fontWeight: FontWeight.w700,
                color: Colors.white38,
              ),
            ),
            const SizedBox(height: 6),
            DetailRow(label: 'Agent', value: o.agentName),
            DetailRow(label: 'Agent phone', value: o.agentPhone),
            DetailRow(label: 'Network', value: o.provider.isEmpty ? '—' : o.provider),
            DetailRow(label: 'Bundle price', value: formatMoney(o.price)),
            DetailRow(
              label: 'Commission',
              value: formatMoney(o.commission),
              valueColor: OpsColors.success,
            ),
            DetailRow(label: 'Commission paid', value: o.commissionPaid ? 'Yes' : 'No'),
            DetailRow(label: 'Payment method', value: o.isWallet ? 'Wallet' : 'Manual'),
            DetailRow(label: 'Validity', value: o.validityDays.isEmpty ? '—' : '${o.validityDays} days'),
            if (o.bundleStatus.isNotEmpty)
              DetailRow(
                label: 'Bundle data',
                value: o.bundleStatus,
                valueColor: o.bundleStatus == 'valid' ? OpsColors.success : OpsColors.warning,
              ),
            DetailRow(label: 'Placed', value: formatDateTime(o.createdAt)),
            DetailRow(label: 'Updated', value: formatDateTime(o.updatedAt)),
            if (o.adminMessage.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: OpsColors.warning.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: OpsColors.warning.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ADMIN MESSAGE',
                      style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 0.5,
                        fontWeight: FontWeight.w700,
                        color: OpsColors.warning,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      o.adminMessage,
                      style: const TextStyle(fontSize: 12.5, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),
            const Text(
              'ACTIONS',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.6,
                fontWeight: FontWeight.w700,
                color: Colors.white38,
              ),
            ),
            const SizedBox(height: 8),
            if (locked)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  'This order is ${o.status}; its status can no longer be changed.',
                  style: const TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ),
            SheetAction(
              icon: Icons.sync_rounded,
              label: 'Mark processing',
              color: OpsColors.info,
              busy: _busyAction == 'processing',
              onPressed: locked || _busy || o.status == 'processing'
                  ? null
                  : () => _setStatus('processing'),
            ),
            const SizedBox(height: 8),
            SheetAction(
              icon: Icons.check_circle_outline,
              label: 'Mark completed',
              color: OpsColors.success,
              busy: _busyAction == 'completed',
              onPressed: locked || _busy ? null : () => _setStatus('completed'),
            ),
            const SizedBox(height: 8),
            SheetAction(
              icon: Icons.schedule_rounded,
              label: 'Move back to pending',
              color: OpsColors.warning,
              busy: _busyAction == 'pending',
              onPressed:
                  locked || _busy || o.status == 'pending' ? null : () => _setStatus('pending'),
            ),
            const SizedBox(height: 8),
            SheetAction(
              icon: Icons.cancel_outlined,
              label: 'Cancel order',
              color: OpsColors.danger,
              busy: _busyAction == 'canceled',
              onPressed: locked || _busy ? null : () => _setStatus('canceled'),
            ),
            const SizedBox(height: 8),
            SheetAction(
              icon: Icons.report_gmailerrorred_rounded,
              label: 'Mark failed',
              color: OpsColors.danger,
              busy: _busyAction == 'failed',
              onPressed: locked || _busy || o.status == 'failed' ? null : () => _setStatus('failed'),
            ),
            const SizedBox(height: 14),
            SheetAction(
              icon: Icons.forum_outlined,
              label: o.adminMessage.isEmpty ? 'Send message to agent' : 'Edit agent message',
              color: OpsColors.brand,
              busy: _busyAction == 'message',
              onPressed: _busy ? null : _sendMessage,
            ),
            const SizedBox(height: 8),
            SheetAction(
              icon: Icons.delete_outline_rounded,
              label: o.isDeletable
                  ? 'Delete order'
                  : 'Delete unavailable for ${o.status} orders',
              color: OpsColors.danger,
              busy: _busyAction == 'delete',
              onPressed: !o.isDeletable || _busy ? null : _delete,
            ),
            const SizedBox(height: 14),
            TextButton(
              onPressed: () => Navigator.pop(context, _changed),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}

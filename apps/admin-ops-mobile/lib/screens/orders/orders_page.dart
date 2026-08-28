import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'order_common.dart';
import 'order_models.dart';

const _pageSize = 25;

/// Mirrors the website's single "Filter Orders" dropdown.
const _filters = <({String value, String label})>[
  (value: 'all', label: 'All Orders'),
  (value: 'pending', label: 'Pending'),
  (value: 'processing', label: 'Processing'),
  (value: 'completed', label: 'Completed'),
  (value: 'canceled', label: 'Canceled'),
  (value: 'manual', label: 'Manual Orders'),
  (value: 'wallet', label: 'Wallet Orders'),
];

const _statusOptions = <String>['pending', 'processing', 'completed', 'canceled'];

const _defaultAdminMessage =
    'We cannot verify this manual order or find proof of payment. Check and ensure you pay '
    'manually to 0557943392 (Alternative Payment Name: Francis Ani-Johnson). Make sure to also '
    'use the payment ID or reference number to ensure your order is processed. If you have paid '
    'but our system did not detect it, send proof of payment to 0246827049. Thank You.';

/// Admin "Orders" tab — agent data orders from `data_orders`.
///
/// Deliberately kept as flat as the website's Orders tab: one search box, one
/// filter dropdown, and each card carries its own actions. No detail sheet.
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
  String? _busyOrderId;
  int _offset = 0;
  int _total = 0;
  bool _hasMore = false;

  String _filter = 'all';
  String _search = '';

  bool get _filterIsPayment => _filter == 'manual' || _filter == 'wallet';

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<DataOrder> get _visible => _orders
      .where((o) => !_filterIsPayment || o.paymentMethod == _filter)
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
          if (!_filterIsPayment && _filter != 'all') 'status': _filter,
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

  void _replace(DataOrder order, Map<String, dynamic> fresh) {
    final merged = Map<String, dynamic>.from(order.raw)..addAll(fresh);
    final i = _orders.indexWhere((o) => o.id == order.id);
    if (i != -1) _orders[i] = DataOrder(merged);
  }

  Future<void> _setStatus(DataOrder order, String status) async {
    if (order.status == status || _busyOrderId != null) return;
    final label = status[0].toUpperCase() + status.substring(1);
    final ok = await confirmAction(
      context,
      title: 'Mark as $label?',
      message: status == 'completed'
          ? 'Completing the order finalises it and calculates the agent commission.'
          : 'The order status will change from ${order.status} to $status.',
      confirmLabel: 'Mark $label',
      destructive: status == 'canceled',
    );
    if (!ok || !mounted) return;

    setState(() => _busyOrderId = order.id);
    try {
      final res = await AdminApi.instance.patch(
        '/api/admin/data-orders/${order.id}',
        body: {'status': status},
      );
      if (!mounted) return;
      final data = res['data'];
      setState(() {
        if (data is Map) _replace(order, data.cast<String, dynamic>());
        _busyOrderId = null;
      });
      showOpsSnack(context, 'Order marked $label');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyOrderId = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  Future<void> _sendMessage(DataOrder order) async {
    final controller = TextEditingController(
      text: order.adminMessage.isNotEmpty ? order.adminMessage : _defaultAdminMessage,
    );
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OpsColors.card,
        title: const Text('Send Message to Agent'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'This message will be visible to the agent in their dashboard.',
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

    setState(() => _busyOrderId = order.id);
    try {
      // PUT is the only route that accepts an admin message; it requires a
      // status, so the current status is resent unchanged.
      await AdminApi.instance.put(
        '/api/admin/data-orders',
        body: {
          'orderId': order.id,
          'status': order.status,
          'adminMessage': text,
        },
      );
      if (!mounted) return;
      setState(() {
        _replace(order, {'admin_message': text});
        _busyOrderId = null;
      });
      showOpsSnack(context, 'Message sent to agent');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyOrderId = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  Future<void> _delete(DataOrder order) async {
    if (!order.isDeletable) {
      showOpsSnack(
        context,
        'Orders with status ${order.status} cannot be deleted.',
        success: false,
      );
      return;
    }
    final ok = await confirmAction(
      context,
      title: 'Delete this order?',
      message: 'This permanently removes the order from the database. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok || !mounted) return;

    setState(() => _busyOrderId = order.id);
    try {
      await AdminApi.instance.delete('/api/admin/data-orders/${order.id}');
      if (!mounted) return;
      setState(() {
        _orders.removeWhere((o) => o.id == order.id);
        if (_total > 0) _total--;
        _busyOrderId = null;
      });
      showOpsSnack(context, 'Order deleted');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyOrderId = null);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

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
            title: 'Orders',
            subtitle: '$_total total · ${visible.length} shown',
            trailing: IconButton(
              tooltip: 'Refresh',
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _loading ? null : _load,
            ),
          ),
          OpsSearchField(
            hint: 'Search orders…',
            onChanged: (v) => setState(() => _search = v),
          ),
          const SizedBox(height: 10),
          _FilterDropdown(
            value: _filter,
            onChanged: (v) {
              if (v == _filter) return;
              final wasPaymentOnly = _filterIsPayment;
              setState(() => _filter = v);
              // Payment filters are applied to the loaded page client-side, so
              // only a status change needs a refetch.
              if (!(wasPaymentOnly && _filterIsPayment)) _load();
            },
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
              message: _search.isNotEmpty || _filter != 'all'
                  ? 'No matching orders found.'
                  : 'No data orders yet. New agent orders will appear here.',
              icon: Icons.storage_rounded,
            )
          else
            ...visible.map(
              (o) => _OrderCard(
                order: o,
                busy: _busyOrderId == o.id,
                onStatus: (s) => _setStatus(o, s),
                onMessage: () => _sendMessage(o),
                onDelete: () => _delete(o),
              ),
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

class _FilterDropdown extends StatelessWidget {
  const _FilterDropdown({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      key: ValueKey(value),
      initialValue: value,
      isExpanded: true,
      dropdownColor: OpsColors.card,
      decoration: const InputDecoration(
        prefixIcon: Icon(Icons.filter_list_rounded, size: 18),
        isDense: true,
      ),
      items: _filters
          .map((f) => DropdownMenuItem(value: f.value, child: Text(f.label)))
          .toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.order,
    required this.busy,
    required this.onStatus,
    required this.onMessage,
    required this.onDelete,
  });

  final DataOrder order;
  final bool busy;
  final ValueChanged<String> onStatus;
  final VoidCallback onMessage;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: OpsColors.border),
      ),
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
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                  ),
                ),
                const SizedBox(width: 8),
                StatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: 6),
            OpsPill(
              label: order.isWallet ? 'Wallet' : 'Manual',
              color: order.isWallet ? OpsColors.brand : OpsColors.info,
              icon: order.isWallet
                  ? Icons.account_balance_wallet_outlined
                  : Icons.credit_card_rounded,
            ),
            const SizedBox(height: 10),
            _Line(label: 'Agent', value: order.agentName),
            _Line(label: 'To', value: order.recipientPhone, copyable: true),
            _Line(label: 'Reference', value: order.reference, copyable: true),
            _Line(label: 'Ordered', value: formatDateTime(order.createdAt)),
            const SizedBox(height: 8),
            Text(
              formatMoney(order.price),
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: OpsColors.success,
              ),
            ),
            Text(
              'Commission: ${formatMoney(order.commission)}',
              style: const TextStyle(fontSize: 12, color: Colors.white54),
            ),
            const Divider(height: 22, color: OpsColors.border),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    key: ValueKey('${order.id}-${order.status}'),
                    initialValue:
                        _statusOptions.contains(order.status) ? order.status : null,
                    isExpanded: true,
                    dropdownColor: OpsColors.card,
                    decoration: const InputDecoration(isDense: true),
                    items: _statusOptions
                        .map(
                          (s) => DropdownMenuItem(
                            value: s,
                            child: Text(s[0].toUpperCase() + s.substring(1)),
                          ),
                        )
                        .toList(),
                    onChanged: busy || order.isLocked
                        ? null
                        : (v) {
                            if (v != null) onStatus(v);
                          },
                  ),
                ),
                const SizedBox(width: 6),
                IconButton(
                  tooltip: order.adminMessage.isEmpty ? 'Send message' : 'Edit message',
                  icon: Icon(
                    order.adminMessage.isEmpty
                        ? Icons.forum_outlined
                        : Icons.mark_email_read_outlined,
                    color: OpsColors.info,
                  ),
                  onPressed: busy ? null : onMessage,
                ),
                IconButton(
                  tooltip: 'Delete order',
                  icon: const Icon(Icons.delete_outline_rounded, color: OpsColors.danger),
                  onPressed: busy ? null : onDelete,
                ),
              ],
            ),
            if (order.adminMessage.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                'Admin message: ${order.adminMessage}',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11.5, color: OpsColors.warning),
              ),
            ],
            if (order.isLocked)
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  'Status is final and can no longer be changed.',
                  style: TextStyle(fontSize: 11.5, color: Colors.white38),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.label, required this.value, this.copyable = false});

  final String label;
  final String value;
  final bool copyable;

  @override
  Widget build(BuildContext context) {
    final shown = value.trim().isEmpty ? '—' : value;
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: Colors.white54,
            ),
          ),
          Expanded(
            child: Text(
              shown,
              style: const TextStyle(fontSize: 12.5, color: Colors.white),
            ),
          ),
          if (copyable && shown != '—')
            IconButton(
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              icon: const Icon(Icons.copy_rounded, size: 15, color: OpsColors.info),
              tooltip: 'Copy $label',
              onPressed: () => copyValue(context, shown, label),
            ),
        ],
      ),
    );
  }
}

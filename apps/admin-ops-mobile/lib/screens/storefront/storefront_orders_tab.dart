import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'storefront_api.dart';
import 'storefront_common.dart';

const _orderStatuses = <String>['Pending', 'Processing', 'Completed', 'Cancelled'];

const _orderFilters = <MapEntry<String, String>>[
  MapEntry('all', 'All'),
  MapEntry('Pending', 'Pending'),
  MapEntry('Processing', 'Processing'),
  MapEntry('Completed', 'Completed'),
  MapEntry('Cancelled', 'Cancelled'),
];

String orderItemLabel(Map<String, dynamic> o) {
  final title = (o['item_title'] ?? '').toString().trim();
  if (o['order_type'] == 'wholesale_product') {
    final qty = asInt(o['quantity']);
    final suffix = qty > 1 ? ' ×$qty' : '';
    return '${title.isEmpty ? 'Wholesale product' : title}$suffix';
  }
  final bundle = asMap(o['data_bundles']);
  final name = (bundle?['name'] ?? '').toString().trim();
  if (name.isNotEmpty) {
    final provider = (bundle?['provider'] ?? '').toString();
    final size = bundle?['size_gb'];
    return '$name ($provider ${size ?? '?'}GB)';
  }
  return title.isEmpty ? 'Data bundle' : title;
}

String orderCustomerLabel(Map<String, dynamic> o) {
  final buyer = asMap(o['buyer_details']);
  if (buyer != null && buyer.isNotEmpty) {
    final parts = <String>[
      for (final key in ['full_name', 'contact_number', 'phone', 'location', 'address'])
        if ((buyer[key] ?? '').toString().trim().isNotEmpty) buyer[key].toString().trim(),
    ];
    // `contact_number` and `phone` are alternates — keep only the first present.
    final deduped = <String>[];
    for (final p in parts) {
      if (!deduped.contains(p)) deduped.add(p);
    }
    if (deduped.isNotEmpty) return deduped.join(' · ');
    return 'Buyer details on file';
  }
  final phone = (o['customer_phone'] ?? '').toString().trim();
  return phone.isEmpty ? '—' : phone;
}

class StorefrontOrdersTab extends StatefulWidget {
  const StorefrontOrdersTab({super.key, required this.pendingCount});

  final ValueNotifier<int> pendingCount;

  @override
  State<StorefrontOrdersTab> createState() => StorefrontOrdersTabState();
}

class StorefrontOrdersTabState extends State<StorefrontOrdersTab>
    with AutomaticKeepAliveClientMixin {
  bool _loading = true;
  bool _deletingCompleted = false;
  bool _exporting = false;
  String? _error;
  String _status = 'all';
  String _search = '';
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  List<Map<String, dynamic>> _orders = const [];
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
      final result = await StorefrontApi.instance.fetchOrders(
        page: _page,
        status: _status,
        search: _search,
      );
      if (!mounted) return;
      setState(() {
        _orders = result.items;
        _totalPages = result.totalPages;
        _total = result.total;
        _loading = false;
      });
      widget.pendingCount.value = result.pendingCount;
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeAdminError(e);
        _loading = false;
      });
    }
  }

  void _applyStatus(String status) {
    if (status == _status) return;
    setState(() {
      _status = status;
      _page = 1;
    });
    load();
  }

  void _applySearch(String search) {
    if (search.trim() == _search) return;
    setState(() {
      _search = search.trim();
      _page = 1;
    });
    load();
  }

  void _goToPage(int page) {
    setState(() => _page = page);
    load();
  }

  Future<void> _updateStatus(Map<String, dynamic> order, String status) async {
    final id = (order['id'] ?? '').toString();
    if (id.isEmpty || order['status'] == status) return;

    if (status == 'Cancelled') {
      final ok = await confirmAction(
        context,
        title: 'Cancel this order?',
        message:
            'The buyer will see this storefront order as cancelled. You can still set it back to '
            'another status afterwards.',
        confirmLabel: 'Cancel order',
        destructive: true,
      );
      if (!ok) return;
    }

    if (!mounted) return;
    setState(() => _busyIds.add(id));
    try {
      await StorefrontApi.instance.updateOrderStatus(id, status);
      if (!mounted) return;
      showOpsSnack(context, 'Order marked $status');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _busyIds.remove(id));
    }
    await load();
  }

  Future<void> _deleteCompleted() async {
    final ok = await confirmAction(
      context,
      title: 'Delete all completed orders?',
      message:
          'This permanently removes every order with status "Completed" from the storefront '
          'transaction log. Pending, processing and cancelled orders are not affected. '
          'This cannot be undone.',
      confirmLabel: 'Delete completed',
      destructive: true,
    );
    if (!ok || !mounted) return;

    setState(() => _deletingCompleted = true);
    try {
      final count = await StorefrontApi.instance.deleteCompletedOrders();
      if (!mounted) return;
      showOpsSnack(context, 'Removed $count completed order(s)');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _deletingCompleted = false);
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
        final result = await StorefrontApi.instance.fetchOrders(
          page: page,
          limit: kStorefrontExportLimit,
          status: _status,
          search: _search,
        );
        all.addAll(result.items);
        totalPages = result.totalPages;
        page += 1;
      }
      final csv = buildCsv(
        const [
          'Order ID',
          'Agent',
          'Bundle/Product',
          'Customer',
          'Base Cost',
          'Markup',
          'Total Paid',
          'Status',
          'Date',
        ],
        [
          for (final o in all)
            [
              o['id'],
              pick(o, ['agents.full_name', 'agent_id'], fallback: ''),
              orderItemLabel(o),
              (o['customer_phone'] ?? '').toString().trim().isNotEmpty
                  ? o['customer_phone']
                  : orderCustomerLabel(o),
              asDouble(o['base_cost']).toStringAsFixed(2),
              asDouble(o['agent_markup']).toStringAsFixed(2),
              asDouble(o['total_paid']).toStringAsFixed(2),
              o['status'],
              o['created_at'],
            ],
        ],
      );
      if (!mounted) return;
      await copyToClipboard(context, csv, 'CSV for ${all.length} order(s)');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  void _openDetail(Map<String, dynamic> order) {
    showOpsSheet<void>(
      context: context,
      title: orderItemLabel(order),
      subtitle: 'Order ${(order['id'] ?? '').toString()}',
      builder: (sheetCtx) => _OrderDetailSheet(
        order: order,
        onStatus: (status) async {
          Navigator.pop(sheetCtx);
          await _updateStatus(order, status);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final gross = _orders.fold<double>(0, (sum, o) => sum + asDouble(o['total_paid']));
    final markup = _orders.fold<double>(0, (sum, o) => sum + asDouble(o['agent_markup']));

    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Row(
            children: [
              Expanded(
                child: StatTile(
                  label: 'Pending',
                  value: '${widget.pendingCount.value}',
                  color: OpsColors.warning,
                  icon: Icons.hourglass_bottom,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatTile(
                  label: 'Page volume',
                  value: formatMoney(gross),
                  color: OpsColors.brand,
                  icon: Icons.payments_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatTile(
                  label: 'Page markup',
                  value: formatMoney(markup),
                  color: OpsColors.info,
                  icon: Icons.trending_up,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          OpsSearchField(
            hint: 'Agent, customer phone, or order ID…',
            onChanged: _applySearch,
          ),
          const SizedBox(height: 12),
          OpsFilterBar(options: _orderFilters, value: _status, onChanged: _applyStatus),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OpsActionButton(
                  icon: Icons.copy_all_outlined,
                  label: 'Copy CSV',
                  busy: _exporting,
                  color: OpsColors.info,
                  onPressed: _loading ? null : _exportCsv,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OpsActionButton(
                  icon: Icons.delete_sweep_outlined,
                  label: 'Purge done',
                  busy: _deletingCompleted,
                  color: OpsColors.danger,
                  onPressed: _loading ? null : _deleteCompleted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          OpsListState(
            loading: _loading,
            error: _error,
            isEmpty: _orders.isEmpty,
            emptyIcon: Icons.receipt_long_outlined,
            emptyMessage: _search.isNotEmpty || _status != 'all'
                ? 'No orders match your filters.'
                : 'No storefront orders yet.',
            onRetry: load,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final order in _orders)
                  _OrderRow(
                    order: order,
                    busy: _busyIds.contains((order['id'] ?? '').toString()),
                    onTap: () => _openDetail(order),
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

class _OrderRow extends StatelessWidget {
  const _OrderRow({required this.order, required this.busy, required this.onTap});

  final Map<String, dynamic> order;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = (order['status'] ?? '').toString();
    final color = OpsColors.statusColor(status);
    final id = (order['id'] ?? '').toString();

    return OpsPanel(
      onTap: onTap,
      accent: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  orderItemLabel(order),
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                formatMoney(order['total_paid']),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            pick(order, ['agents.full_name'], fallback: 'Unknown agent'),
            style: const TextStyle(color: Colors.white70, fontSize: 12.5),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            orderCustomerLabel(order),
            style: const TextStyle(color: Colors.white54, fontSize: 12),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (busy)
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              else
                StatusChip(status: status),
              if (order['order_type'] == 'wholesale_product')
                const StatusChip(status: 'info', label: 'wholesale'),
              Text(
                'Base ${formatMoney(order['base_cost'])} · Markup ${formatMoney(order['agent_markup'])}',
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.schedule, size: 12, color: Colors.white24),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  formatDateTime(order['created_at']),
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ),
              Text(
                id.length > 8 ? '#${id.substring(0, 8)}' : '#$id',
                style: const TextStyle(color: Colors.white24, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OrderDetailSheet extends StatelessWidget {
  const _OrderDetailSheet({required this.order, required this.onStatus});

  final Map<String, dynamic> order;
  final Future<void> Function(String status) onStatus;

  @override
  Widget build(BuildContext context) {
    final status = (order['status'] ?? '').toString();
    final buyer = asMap(order['buyer_details']);
    final phone = (order['customer_phone'] ?? '').toString().trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            StatusChip(status: status),
            const Spacer(),
            Text(
              formatMoney(order['total_paid']),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const SectionHeader(title: 'Order'),
        DetailRow(label: 'Order ID', value: (order['id'] ?? '—').toString()),
        DetailRow(label: 'Reference', value: pick(order, ['paystack_reference'])),
        DetailRow(label: 'Type', value: pick(order, ['order_type'], fallback: 'data_bundle')),
        DetailRow(label: 'Item', value: orderItemLabel(order)),
        if (asInt(order['quantity']) > 0)
          DetailRow(label: 'Quantity', value: '${asInt(order['quantity'])}'),
        DetailRow(label: 'Base cost', value: formatMoney(order['base_cost'])),
        DetailRow(
          label: 'Agent markup',
          value: formatMoney(order['agent_markup']),
          valueColor: OpsColors.success,
        ),
        DetailRow(label: 'Total paid', value: formatMoney(order['total_paid'])),
        DetailRow(label: 'Created', value: formatDateTime(order['created_at'])),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Agent'),
        DetailRow(label: 'Name', value: pick(order, ['agents.full_name'])),
        DetailRow(label: 'Phone', value: pick(order, ['agents.phone_number'])),
        DetailRow(label: 'Agent ID', value: pick(order, ['agent_id'])),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Customer'),
        if (phone.isNotEmpty)
          Row(
            children: [
              Expanded(child: DetailRow(label: 'Phone', value: phone)),
              IconButton(
                tooltip: 'Copy customer phone',
                icon: const Icon(Icons.copy, size: 17),
                onPressed: () => copyToClipboard(context, phone, 'Customer phone'),
              ),
            ],
          ),
        if (buyer != null)
          for (final entry in buyer.entries)
            if ((entry.value ?? '').toString().trim().isNotEmpty)
              DetailRow(
                label: entry.key.replaceAll('_', ' '),
                value: entry.value.toString(),
              ),
        if (phone.isEmpty && (buyer == null || buyer.isEmpty))
          const DetailRow(label: 'Contact', value: 'No customer contact captured'),
        const SizedBox(height: 20),
        const SectionHeader(
          title: 'Change status',
          subtitle: 'Updates the storefront transaction log immediately',
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final option in _orderStatuses)
              _StatusActionChip(
                label: option,
                selected: option == status,
                onTap: option == status ? null : () => onStatus(option),
              ),
          ],
        ),
      ],
    );
  }
}

class _StatusActionChip extends StatelessWidget {
  const _StatusActionChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = OpsColors.statusColor(label);
    return Material(
      color: selected ? color.withValues(alpha: 0.22) : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: selected ? 0.8 : 0.35)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (selected) ...[
                Icon(Icons.check, size: 15, color: color),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

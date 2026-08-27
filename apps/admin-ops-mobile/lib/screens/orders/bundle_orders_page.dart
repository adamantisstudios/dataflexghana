import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'order_common.dart';
import 'order_models.dart';

const _pageStep = 24;

/// Admin "Data Bundle Orders Log" tab — guest / no-registration orders
/// recorded in `data_orders_log`.
class BundleOrdersPage extends StatefulWidget {
  const BundleOrdersPage({super.key});

  @override
  State<BundleOrdersPage> createState() => _BundleOrdersPageState();
}

class _BundleOrdersPageState extends State<BundleOrdersPage> {
  final _orders = <BundleLogOrder>[];

  bool _loading = true;
  String? _error;
  String _search = '';
  String _network = 'all';
  String _payment = 'all';
  int _shown = _pageStep;

  @override
  void initState() {
    super.initState();
    _load();
  }

  List<String> get _networks {
    final set = <String>{};
    for (final o in _orders) {
      if (o.network.trim().isNotEmpty) set.add(o.network);
    }
    final list = set.toList()..sort();
    return list;
  }

  List<String> get _paymentMethods {
    final set = <String>{};
    for (final o in _orders) {
      if (o.paymentMethod.trim().isNotEmpty) set.add(o.paymentMethod);
    }
    final list = set.toList()..sort();
    return list;
  }

  List<BundleLogOrder> get _filtered => _orders
      .where((o) => _network == 'all' || o.network == _network)
      .where((o) => _payment == 'all' || o.paymentMethod == _payment)
      .where((o) => o.matches(_search))
      .toList();

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await AdminApi.instance.getList(
        '/api/admin/data-orders/log-list',
        keys: const ['data'],
      );
      if (!mounted) return;
      setState(() {
        _orders
          ..clear()
          ..addAll(rows.map(BundleLogOrder.new));
        _shown = _pageStep;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = describeApiError(e);
      });
    }
  }

  Future<void> _openDetail(BundleLogOrder order) async {
    final deleted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: OpsColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => _LogDetailSheet(order: order),
    );
    if (deleted == true && mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final page = filtered.take(_shown).toList();
    final totalAmount = _orders.fold<double>(0, (sum, o) => sum + o.amount);

    final networkOptions = <({String value, String label})>[
      (value: 'all', label: 'All networks'),
      ..._networks.map((n) => (value: n, label: n)),
    ];
    final paymentOptions = <({String value, String label})>[
      (value: 'all', label: 'Any payment'),
      ..._paymentMethods.map(
        (p) => (value: p, label: p[0].toUpperCase() + p.substring(1)),
      ),
    ];

    return RefreshIndicator(
      onRefresh: _load,
      color: OpsColors.brand,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SectionHeader(
            title: 'Data bundle orders log',
            subtitle: 'Guest & no-registration bundle purchases',
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
                value: '${_orders.length}',
                icon: Icons.receipt_long_outlined,
              ),
              StatTile(
                label: 'Filtered results',
                value: '${filtered.length}',
                color: OpsColors.info,
                icon: Icons.filter_alt_outlined,
              ),
              StatTile(
                label: 'Total amount',
                value: formatMoney(totalAmount),
                color: OpsColors.success,
                icon: Icons.payments_outlined,
              ),
              StatTile(
                label: 'Active networks',
                value: '${_networks.length}',
                color: OpsColors.warning,
                icon: Icons.cell_tower_rounded,
              ),
            ],
          ),
          const SizedBox(height: 14),
          OpsSearchField(
            hint: 'Search phone, network, bundle, reference…',
            onChanged: (v) => setState(() {
              _search = v;
              _shown = _pageStep;
            }),
          ),
          if (networkOptions.length > 1) ...[
            const SizedBox(height: 10),
            OpsFilterBar(
              options: networkOptions,
              selected: _network,
              onSelected: (v) => setState(() {
                _network = v;
                _shown = _pageStep;
              }),
            ),
          ],
          if (paymentOptions.length > 1) ...[
            const SizedBox(height: 8),
            OpsFilterBar(
              options: paymentOptions,
              selected: _payment,
              onSelected: (v) => setState(() {
                _payment = v;
                _shown = _pageStep;
              }),
            ),
          ],
          const SizedBox(height: 16),
          if (_error != null)
            OpsError(message: _error!, onRetry: _load)
          else if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (page.isEmpty)
            OpsEmpty(
              message: _search.isNotEmpty || _network != 'all' || _payment != 'all'
                  ? 'No logged orders match the current filters.'
                  : 'No data bundle orders logged yet.',
              icon: Icons.history_rounded,
            )
          else ...[
            ...page.map((o) => _LogCard(order: o, onTap: () => _openDetail(o))),
            const SizedBox(height: 4),
            Center(
              child: Text(
                'Showing ${page.length} of ${filtered.length} orders',
                style: const TextStyle(fontSize: 12, color: Colors.white38),
              ),
            ),
            if (filtered.length > page.length) ...[
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () => setState(() => _shown += _pageStep),
                icon: const Icon(Icons.expand_more_rounded),
                label: const Text('Load more'),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _LogCard extends StatelessWidget {
  const _LogCard({required this.order, required this.onTap});

  final BundleLogOrder order;
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
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        OpsPill(label: order.network, color: OpsColors.info),
                        OpsPill(
                          label: order.paymentMethod,
                          color: order.paymentMethod == 'manual'
                              ? OpsColors.brand
                              : OpsColors.warning,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    formatDate(order.createdAt),
                    style: const TextStyle(fontSize: 11, color: Colors.white38),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.phone,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  Text(
                    formatMoney(order.amount),
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: OpsColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.sim_card_outlined, size: 14, color: Colors.white38),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.bundle,
                      style: const TextStyle(fontSize: 12.5, color: Colors.white70),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.tag_rounded, size: 14, color: Colors.white38),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.reference,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Colors.white70,
                        fontFamily: 'monospace',
                      ),
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

class _LogDetailSheet extends StatefulWidget {
  const _LogDetailSheet({required this.order});

  final BundleLogOrder order;

  @override
  State<_LogDetailSheet> createState() => _LogDetailSheetState();
}

class _LogDetailSheetState extends State<_LogDetailSheet> {
  bool _deleting = false;

  Future<void> _delete() async {
    final ok = await confirmAction(
      context,
      title: 'Delete logged order?',
      message: 'This permanently removes the log entry from the database. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok || !mounted) return;

    setState(() => _deleting = true);
    try {
      await AdminApi.instance.delete('/api/admin/data-orders/log/${widget.order.id}');
      if (!mounted) return;
      showOpsSnack(context, 'Logged order deleted');
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _deleting = false);
      showOpsSnack(context, describeApiError(e), success: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          SheetHeader(
            title: o.bundle,
            subtitle: 'Log entry ${o.id}',
            trailing: OpsPill(label: o.network, color: OpsColors.info),
          ),
          const SizedBox(height: 16),
          CopyField(label: 'Phone number', value: o.phone, color: OpsColors.brand),
          const SizedBox(height: 8),
          CopyField(label: 'Reference code', value: o.reference, color: OpsColors.info),
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
          DetailRow(label: 'Network', value: o.network),
          DetailRow(label: 'Data bundle', value: o.bundle),
          DetailRow(
            label: 'Amount',
            value: formatMoney(o.amount),
            valueColor: OpsColors.success,
          ),
          DetailRow(label: 'Payment method', value: o.paymentMethod),
          DetailRow(label: 'Logged', value: formatDateTime(o.createdAt)),
          DetailRow(label: 'Updated', value: formatDateTime(o.updatedAt)),
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
          SheetAction(
            icon: Icons.delete_outline_rounded,
            label: 'Delete log entry',
            color: OpsColors.danger,
            busy: _deleting,
            onPressed: _deleting ? null : _delete,
          ),
          const SizedBox(height: 14),
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

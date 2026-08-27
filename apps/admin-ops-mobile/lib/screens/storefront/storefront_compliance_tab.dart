import 'package:flutter/material.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'storefront_api.dart';
import 'storefront_common.dart';

const _complianceFilters = <MapEntry<String, String>>[
  MapEntry('all', 'All'),
  MapEntry('pending', 'Pending'),
  MapEntry('processing', 'Processing'),
  MapEntry('completed', 'Completed'),
  MapEntry('cancelled', 'Cancelled'),
  MapEntry('rejected', 'Rejected'),
];

const _complianceStatuses = <String>[
  'pending',
  'processing',
  'completed',
  'cancelled',
  'rejected',
];

String complianceStatusLabel(String status) {
  if (status == 'canceled') return 'Cancelled';
  if (status.isEmpty) return 'Unknown';
  return status[0].toUpperCase() + status.substring(1);
}

String complianceCustomerName(Map<String, dynamic>? data) {
  if (data == null) return '—';
  return pick(data, ['full_name', 'customer_name', 'name']);
}

String complianceCustomerPhone(Map<String, dynamic>? data) {
  if (data == null) return '—';
  return pick(data, ['contact_number', 'phone', 'phone_number']);
}

class StorefrontComplianceTab extends StatefulWidget {
  const StorefrontComplianceTab({super.key});

  @override
  State<StorefrontComplianceTab> createState() => StorefrontComplianceTabState();
}

class StorefrontComplianceTabState extends State<StorefrontComplianceTab>
    with AutomaticKeepAliveClientMixin {
  bool _loading = true;
  bool _exporting = false;
  String? _error;
  String _status = 'all';
  String _search = '';
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  List<Map<String, dynamic>> _rows = const [];
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
      final result = await StorefrontApi.instance.fetchCompliance(
        page: _page,
        status: _status,
        search: _search,
      );
      if (!mounted) return;
      setState(() {
        _rows = result.items;
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

  void _applyStatus(String status) {
    if (status == _status) return;
    setState(() {
      _status = status;
      _page = 1;
    });
    load();
  }

  void _applySearch(String value) {
    if (value.trim() == _search) return;
    setState(() {
      _search = value.trim();
      _page = 1;
    });
    load();
  }

  void _goToPage(int page) {
    setState(() => _page = page);
    load();
  }

  Future<void> _updateStatus(Map<String, dynamic> row, String status) async {
    final id = (row['id'] ?? '').toString();
    if (id.isEmpty || row['status'] == status) return;

    if (status == 'cancelled' || status == 'rejected') {
      final ok = await confirmAction(
        context,
        title: 'Mark as ${complianceStatusLabel(status)}?',
        message:
            'The agent will see this compliance submission as ${complianceStatusLabel(status).toLowerCase()}. '
            'You can change the status again later.',
        confirmLabel: complianceStatusLabel(status),
        destructive: true,
      );
      if (!ok) return;
    }

    if (!mounted) return;
    setState(() => _busyIds.add(id));
    try {
      await StorefrontApi.instance.updateComplianceStatus(id, status);
      if (!mounted) return;
      showOpsSnack(context, 'Marked as ${complianceStatusLabel(status)}');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _busyIds.remove(id));
    }
    await load();
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    final id = (row['id'] ?? '').toString();
    if (id.isEmpty) return;

    final ok = await confirmAction(
      context,
      title: 'Delete compliance submission?',
      message:
          'This permanently removes the ${pick(row, ['form_type'], fallback: 'compliance')} submission '
          'for ${pick(row, ['agent.full_name', 'agent_id'])}. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok || !mounted) return;

    setState(() => _busyIds.add(id));
    try {
      await StorefrontApi.instance.deleteComplianceSubmission(id);
      if (!mounted) return;
      showOpsSnack(context, 'Compliance submission deleted');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _busyIds.remove(id));
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
        final result = await StorefrontApi.instance.fetchCompliance(
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
        const ['Agent', 'Form Type', 'Customer Name', 'Phone', 'Status', 'Date'],
        [
          for (final row in all)
            [
              pick(row, ['agent.full_name', 'agent_id'], fallback: ''),
              row['form_type'] ?? '',
              complianceCustomerName(asMap(row['customer_data'])),
              complianceCustomerPhone(asMap(row['customer_data'])),
              complianceStatusLabel((row['status'] ?? '').toString()),
              row['created_at'] ?? '',
            ],
        ],
      );
      if (!mounted) return;
      await copyToClipboard(context, csv, 'CSV for ${all.length} submission(s)');
    } catch (e) {
      if (!mounted) return;
      showOpsSnack(context, describeAdminError(e), success: false);
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  void _openDetail(Map<String, dynamic> row) {
    showOpsSheet<void>(
      context: context,
      title: pick(row, ['form_type'], fallback: 'Compliance submission'),
      subtitle: complianceCustomerName(asMap(row['customer_data'])),
      builder: (sheetCtx) => _ComplianceDetailSheet(
        row: row,
        onStatus: (status) async {
          Navigator.pop(sheetCtx);
          await _updateStatus(row, status);
        },
        onDelete: () async {
          Navigator.pop(sheetCtx);
          await _delete(row);
        },
        onCopyRecord: () {
          final data = asMap(row['customer_data']) ?? const <String, dynamic>{};
          final text = data.entries
              .map((e) => '${e.key.replaceAll('_', ' ')}: ${e.value}')
              .join('\n');
          copyToClipboard(context, text, 'Submission details');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          const SectionHeader(
            title: 'Compliance submissions',
            subtitle: 'Customer registration forms captured through agent storefronts',
          ),
          OpsSearchField(hint: 'Search agent name or form type…', onChanged: _applySearch),
          const SizedBox(height: 12),
          OpsFilterBar(options: _complianceFilters, value: _status, onChanged: _applyStatus),
          const SizedBox(height: 12),
          OpsActionButton(
            icon: Icons.copy_all_outlined,
            label: 'Copy submissions CSV',
            busy: _exporting,
            color: OpsColors.info,
            onPressed: _loading ? null : _exportCsv,
          ),
          const SizedBox(height: 16),
          OpsListState(
            loading: _loading,
            error: _error,
            isEmpty: _rows.isEmpty,
            emptyIcon: Icons.assignment_outlined,
            emptyMessage: _search.isNotEmpty || _status != 'all'
                ? 'No submissions match your filters.'
                : 'No compliance submissions yet.',
            onRetry: load,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final row in _rows)
                  _ComplianceRow(
                    row: row,
                    busy: _busyIds.contains((row['id'] ?? '').toString()),
                    onTap: () => _openDetail(row),
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

class _ComplianceRow extends StatelessWidget {
  const _ComplianceRow({required this.row, required this.busy, required this.onTap});

  final Map<String, dynamic> row;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = (row['status'] ?? '').toString();
    final data = asMap(row['customer_data']);

    return OpsPanel(
      onTap: onTap,
      accent: OpsColors.statusColor(status),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  complianceCustomerName(data),
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 10),
              if (busy)
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              else
                StatusChip(status: status, label: complianceStatusLabel(status)),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            complianceCustomerPhone(data),
            style: const TextStyle(color: Colors.white54, fontSize: 12.5),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: OpsColors.cardAlt,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: OpsColors.border),
                ),
                child: Text(
                  pick(row, ['form_type'], fallback: 'form'),
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ),
              Text(
                pick(row, ['agent.full_name'], fallback: 'Unknown agent'),
                style: const TextStyle(fontSize: 11.5, color: Colors.white38),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.schedule, size: 12, color: Colors.white24),
              const SizedBox(width: 5),
              Text(
                formatDateTime(row['created_at']),
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ComplianceDetailSheet extends StatelessWidget {
  const _ComplianceDetailSheet({
    required this.row,
    required this.onStatus,
    required this.onDelete,
    required this.onCopyRecord,
  });

  final Map<String, dynamic> row;
  final Future<void> Function(String status) onStatus;
  final VoidCallback onDelete;
  final VoidCallback onCopyRecord;

  @override
  Widget build(BuildContext context) {
    final status = (row['status'] ?? '').toString();
    final data = asMap(row['customer_data']) ?? const <String, dynamic>{};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: StatusChip(status: status, label: complianceStatusLabel(status)),
        ),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Submission'),
        DetailRow(label: 'Submission ID', value: pick(row, ['id'])),
        DetailRow(label: 'Form type', value: pick(row, ['form_type'])),
        DetailRow(label: 'Submitted', value: formatDateTime(row['created_at'])),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Agent'),
        DetailRow(label: 'Name', value: pick(row, ['agent.full_name'])),
        DetailRow(label: 'Phone', value: pick(row, ['agent.phone_number'])),
        DetailRow(label: 'Agent ID', value: pick(row, ['agent_id'])),
        const SizedBox(height: 16),
        const SectionHeader(title: 'Customer data'),
        if (data.isEmpty)
          const DetailRow(label: 'Data', value: 'No customer fields captured')
        else
          for (final entry in data.entries)
            if ((entry.value ?? '').toString().trim().isNotEmpty)
              DetailRow(
                label: entry.key.replaceAll('_', ' '),
                value: entry.value.toString(),
              ),
        const SizedBox(height: 20),
        const SectionHeader(
          title: 'Change status',
          subtitle: 'Mirrors the website compliance queue',
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final option in _complianceStatuses)
              _ComplianceStatusChip(
                status: option,
                selected: option == status,
                onTap: option == status ? null : () => onStatus(option),
              ),
          ],
        ),
        const SizedBox(height: 22),
        OpsActionButton(
          icon: Icons.copy_all_outlined,
          label: 'Copy submission details',
          color: OpsColors.info,
          onPressed: onCopyRecord,
        ),
        const SizedBox(height: 10),
        OpsActionButton(
          icon: Icons.delete_outline,
          label: 'Delete submission',
          color: OpsColors.danger,
          onPressed: onDelete,
        ),
        const SizedBox(height: 8),
        const Text(
          'Official Form A PDF generation stays on the admin website — it returns a binary '
          'download this app cannot save.',
          style: TextStyle(color: Colors.white38, fontSize: 11.5, height: 1.35),
        ),
      ],
    );
  }
}

class _ComplianceStatusChip extends StatelessWidget {
  const _ComplianceStatusChip({
    required this.status,
    required this.selected,
    required this.onTap,
  });

  final String status;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = OpsColors.statusColor(status);
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
                complianceStatusLabel(status),
                style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

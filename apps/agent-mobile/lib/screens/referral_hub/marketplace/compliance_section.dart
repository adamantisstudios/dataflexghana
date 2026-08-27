import 'package:flutter/material.dart';

import '../../../services/api_client.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/display_format.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceComplianceSection.tsx: one Sole Proprietorship toggle
/// (margin locked at zero, fixed commission) plus the read-only submission log.
class ComplianceSection extends StatefulWidget {
  const ComplianceSection({super.key, required this.store});

  final StoreSettingsStore store;

  @override
  State<ComplianceSection> createState() => _ComplianceSectionState();
}

class _ComplianceSectionState extends State<ComplianceSection> with MarketplaceFeedback {
  /// Server-side default when /api/service-pricing is unavailable to the app.
  static const _agentCommission = 50.0;
  static const _itemId = 'sole_proprietorship';

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _submissions = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.store.load(force: force);
      final data = await ApiClient.instance.getComplianceSubmissions();
      final list = data['submissions'];
      _submissions = list is List
          ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : [];
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggle(bool visible) async {
    try {
      // The route normalises this id to the canonical compliance UUID.
      await widget.store.setVisible(
        itemType: 'compliance_form',
        itemId: _itemId,
        visible: visible,
        customMargin: 0,
      );
      snack(visible ? 'Form enabled on storefront' : 'Form hidden from storefront');
    } catch (e) {
      snackError(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final enabled = widget.store.complianceVisible;
        final busy = widget.store.isBusy('compliance_form', _itemId);

        return SectionBody(
          loading: _loading,
          error: _error,
          onRefresh: () => _load(force: true),
          children: [
            SectionHeader(
              title: 'Compliance services',
              subtitle: 'Enable Sole Proprietorship on your store so customers can pay and '
                  'complete registration there. Margin is locked at GHS 0 — you earn a fixed '
                  'commission per paid application.',
              icon: Icons.description_outlined,
            ),
            const InfoBanner(
              icon: Icons.push_pin_outlined,
              color: Color(0xFF8A6100),
              text: 'Payment required — the customer sends the exact fee via MoMo before the '
                  'form is submitted. Processing starts once payment is confirmed.',
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    EarnBadge(amount: _agentCommission, label: 'Earn'),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Sole Proprietorship Registration',
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Shows under Business Services on your public store. '
                                'The customer pays by card or MoMo on the storefront.',
                                style: TextStyle(fontSize: 11.5, color: DfColors.muted),
                              ),
                            ],
                          ),
                        ),
                        VisibilityToggle(
                          value: enabled,
                          busy: busy,
                          onLabel: 'On',
                          offLabel: 'Off',
                          onChanged: busy ? null : _toggle,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SubHeading('Customer applications (status only)'),
            if (_submissions.isEmpty)
              const Text(
                'No submitted applications yet.',
                style: TextStyle(color: DfColors.muted, fontSize: 12.5),
              )
            else
              ..._submissions.map((s) {
                final type = s['form_type']?.toString().replaceAll('_', ' ') ?? 'Form';
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    dense: true,
                    title: Text(type, style: const TextStyle(fontSize: 13.5)),
                    subtitle: Text(
                      '${DisplayFormat.dateAgo(s['created_at']?.toString())}'
                      '${s['amount_paid'] == null ? '' : ' · ${formatGhs(s['amount_paid'])}'}',
                      style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                    ),
                    trailing: TagChip(
                      s['status']?.toString() ?? 'pending',
                      color: DfColors.brandDark,
                    ),
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}

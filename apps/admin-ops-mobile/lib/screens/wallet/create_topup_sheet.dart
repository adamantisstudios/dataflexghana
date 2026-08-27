import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'wallet_api.dart';
import 'wallet_dialogs.dart';

/// Opens the "queue a top-up request" sheet. Resolves to true when a request
/// was created so the caller can reload the queue.
Future<bool> showCreateTopupSheet(BuildContext context) async {
  final created = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: OpsColors.cardAlt,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (_) => const CreateTopupSheet(),
  );
  return created ?? false;
}

/// Raises a PENDING top-up request for an agent.
///
/// This deliberately does not credit anything: the request lands in the queue
/// and a second, explicit approval is what moves money.
class CreateTopupSheet extends StatefulWidget {
  const CreateTopupSheet({super.key});

  @override
  State<CreateTopupSheet> createState() => _CreateTopupSheetState();
}

class _CreateTopupSheetState extends State<CreateTopupSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();

  Map<String, dynamic>? _agent;
  List<Map<String, dynamic>> _results = const [];
  bool _searching = false;
  bool _busy = false;
  String? _searchError;
  String _paymentMethod = 'manual';

  @override
  void dispose() {
    _amountCtrl.dispose();
    _referenceCtrl.dispose();
    super.dispose();
  }

  Future<void> _search(String term) async {
    final query = term.trim();
    if (query.isEmpty) {
      if (!mounted) return;
      setState(() {
        _results = const [];
        _searchError = null;
      });
      return;
    }
    setState(() {
      _searching = true;
      _searchError = null;
    });
    try {
      // `agents/list` ignores terms under 4 characters, so short queries use
      // the dedicated search route instead.
      final rows = query.length < 4
          ? await WalletApi.searchAgents(query)
          : await WalletApi.agents(search: query, limit: 25);
      if (!mounted) return;
      setState(() {
        _results = rows;
        _searching = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _searching = false;
        _searchError = walletErrorText(e);
      });
    }
  }

  String get _agentName =>
      _agent == null ? '' : pick(_agent!, const ['full_name', 'name'], fallback: 'Agent');

  String get _agentPhone => _agent == null ? '' : pick(_agent!, const ['phone_number', 'phone']);

  Future<void> _submit() async {
    if (_busy) return;
    if (_agent == null) {
      showWalletSnack(context, 'Select an agent first.');
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final amount = double.parse(_amountCtrl.text.trim());
    final reference = _referenceCtrl.text.trim();

    final confirmed = await confirmMoneyAction(
      context: context,
      title: 'Queue top-up request',
      agentName: _agentPhone.isEmpty ? _agentName : '$_agentName ($_agentPhone)',
      amount: amount,
      isCredit: true,
      reason: reference.isEmpty ? null : 'Payment reference: $reference',
      note: 'This only QUEUES a pending request — the agent is NOT credited yet. '
          'You still have to approve it from the pending queue as a separate step.',
      confirmLabel: 'Queue request',
    );
    if (!confirmed || !mounted) return;

    setState(() => _busy = true);
    try {
      await WalletApi.createTopupRequest(
        agentId: (_agent!['id'] ?? '').toString(),
        amount: amount,
        paymentReference: reference,
        paymentMethod: _paymentMethod,
      );
      if (!mounted) return;
      setState(() => _busy = false);
      showWalletSnack(
        context,
        'Request queued for ${formatMoney(amount)} — not credited yet. Approve it to credit $_agentName.',
        success: true,
      );
      Navigator.of(context).pop(true);
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
          showWalletSnack(context, 'Please wait — the request is still being created.');
        }
      },
      child: Padding(
        padding: EdgeInsets.only(bottom: viewInsets),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 4, 10, 6),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'New top-up request',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Close',
                      onPressed: _busy ? null : () => Navigator.of(context).pop(false),
                      icon: const Icon(Icons.close, size: 20),
                    ),
                  ],
                ),
              ),
              if (_busy) const LinearProgressIndicator(minHeight: 2),
              Flexible(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 28),
                  children: [
                    _queueNotice(),
                    const SizedBox(height: 16),
                    _agentSection(),
                    const SizedBox(height: 16),
                    _amountSection(),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _busy || _agent == null ? null : _submit,
                        icon: _busy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.playlist_add, size: 18),
                        label: Text(_busy ? 'Queueing…' : 'Queue request for approval'),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Step 2 of this flow is approving the request in the pending queue. '
                      'No money moves until then.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white38, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _queueNotice() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: OpsColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: OpsColors.warning.withValues(alpha: 0.45)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: OpsColors.warning, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'This queues a request only — it does NOT credit the agent. The wallet is credited '
              'when you approve the request in the pending queue.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _agentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeader(title: 'Agent', subtitle: 'Search by name, phone or email'),
        OpsSearchField(hint: 'Search agents…', onChanged: _search),
        const SizedBox(height: 10),
        if (_agent != null)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: OpsColors.brand.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: OpsColors.brand.withValues(alpha: 0.45)),
            ),
            child: Row(
              children: [
                const Icon(Icons.person, color: OpsColors.brand, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _agentName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        _agentPhone,
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Stored balance ${formatMoney(_agent!['wallet_balance'])}',
                        style: const TextStyle(color: Colors.white54, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _busy ? null : () => setState(() => _agent = null),
                  child: const Text('Change'),
                ),
              ],
            ),
          ),
        if (_searching)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 18),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_searchError != null)
          OpsError(message: _searchError!, onRetry: () => _search(''))
        else if (_agent == null && _results.isNotEmpty)
          ..._results.take(20).map(_resultTile)
        else if (_agent == null)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Text(
              'Search for the agent you received money from.',
              style: TextStyle(color: Colors.white38, fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _resultTile(Map<String, dynamic> agent) {
    return Card(
      child: ListTile(
        dense: true,
        title: Text(
          pick(agent, const ['full_name', 'name'], fallback: 'Unnamed agent'),
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${pick(agent, const ['phone_number', 'phone'])} • ${formatMoney(agent['wallet_balance'])}',
          style: const TextStyle(fontSize: 12, color: Colors.white54),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.white38),
        onTap: _busy
            ? null
            : () => setState(() {
                  _agent = agent;
                  _results = const [];
                }),
      ),
    );
  }

  Widget _amountSection() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionHeader(title: 'Request details'),
          TextFormField(
            controller: _amountCtrl,
            enabled: !_busy,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
            decoration: const InputDecoration(
              labelText: 'Amount (GHS)',
              prefixText: 'GHS ',
            ),
            validator: (raw) {
              final text = (raw ?? '').trim();
              if (text.isEmpty) return 'Enter an amount';
              final value = double.tryParse(text);
              if (value == null) return 'Amount must be a number';
              if (value <= 0) return 'Amount must be greater than 0';
              if (value > 1000000) return 'Amount looks too large';
              return null;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _referenceCtrl,
            enabled: !_busy,
            decoration: const InputDecoration(
              labelText: 'MoMo / payment reference (optional)',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _paymentMethod,
            decoration: const InputDecoration(labelText: 'Payment method'),
            items: const [
              DropdownMenuItem(value: 'manual', child: Text('Manual (MoMo received)')),
              DropdownMenuItem(value: 'paystack', child: Text('Paystack')),
            ],
            onChanged: _busy ? null : (v) => setState(() => _paymentMethod = v ?? 'manual'),
          ),
        ],
      ),
    );
  }
}

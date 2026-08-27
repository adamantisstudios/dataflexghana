import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';

/// Human-readable text for any failure raised while moving money.
String walletErrorText(Object error) {
  if (error is AdminApiException) {
    if (error.isUnauthorized) {
      return 'Admin session expired — sign in again.';
    }
    return error.message;
  }
  return error.toString();
}

void showWalletSnack(BuildContext context, String message, {bool success = false}) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: success ? OpsColors.brand : OpsColors.danger,
        duration: Duration(seconds: success ? 3 : 5),
      ),
    );
}

class AmountReason {
  const AmountReason({required this.amount, required this.reason});

  final double amount;
  final String reason;
}

/// Amount + reason capture for manual credits and debits.
///
/// Returns null when the admin backs out. Validation happens here so the
/// confirmation step only ever sees a positive, parsed amount.
Future<AmountReason?> askAmountAndReason({
  required BuildContext context,
  required String title,
  required String agentName,
  required bool isCredit,
}) {
  return showDialog<AmountReason>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _AmountReasonDialog(title: title, agentName: agentName, isCredit: isCredit),
  );
}

class _AmountReasonDialog extends StatefulWidget {
  const _AmountReasonDialog({
    required this.title,
    required this.agentName,
    required this.isCredit,
  });

  final String title;
  final String agentName;
  final bool isCredit;

  @override
  State<_AmountReasonDialog> createState() => _AmountReasonDialogState();
}

class _AmountReasonDialogState extends State<_AmountReasonDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();

  @override
  void dispose() {
    _amountCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final amount = double.parse(_amountCtrl.text.trim());
    Navigator.of(context).pop(
      AmountReason(amount: amount, reason: _reasonCtrl.text.trim()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tint = widget.isCredit ? OpsColors.success : OpsColors.danger;
    return AlertDialog(
      backgroundColor: OpsColors.card,
      title: Text(widget.title, style: TextStyle(color: tint)),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.agentName,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _amountCtrl,
                autofocus: true,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                ],
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
                controller: _reasonCtrl,
                maxLines: 2,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Reason (required)',
                  hintText: 'e.g. MoMo received offline',
                ),
                validator: (raw) =>
                    (raw ?? '').trim().isEmpty ? 'A reason is required for every adjustment' : null,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: tint),
          onPressed: _submit,
          child: const Text('Review'),
        ),
      ],
    );
  }
}

/// Free-text reason capture (reversals, rejections).
Future<String?> askReason({
  required BuildContext context,
  required String title,
  required String message,
  String label = 'Reason',
  bool required = true,
}) {
  return showDialog<String>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _ReasonDialog(title: title, message: message, label: label, required: required),
  );
}

class _ReasonDialog extends StatefulWidget {
  const _ReasonDialog({
    required this.title,
    required this.message,
    required this.label,
    required this.required,
  });

  final String title;
  final String message;
  final String label;
  final bool required;

  @override
  State<_ReasonDialog> createState() => _ReasonDialogState();
}

class _ReasonDialogState extends State<_ReasonDialog> {
  final _ctrl = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _ctrl.text.trim();
    if (widget.required && text.isEmpty) {
      setState(() => _error = 'A reason is required');
      return;
    }
    Navigator.of(context).pop(text);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: OpsColors.card,
      title: Text(widget.title),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.message, style: const TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 14),
            TextField(
              controller: _ctrl,
              autofocus: true,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(labelText: widget.label, errorText: _error),
              onChanged: (_) {
                if (_error != null) setState(() => _error = null);
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(onPressed: _submit, child: const Text('Continue')),
      ],
    );
  }
}

/// Final gate before any balance-changing call. Restates who, how much and
/// in which direction, and requires a deliberate confirm tap.
Future<bool> confirmMoneyAction({
  required BuildContext context,
  required String title,
  required String agentName,
  required double amount,
  required bool isCredit,
  String? reason,
  String? note,
  String confirmLabel = 'Confirm',
}) async {
  final tint = isCredit ? OpsColors.success : OpsColors.danger;
  final direction = isCredit ? 'CREDIT' : 'DEBIT';
  final ok = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: OpsColors.card,
      title: Row(
        children: [
          Icon(isCredit ? Icons.add_circle_outline : Icons.remove_circle_outline, color: tint),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 17))),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: tint.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: tint.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    direction,
                    style: TextStyle(color: tint, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${isCredit ? '+' : '-'} ${formatMoney(amount)}',
                    style: TextStyle(color: tint, fontSize: 26, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    agentName,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            if (reason != null && reason.trim().isNotEmpty) ...[
              const SizedBox(height: 12),
              DetailRow(label: 'Reason', value: reason.trim()),
            ],
            const SizedBox(height: 10),
            Text(
              note ??
                  'This moves real money immediately. Double-check the agent and the amount before confirming.',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: tint),
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// Confirmation for actions that do not change a balance (e.g. balance sync).
Future<bool> confirmPlainAction({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
}) async {
  final ok = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: OpsColors.card,
      title: Text(title),
      content: Text(message, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return ok ?? false;
}

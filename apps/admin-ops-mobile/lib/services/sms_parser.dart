// MoMo payment SMS parser (mirrors lib/ops/parse-momo-sms.ts)

class ParsedMomoSms {
  final double? amount;
  final String? reference;
  final String? transactionId;
  final String? payerName;
  final double? currentBalance;
  final double? availableBalance;
  final double? fee;
  final String raw;

  const ParsedMomoSms({
    required this.raw,
    this.amount,
    this.reference,
    this.transactionId,
    this.payerName,
    this.currentBalance,
    this.availableBalance,
    this.fee,
  });

  bool get isPaymentReceived =>
      raw.toLowerCase().contains('payment received') && transactionId != null;

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'reference': reference,
        'transaction_id': transactionId,
        'payer_name': payerName,
        'raw_sms': raw,
      };
}

double? _parseMoney(String? value) {
  if (value == null) return null;
  final cleaned = value.replaceAll(',', '').trim();
  return double.tryParse(cleaned);
}

ParsedMomoSms parseMomoPaymentSms(String rawSms) {
  final raw = rawSms.trim();
  final normalized = raw.replaceAll(RegExp(r'\s+'), ' ');

  final amountMatch = RegExp(
    r'Payment received for\s+GHS\s*([\d,.]+)',
    caseSensitive: false,
  ).firstMatch(normalized);

  final payerMatch = RegExp(
    r'from\s+(.+?)\s+(?:Current Balance|Available Balance|Reference:|Transaction ID:)',
    caseSensitive: false,
  ).firstMatch(normalized);

  final refMatch =
      RegExp(r'Reference:\s*([A-Za-z0-9]+)', caseSensitive: false).firstMatch(normalized);
  final txnMatch = RegExp(r'Transaction ID:\s*([A-Za-z0-9]+)', caseSensitive: false)
      .firstMatch(normalized);
  final currentBalMatch =
      RegExp(r'Current Balance:\s*GHS\s*([\d,.]+)', caseSensitive: false)
          .firstMatch(normalized);
  final availBalMatch =
      RegExp(r'Available Balance:\s*GHS\s*([\d,.]+)', caseSensitive: false)
          .firstMatch(normalized);
  final feeMatch =
      RegExp(r'TRANSACTION FEE:\s*([\d,.]+)', caseSensitive: false).firstMatch(normalized);

  String? reference = refMatch?.group(1)?.trim();
  if (reference != null && !RegExp(r'^\d{5}$').hasMatch(reference)) {
    final five = RegExp(r'\d{5}').firstMatch(reference);
    if (five != null) reference = five.group(0);
  }

  return ParsedMomoSms(
    raw: raw,
    amount: _parseMoney(amountMatch?.group(1)),
    reference: reference,
    transactionId: txnMatch?.group(1)?.trim(),
    payerName: payerMatch?.group(1)?.trim().replaceAll(RegExp(r'\s+'), ' '),
    currentBalance: _parseMoney(currentBalMatch?.group(1)),
    availableBalance: _parseMoney(availBalMatch?.group(1)),
    fee: _parseMoney(feeMatch?.group(1)),
  );
}

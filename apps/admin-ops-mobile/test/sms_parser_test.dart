import 'package:flutter_test/flutter_test.dart';
import 'package:admin_ops_mobile/services/sms_parser.dart';

void main() {
  test('parses sample 1 MoMo SMS', () {
    const sample =
        'Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR  Current Balance: GHS 131.47 . Available Balance: GHS 131.47. Reference: 71788. Transaction ID: 84157189921. TRANSACTION FEE: 0.00';
    final p = parseMomoPaymentSms(sample);
    expect(p.amount, 47.5);
    expect(p.reference, '71788');
    expect(p.transactionId, '84157189921');
    expect(p.payerName, contains('PHILIP'));
    expect(p.isPaymentReceived, isTrue);
  });

  test('parses sample 2 MoMo SMS', () {
    const sample =
        'Payment received for GHS 47.50 from ADZOYE  EMMANUEL ACCRA WEST Current Balance: GHS 82.25 . Available Balance: GHS 82.25. Reference: 43483. Transaction ID: 84101715279. TRANSACTION FEE: 0.00';
    final p = parseMomoPaymentSms(sample);
    expect(p.amount, 47.5);
    expect(p.reference, '43483');
    expect(p.transactionId, '84101715279');
  });
}

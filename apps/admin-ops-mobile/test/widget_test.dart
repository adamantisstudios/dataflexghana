import 'package:flutter_test/flutter_test.dart';

import 'package:admin_ops_mobile/main.dart';
import 'package:admin_ops_mobile/widgets/ops_widgets.dart';

void main() {
  group('OpsSection', () {
    test('resolves known section keys used by dashboard quick actions', () {
      expect(OpsSection.fromKey('wallet'), OpsSection.wallet);
      expect(OpsSection.fromKey('bundle_orders'), OpsSection.bundleOrders);
      expect(OpsSection.fromKey('agent_notifications'), OpsSection.agentNotifications);
    });

    test('falls back to home for an unknown key', () {
      expect(OpsSection.fromKey('nope'), OpsSection.home);
    });

    test('primary sections line up with the five bottom nav slots', () {
      final primary = OpsSection.values.where((s) => s.isPrimary).toList();
      expect(primary.length, 5);
      expect(primary.first, OpsSection.home);
      expect(primary.last, OpsSection.more);
    });

    test('money-touching sections require an admin session', () {
      expect(OpsSection.wallet.needsAdmin, isTrue);
      expect(OpsSection.orders.needsAdmin, isTrue);
      // Ops-device features must keep working without an admin sign-in.
      expect(OpsSection.smsLog.needsAdmin, isFalse);
      expect(OpsSection.settings.needsAdmin, isFalse);
    });
  });

  group('pick', () {
    test('returns the first non-empty candidate', () {
      final row = {'a': '', 'b': 'value'};
      expect(pick(row, ['a', 'b']), 'value');
    });

    test('resolves dotted paths into nested maps', () {
      final row = {
        'agents': {'full_name': 'Ama Mensah'},
      };
      expect(pick(row, ['agent_name', 'agents.full_name']), 'Ama Mensah');
    });

    test('falls back when nothing matches', () {
      expect(pick(const {}, ['missing'], fallback: 'n/a'), 'n/a');
    });
  });

  group('formatMoney', () {
    test('formats numbers and numeric strings alike', () {
      expect(formatMoney(12.5), 'GHS 12.50');
      expect(formatMoney('12.5'), 'GHS 12.50');
    });

    test('treats null and junk as zero rather than throwing', () {
      expect(formatMoney(null), 'GHS 0.00');
      expect(formatMoney('abc'), 'GHS 0.00');
    });
  });
}

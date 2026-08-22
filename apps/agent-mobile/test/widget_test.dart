import 'package:flutter_test/flutter_test.dart';
import 'package:agent_mobile/main.dart';

void main() {
  testWidgets('boots DataFlexAgentApp', (tester) async {
    await tester.pumpWidget(const DataFlexAgentApp());
    expect(find.byType(DataFlexAgentApp), findsOneWidget);
  });
}

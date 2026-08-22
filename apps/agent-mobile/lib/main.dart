import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'services/session_store.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DataFlexAgentApp());
}

class DataFlexAgentApp extends StatelessWidget {
  const DataFlexAgentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DataFlex Agent',
      debugShowCheckedModeBanner: false,
      theme: buildAgentTheme(),
      home: const _BootGate(),
    );
  }
}

class _BootGate extends StatefulWidget {
  const _BootGate();

  @override
  State<_BootGate> createState() => _BootGateState();
}

class _BootGateState extends State<_BootGate> {
  Widget? _home;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final agent = await SessionStore.instance.getAgent();
    if (!mounted) return;
    setState(() {
      _home = agent == null ? const LoginScreen() : const HomeShell();
    });
  }

  @override
  Widget build(BuildContext context) {
    return _home ??
        const Scaffold(
          body: Center(child: CircularProgressIndicator(color: DfColors.brand)),
        );
  }
}

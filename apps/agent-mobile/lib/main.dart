import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/photo_verification_gate.dart';
import 'services/session_store.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // A single bad row — most often an image URL a screen forgot to resolve —
  // must degrade to a placeholder rather than taking down the whole screen.
  ErrorWidget.builder = (FlutterErrorDetails details) {
    if (kDebugMode) {
      return ErrorWidget(details.exception);
    }
    return const _ContentUnavailable();
  };

  runApp(const DataFlexAgentApp());
}

class _ContentUnavailable extends StatelessWidget {
  const _ContentUnavailable();

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 40),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(8),
      color: DfColors.sand,
      child: const Icon(Icons.image_not_supported_outlined, size: 18, color: DfColors.muted),
    );
  }
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
      _home = agent == null
          ? const LoginScreen()
          : const PhotoVerificationGate(child: HomeShell());
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

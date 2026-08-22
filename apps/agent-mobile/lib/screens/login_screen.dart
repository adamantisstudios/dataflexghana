import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import 'home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _pendingToken;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _submitLogin() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.login(_phone.text, _password.text);
      if (data['requires2FA'] == true) {
        setState(() {
          _pendingToken = data['pendingToken']?.toString();
          _loading = false;
        });
        return;
      }
      final agent = data['agent'];
      if (agent is! Map) throw ApiException('Invalid login response');
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(agent));
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeShell()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit2fa() async {
    if (_pendingToken == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.verify2fa(code: _otp.text, pendingToken: _pendingToken!);
      final agent = data['agent'];
      if (agent is! Map) throw ApiException('Invalid 2FA response');
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(agent));
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeShell()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final needs2fa = _pendingToken != null;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A5C2A), Color(0xFF0E8F3D), Color(0xFFF3EFE6)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0, 0.38, 0.38],
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
            children: [
              Center(
                child: Image.asset('assets/images/dataflex_logo.png', height: 72),
              ),
              const SizedBox(height: 12),
              Text(
                'Agent App',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                needs2fa ? 'Enter your 2FA code' : 'Sign in to sell data & manage compliance',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: DfColors.card,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    if (!needs2fa) ...[
                      TextField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Phone number',
                          hintText: '024XXXXXXX',
                          prefixIcon: Icon(Icons.phone_iphone),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _password,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _obscure = !_obscure),
                            icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                          ),
                        ),
                      ),
                    ] else ...[
                      TextField(
                        controller: _otp,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Authenticator code',
                          prefixIcon: Icon(Icons.security),
                        ),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: DfColors.danger)),
                    ],
                    const SizedBox(height: 18),
                    ElevatedButton(
                      onPressed: _loading ? null : (needs2fa ? _submit2fa : _submitLogin),
                      child: _loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(needs2fa ? 'Verify & continue' : 'Sign in'),
                    ),
                    if (needs2fa)
                      TextButton(
                        onPressed: () => setState(() {
                          _pendingToken = null;
                          _otp.clear();
                        }),
                        child: const Text('Back to login'),
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
}

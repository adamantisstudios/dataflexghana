import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import 'home_shell.dart';
import 'photo_verification_gate.dart';
import 'registration_payment_screen.dart';

const _adminWhatsApp = '233246827049';

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
  bool _showContactAdmin = false;
  String _contactReason = '';

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _otp.dispose();
    super.dispose();
  }

  bool _isContactAdminFailure(ApiException e) {
    if (e.banned) return true;
    final m = e.message.toLowerCase();
    return e.statusCode == 404 ||
        m.contains('not found') ||
        m.contains('pending approval') ||
        m.contains('deactivated') ||
        m.contains('banned');
  }

  String _contactReasonFrom(ApiException e) {
    if (e.banned || e.message.toLowerCase().contains('deactivated') || e.message.toLowerCase().contains('banned')) {
      return 'banned';
    }
    if (e.message.toLowerCase().contains('pending approval')) return 'pending';
    return 'not_found';
  }

  Future<void> _openAdminWhatsApp() async {
    final phone = _phone.text.trim();
    final reasonLabel = switch (_contactReason) {
      'pending' => 'pending approval',
      'banned' => 'account deactivated / banned',
      _ => 'agent not found / need help signing in',
    };
    final message = '''Hello DataFlex Admin,

I need help signing into the Agent App.

Phone: ${phone.isEmpty ? '(not provided)' : phone}
Issue: $reasonLabel

Please assist. Thank you.''';
    final uri = Uri.parse('https://wa.me/$_adminWhatsApp?text=${Uri.encodeComponent(message)}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _submitLogin() async {
    setState(() {
      _loading = true;
      _error = null;
      _showContactAdmin = false;
      _contactReason = '';
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
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const PhotoVerificationGate(child: HomeShell())),
      );
    } on ApiException catch (e) {
      final contact = _isContactAdminFailure(e);
      setState(() {
        _error = e.message;
        _showContactAdmin = contact;
        _contactReason = contact ? _contactReasonFrom(e) : '';
      });
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
      _showContactAdmin = false;
    });
    try {
      final data = await ApiClient.instance.verify2fa(code: _otp.text, pendingToken: _pendingToken!);
      final agent = data['agent'];
      if (agent is! Map) throw ApiException('Invalid 2FA response');
      await SessionStore.instance.saveAgent(Map<String, dynamic>.from(agent));
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const PhotoVerificationGate(child: HomeShell())),
      );
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
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      body: Stack(
        children: [
          // Full-bleed brand plane
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF063D1C),
                  DfColors.brandDark,
                  DfColors.brand,
                  Color(0xFF1AA34A),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.0, 0.35, 0.72, 1.0],
              ),
            ),
          ),
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            bottom: size.height * 0.28,
            left: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 36, 24, 28),
              children: [
                const SizedBox(height: 12),
                Center(
                  child: Container(
                    width: 108,
                    height: 108,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.6), width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.28),
                          blurRadius: 28,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.asset(
                        'assets/images/app_logo.jpg',
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.bolt_rounded,
                          size: 56,
                          color: DfColors.brand,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'DataFlex Ghana',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  needs2fa
                      ? 'Enter your authenticator code'
                      : 'All the Data you need to start earning online.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 15,
                    height: 1.35,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
                  decoration: BoxDecoration(
                    color: DfColors.card,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 32,
                        offset: const Offset(0, 16),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        needs2fa ? 'Two-factor verification' : 'Sign in',
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: DfColors.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        needs2fa
                            ? 'Open your authenticator app and enter the 6-digit code.'
                            : 'Use the phone number linked to your agent account.',
                        style: const TextStyle(color: DfColors.muted, fontSize: 13),
                      ),
                      const SizedBox(height: 20),
                      if (!needs2fa) ...[
                        TextField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Phone number',
                            hintText: '024XXXXXXX',
                            prefixIcon: Icon(Icons.phone_iphone_rounded),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _password,
                          obscureText: _obscure,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _loading ? null : _submitLogin(),
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline_rounded),
                            suffixIcon: IconButton(
                              onPressed: () => setState(() => _obscure = !_obscure),
                              icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                            ),
                          ),
                        ),
                      ] else ...[
                        TextField(
                          controller: _otp,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _loading ? null : _submit2fa(),
                          decoration: const InputDecoration(
                            labelText: 'Authenticator code',
                            prefixIcon: Icon(Icons.security_rounded),
                          ),
                        ),
                      ],
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: DfColors.danger.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: DfColors.danger.withValues(alpha: 0.25)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.error_outline, color: DfColors.danger, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: const TextStyle(color: DfColors.danger, fontSize: 13, height: 1.35),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      if (_showContactAdmin) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _openAdminWhatsApp,
                          icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366)),
                          label: const Text('Contact admin on WhatsApp'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: DfColors.brandDark,
                            side: BorderSide(color: DfColors.brand.withValues(alpha: 0.35)),
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
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
                            _error = null;
                            _showContactAdmin = false;
                          }),
                          child: const Text('Back to login'),
                        ),
                      if (!needs2fa) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: Divider(color: DfColors.brand.withValues(alpha: 0.15))),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Text(
                                'New here?',
                                style: GoogleFonts.dmSans(color: DfColors.muted, fontSize: 12),
                              ),
                            ),
                            Expanded(child: Divider(color: DfColors.brand.withValues(alpha: 0.15))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const RegistrationPaymentScreen()),
                            );
                          },
                          child: Text(
                            'Register as DataFlex Agent',
                            style: GoogleFonts.dmSans(
                              fontWeight: FontWeight.w700,
                              color: DfColors.brandDark,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  'Official DataFlex Ghana agent app',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    color: Colors.white.withValues(alpha: 0.65),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'register_screen.dart';

const _momoPhoneDisplay = '+233 557 943 392';
const _momoPhoneDigits = '233557943392';
const _adminWhatsApp = '233246827049';
const _manualFee = 47.0;
const _paystackFeeGhs = 50;
const _paystackFeePesewas = 5000;
const _walletTopup = 5;

class RegistrationPaymentScreen extends StatefulWidget {
  const RegistrationPaymentScreen({super.key});

  @override
  State<RegistrationPaymentScreen> createState() => _RegistrationPaymentScreenState();
}

class _RegistrationPaymentScreenState extends State<RegistrationPaymentScreen> {
  final _name = TextEditingController(text: 'New Agent');
  final _email = TextEditingController();
  final _paystackRef = TextEditingController();

  String? _method; // manual | paystack
  bool _agreed = false;
  bool _loading = false;
  String? _error;

  // Manual flow
  String? _manualCode;
  bool _showManualPanel = false;

  // Paystack flow
  String? _paystackReference;
  bool _awaitingPaystackReturn = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _paystackRef.dispose();
    super.dispose();
  }

  String _generateCode() {
    final r = Random();
    return (10000 + r.nextInt(90000)).toString();
  }

  bool _validEmail(String email) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email.trim());
  }

  Future<void> _persistPayment({
    required String reference,
    required String method,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('payment_verified', true);
    await prefs.setString('payment_reference', reference);
    await prefs.setString('payment_method', method);
    await prefs.setString('paystack_name', _name.text.trim());
    if (_email.text.trim().isNotEmpty) {
      await prefs.setString('paystack_email', _email.text.trim());
    }
  }

  void _goToRegister({required String reference, required String method}) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => RegisterScreen(
          paymentReference: reference,
          paymentMethod: method,
          prefillName: _name.text.trim(),
        ),
      ),
    );
  }

  Future<void> _startManual() async {
    if (!_agreed) {
      setState(() => _error = 'Please accept the Terms & Conditions to continue.');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
      _method = 'manual';
    });
    final code = _generateCode();
    try {
      await ApiClient.instance.registerIntent(
        referenceCode: code,
        amount: _manualFee,
        agentName: _name.text.trim(),
        agentEmail: _email.text.trim().isEmpty ? null : _email.text.trim(),
      );
    } catch (_) {
      // Non-blocking — WhatsApp flow still works if persistence fails
    }
    if (!mounted) return;
    setState(() {
      _manualCode = code;
      _showManualPanel = true;
      _loading = false;
    });
  }

  Future<void> _completeManual() async {
    final code = _manualCode;
    if (code == null) return;
    setState(() => _loading = true);
    try {
      final timestamp = DateTime.now().toLocal().toString();
      final message = '''✅ *NEW AGENT REGISTRATION - MANUAL PAYMENT RECEIVED*

Hello Admin,

A new agent has completed manual payment and is ready to be registered on the platform.

📋 *PAYMENT INFORMATION:*
• Amount Received: ₵$_manualFee
• Reference Code: $code
• Payment Method: Manual (Mobile Money)
• Transaction Date: $timestamp
• Agent name: ${_name.text.trim()}

✅ *REQUIRED ACTION:*
1. Register this new agent in the admin dashboard
2. Credit their account with ₵$_walletTopup wallet credit for platform testing
3. Mark their account as APPROVED and ACTIVE

⏱️ *PRIORITY:* Please process within 30 minutes.

Reference Code: *$code*

Thank you!''';

      final uri = Uri.parse('https://wa.me/$_adminWhatsApp?text=${Uri.encodeComponent(message)}');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      await _persistPayment(reference: code, method: 'manual');
      if (!mounted) return;
      _goToRegister(reference: code, method: 'manual');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startPaystack() async {
    if (!_agreed) {
      setState(() => _error = 'Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!_validEmail(_email.text)) {
      setState(() => _error = 'A valid email is required for Paystack payment.');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
      _method = 'paystack';
    });
    try {
      final data = await ApiClient.instance.initializePaystackRegister(
        agentName: _name.text.trim().isEmpty ? 'New Agent' : _name.text.trim(),
        email: _email.text.trim(),
        amountPesewas: _paystackFeePesewas,
      );
      final url = data['authorization_url']?.toString();
      final ref = data['reference']?.toString();
      if (url == null || url.isEmpty || ref == null || ref.isEmpty) {
        throw ApiException('Invalid Paystack response');
      }
      _paystackReference = ref;
      _paystackRef.text = ref;
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) throw ApiException('Could not open Paystack checkout');
      if (!mounted) return;
      setState(() {
        _awaitingPaystackReturn = true;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _verifyPaystack() async {
    final ref = _paystackRef.text.trim().isNotEmpty
        ? _paystackRef.text.trim()
        : (_paystackReference ?? '');
    if (ref.isEmpty) {
      setState(() => _error = 'Enter your Paystack payment reference to verify.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.verifyPaystackRegister(ref);
      if (data['success'] != true) {
        throw ApiException(data['error']?.toString() ?? 'Payment verification failed');
      }
      await _persistPayment(reference: ref, method: 'paystack');
      if (!mounted) return;
      _goToRegister(reference: ref, method: 'paystack');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _dialMomo() async {
    final uri = Uri.parse('tel:$_momoPhoneDigits');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DfColors.sand,
      appBar: AppBar(
        title: const Text('Registration fee'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [DfColors.brandDark, DfColors.brand],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Join DataFlex',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Pay once, then complete your agent profile. Manual MoMo is ₵$_manualFee; Paystack is ₵$_paystackFeeGhs.',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Your full name',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email (required for Paystack)',
              hintText: 'you@example.com',
              prefixIcon: Icon(Icons.email_outlined),
            ),
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            value: _agreed,
            onChanged: (v) => setState(() => _agreed = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            activeColor: DfColors.brand,
            title: Text(
              'I have read and agree to the DataFlex Terms & Conditions and FAQ.',
              style: GoogleFonts.dmSans(fontSize: 13, color: DfColors.ink),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose payment method',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          _PaymentOptionTile(
            selected: _method == 'manual',
            title: 'Manual MoMo — ₵$_manualFee',
            subtitle: 'Send to $_momoPhoneDisplay with a 5-digit reference',
            icon: Icons.phone_android_rounded,
            onTap: _loading ? null : _startManual,
          ),
          const SizedBox(height: 10),
          _PaymentOptionTile(
            selected: _method == 'paystack',
            title: 'Paystack — ₵$_paystackFeeGhs',
            subtitle: 'Card or MoMo checkout via Paystack',
            icon: Icons.credit_card_rounded,
            onTap: _loading ? null : _startPaystack,
          ),
          if (_error != null) ...[
            const SizedBox(height: 14),
            Text(_error!, style: const TextStyle(color: DfColors.danger, height: 1.35)),
          ],
          if (_loading) ...[
            const SizedBox(height: 18),
            const Center(child: CircularProgressIndicator(color: DfColors.brand)),
          ],
          if (_showManualPanel && _manualCode != null) ...[
            const SizedBox(height: 20),
            _ManualPaymentPanel(
              code: _manualCode!,
              amount: _manualFee,
              momoDisplay: _momoPhoneDisplay,
              onDial: _dialMomo,
              onCopyCode: () async {
                await Clipboard.setData(ClipboardData(text: _manualCode!));
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reference code copied')),
                );
              },
              onPaid: _loading ? null : _completeManual,
            ),
          ],
          if (_awaitingPaystackReturn) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: DfColors.card,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Complete Paystack payment',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 17),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'After paying in the browser, return here and verify your payment reference.',
                    style: TextStyle(color: DfColors.muted, fontSize: 13, height: 1.35),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _paystackRef,
                    decoration: const InputDecoration(
                      labelText: 'Paystack reference',
                      prefixIcon: Icon(Icons.receipt_long_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _loading ? null : _verifyPaystack,
                    child: const Text('Verify payment & continue'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PaymentOptionTile extends StatelessWidget {
  const _PaymentOptionTile({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final bool selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? DfColors.brand.withValues(alpha: 0.1) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? DfColors.brand : DfColors.brand.withValues(alpha: 0.15),
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: DfColors.brand.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: DfColors.brandDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.dmSans(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(color: DfColors.muted, fontSize: 12, height: 1.3)),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle : Icons.chevron_right_rounded,
                color: selected ? DfColors.brand : DfColors.muted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ManualPaymentPanel extends StatelessWidget {
  const _ManualPaymentPanel({
    required this.code,
    required this.amount,
    required this.momoDisplay,
    required this.onDial,
    required this.onCopyCode,
    required this.onPaid,
  });

  final String code;
  final double amount;
  final String momoDisplay;
  final VoidCallback onDial;
  final VoidCallback onCopyCode;
  final VoidCallback? onPaid;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Manual payment details',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 17),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: DfColors.brand.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Text('Amount to pay', style: GoogleFonts.dmSans(color: DfColors.muted, fontSize: 12)),
                Text(
                  '₵${amount.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w800, color: DfColors.brandDark),
                ),
                const SizedBox(height: 8),
                Text('Your reference code', style: GoogleFonts.dmSans(color: DfColors.muted, fontSize: 12)),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      code,
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 4,
                        color: DfColors.ink,
                      ),
                    ),
                    IconButton(
                      onPressed: onCopyCode,
                      icon: const Icon(Icons.copy_rounded, size: 20, color: DfColors.brandDark),
                      tooltip: 'Copy code',
                    ),
                  ],
                ),
                const Text(
                  'Include this code in your MoMo payment reference / note',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: DfColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.account_balance_wallet_outlined, color: DfColors.brandDark),
            title: const Text('Send to'),
            subtitle: Text(momoDisplay, style: GoogleFonts.dmSans(fontWeight: FontWeight.w700)),
            trailing: IconButton(
              onPressed: onDial,
              icon: const Icon(Icons.call_rounded, color: DfColors.brand),
            ),
          ),
          const Text(
            'Receiver: Adamantis Solutions',
            style: TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 8),
          const Text(
            '1. Send the amount via Mobile Money\n'
            '2. Put the reference code in the payment note\n'
            '3. Tap “Payment sent” to notify admin on WhatsApp\n'
            '4. Continue to the registration form',
            style: TextStyle(color: DfColors.ink, fontSize: 13, height: 1.45),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: onPaid,
            child: const Text('Payment sent — notify admin'),
          ),
        ],
      ),
    );
  }
}

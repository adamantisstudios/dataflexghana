import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

const _adminWhatsApp = '233246827049';
const _termsUrl = 'https://www.dataflexghana.com/terms';
const _faqUrl = 'https://www.dataflexghana.com/faq';

const _regions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Brong-Ahafo',
  'Western North',
  'Ahafo',
  'Bono',
  'Bono East',
  'Oti',
  'North East',
  'Savannah',
];

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    this.paymentReference,
    this.paymentMethod,
    this.prefillName,
    this.referralCode,
  });

  final String? paymentReference;
  final String? paymentMethod;
  final String? prefillName;
  final String? referralCode;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  final _paymentLine = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  String? _region;
  bool _agreeToTerms = false;
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  bool _checkingPayment = true;
  bool _paymentOk = false;
  String? _error;
  bool _registered = false;
  String? _registeredName;
  String? _registeredPhone;

  @override
  void initState() {
    super.initState();
    if (widget.prefillName != null && widget.prefillName!.trim().isNotEmpty) {
      _fullName.text = widget.prefillName!.trim();
    }
    _checkPaymentGate();
  }

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    _paymentLine.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _checkPaymentGate() async {
    if (widget.paymentReference != null && widget.paymentReference!.isNotEmpty) {
      setState(() {
        _paymentOk = true;
        _checkingPayment = false;
      });
      return;
    }
    final prefs = await SharedPreferences.getInstance();
    final verified = prefs.getBool('payment_verified') == true;
    final ref = prefs.getString('payment_reference');
    if (!mounted) return;
    setState(() {
      _paymentOk = verified && ref != null && ref.isNotEmpty;
      _checkingPayment = false;
    });
  }

  Future<void> _clearPaymentFlags() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('payment_verified');
    await prefs.remove('payment_reference');
    await prefs.remove('payment_method');
  }

  Future<void> _contactAdminForApproval() async {
    final name = _registeredName ?? _fullName.text.trim();
    final phone = _registeredPhone ?? _phone.text.trim();
    final ref = widget.paymentReference ?? '';
    final method = widget.paymentMethod ?? 'unknown';
    final message = '''✅ *NEW AGENT REGISTRATION COMPLETE*

Hello Admin,

I have paid and submitted my DataFlex agent registration. Please approve my account.

📋 *DETAILS:*
• Full name: $name
• Phone: $phone
• Region: ${_region ?? ''}
• Payment method: $method
• Payment reference: $ref

Please mark my account as APPROVED so I can sign in. Thank you!''';

    final uri = Uri.parse('https://wa.me/$_adminWhatsApp?text=${Uri.encodeComponent(message)}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    final fullName = _fullName.text.trim();
    final phone = _phone.text.replaceAll(RegExp(r'\D'), '').trim();
    final paymentLine = _paymentLine.text.replaceAll(RegExp(r'\D'), '').trim();
    final password = _password.text;
    final confirm = _confirm.text;

    if (fullName.isEmpty || phone.isEmpty || paymentLine.isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }
    if (_region == null || _region!.trim().isEmpty) {
      setState(() => _error = 'Please select your region.');
      return;
    }
    if (password.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters long.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    if (!_agreeToTerms) {
      setState(() => _error = 'Please confirm you have read and agree to the Terms & Conditions.');
      return;
    }

    setState(() => _loading = true);
    try {
      final data = await ApiClient.instance.registerAgent(
        fullName: fullName,
        phoneNumber: phone,
        paymentLine: paymentLine,
        region: _region!,
        password: password,
        referralCode: widget.referralCode,
      );
      if (data['success'] != true && data['agent'] == null) {
        throw ApiException(data['error']?.toString() ?? 'Registration failed');
      }
      await _clearPaymentFlags();
      if (!mounted) return;
      setState(() {
        _registered = true;
        _registeredName = fullName;
        _registeredPhone = phone;
        _loading = false;
      });
    } on ApiException catch (e) {
      final duplicate = e.statusCode == 409 || e.message.toLowerCase().contains('already exists');
      setState(() {
        _error = duplicate
            ? 'An agent with this phone number already exists. Please sign in or contact support.'
            : e.message;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingPayment) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: DfColors.brand)),
      );
    }

    if (!_paymentOk) {
      return Scaffold(
        appBar: AppBar(title: const Text('Register')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded, size: 56, color: DfColors.brand),
              const SizedBox(height: 16),
              Text(
                'Payment required',
                style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              const Text(
                'Complete the registration fee payment before creating your agent account.',
                textAlign: TextAlign.center,
                style: TextStyle(color: DfColors.muted, height: 1.4),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Go to payment'),
              ),
            ],
          ),
        ),
      );
    }

    if (_registered) {
      return Scaffold(
        backgroundColor: DfColors.sand,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: DfColors.brand.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, size: 52, color: DfColors.brand),
                ),
                const SizedBox(height: 20),
                Text(
                  'Registration submitted',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                Text(
                  'Hi ${_registeredName ?? 'Agent'}, your account is pending admin approval. Contact admin on WhatsApp so they can activate you.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: DfColors.muted, height: 1.45, fontSize: 15),
                ),
                const SizedBox(height: 28),
                ElevatedButton.icon(
                  onPressed: _contactAdminForApproval,
                  icon: const Icon(Icons.chat_rounded),
                  label: const Text('Contact admin for approval'),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (_) => false,
                    );
                  },
                  child: const Text('Back to sign in'),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: DfColors.sand,
      appBar: AppBar(title: const Text('Create agent account')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Text(
            'Almost there',
            style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          const Text(
            'Fill in your details. An admin will approve your account after you submit.',
            style: TextStyle(color: DfColors.muted, height: 1.35),
          ),
          if (widget.paymentReference != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: DfColors.brand.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Payment ref: ${widget.paymentReference} · ${widget.paymentMethod ?? 'paid'}',
                style: GoogleFonts.dmSans(fontSize: 12, color: DfColors.brandDark, fontWeight: FontWeight.w600),
              ),
            ),
          ],
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFDBA74)),
            ),
            child: const Text(
              'Important: DataFlex is a multi-service earning platform — not only data bundles. '
              'After approval you must complete photo verification (selfie) before using the app, same as the website.',
              style: TextStyle(fontSize: 12.5, height: 1.4, color: Color(0xFF9A3412)),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _fullName,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Full name',
              prefixIcon: Icon(Icons.badge_outlined),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            decoration: const InputDecoration(
              labelText: 'Phone number',
              hintText: '024XXXXXXX',
              prefixIcon: Icon(Icons.phone_iphone_rounded),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _paymentLine,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            decoration: const InputDecoration(
              labelText: 'MoMo payment line',
              hintText: 'Number for commissions / payouts',
              prefixIcon: Icon(Icons.account_balance_wallet_outlined),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _region,
            decoration: const InputDecoration(
              labelText: 'Region',
              prefixIcon: Icon(Icons.map_outlined),
            ),
            items: _regions
                .map(
                  (r) => DropdownMenuItem(
                    value: r,
                    child: Text(
                      r,
                      style: TextStyle(fontWeight: r == 'Greater Accra' ? FontWeight.w700 : FontWeight.w500),
                    ),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _region = v),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline_rounded),
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirm,
            obscureText: _obscureConfirm,
            decoration: InputDecoration(
              labelText: 'Confirm password',
              prefixIcon: const Icon(Icons.lock_person_outlined),
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                icon: Icon(_obscureConfirm ? Icons.visibility_rounded : Icons.visibility_off_rounded),
              ),
            ),
          ),
          const SizedBox(height: 8),
          CheckboxListTile(
            value: _agreeToTerms,
            onChanged: (v) => setState(() => _agreeToTerms = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            activeColor: DfColors.brand,
            title: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text('I agree to the ', style: GoogleFonts.dmSans(fontSize: 13, color: DfColors.ink)),
                GestureDetector(
                  onTap: () => launchUrl(Uri.parse(_termsUrl), mode: LaunchMode.externalApplication),
                  child: Text(
                    'Terms & Conditions',
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      color: DfColors.brandDark,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
                Text(' and ', style: GoogleFonts.dmSans(fontSize: 13, color: DfColors.ink)),
                GestureDetector(
                  onTap: () => launchUrl(Uri.parse(_faqUrl), mode: LaunchMode.externalApplication),
                  child: Text(
                    'FAQ',
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      color: DfColors.brandDark,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: DfColors.danger, height: 1.35)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create account'),
          ),
        ],
      ),
    );
  }
}

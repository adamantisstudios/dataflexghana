import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';

class ReferralProgramScreen extends StatefulWidget {
  const ReferralProgramScreen({super.key});

  @override
  State<ReferralProgramScreen> createState() => _ReferralProgramScreenState();
}

class _ReferralProgramScreenState extends State<ReferralProgramScreen> {
  Map<String, dynamic>? _link;
  Map<String, dynamic>? _stats;
  bool _loading = true;
  bool _generating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final linkRes = await ApiClient.instance.getReferralLink();
      final statsRes = await ApiClient.instance.getReferralStats();
      setState(() {
        _link = linkRes['data'] is Map ? Map<String, dynamic>.from(linkRes['data'] as Map) : null;
        final data = statsRes['data'];
        if (data is Map) {
          _stats = Map<String, dynamic>.from(data['stats'] as Map? ?? {});
          if (_link == null && data['referralLink'] is Map) {
            _link = Map<String, dynamic>.from(data['referralLink'] as Map);
          }
        }
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    try {
      final res = await ApiClient.instance.generateReferralLink();
      setState(() {
        _link = res['data'] is Map ? Map<String, dynamic>.from(res['data'] as Map) : null;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['isNew'] == true ? 'Link created' : 'Link ready')),
      );
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  String get _url => _link?['referral_url']?.toString() ?? '';
  String get _code => _link?['referral_code']?.toString() ?? '';

  Future<void> _copy() async {
    if (_url.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: _url));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
  }

  Future<void> _shareWhatsApp() async {
    if (_url.isEmpty) return;
    final text = Uri.encodeComponent('Join DataFlex Ghana with my referral link: $_url');
    final uri = Uri.parse('https://wa.me/?text=$text');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  double _n(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Referral Program')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                children: [
                  if (_error != null)
                    Text(_error!, style: const TextStyle(color: DfColors.danger)),
                  Text(
                    'Invite agents & earn',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 22),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Share your link. You earn commission when referred agents register and stay active.',
                    style: TextStyle(color: DfColors.muted, fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _StatChip(label: 'Clicks', value: '${_n(_stats?['totalClicks']).toInt()}'),
                      const SizedBox(width: 8),
                      _StatChip(label: 'Referrals', value: '${_n(_stats?['totalReferrals']).toInt()}'),
                      const SizedBox(width: 8),
                      _StatChip(label: 'Earned', value: 'GHS ${_n(_stats?['totalEarnings']).toStringAsFixed(0)}'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (_url.isEmpty) ...[
                    ElevatedButton(
                      onPressed: _generating ? null : _generate,
                      child: _generating
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Generate referral link'),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Your code', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                          Text(_code, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 10),
                          SelectableText(_url, style: const TextStyle(fontSize: 13, color: DfColors.muted)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _copy,
                            icon: const Icon(Icons.copy),
                            label: const Text('Copy'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _shareWhatsApp,
                            icon: const Icon(Icons.chat),
                            label: const Text('WhatsApp'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 16)),
            Text(label, style: const TextStyle(color: DfColors.muted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

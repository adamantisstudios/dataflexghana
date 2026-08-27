import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import 'counselling_screen.dart';
import 'dating_common.dart';

/// Plans, coin packs and the daily allowance. Payment goes through Paystack in
/// the external browser, then the callback route credits the plan.
class DatingSubscriptionScreen extends StatefulWidget {
  const DatingSubscriptionScreen({super.key});

  @override
  State<DatingSubscriptionScreen> createState() => _DatingSubscriptionScreenState();
}

class _DatingSubscriptionScreenState extends State<DatingSubscriptionScreen> {
  Map<String, dynamic>? _subscription;
  Map<String, dynamic> _plans = {};
  Map<String, dynamic> _coinsPack = {};
  Map<String, dynamic> _limits = {};
  num _counsellingPrice = 20;
  bool _loading = true;
  bool _paying = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await DatingApi.instance.subscription();
      if (!mounted) return;
      setState(() {
        _subscription = res['subscription'] is Map
            ? Map<String, dynamic>.from(res['subscription'] as Map)
            : null;
        _plans = res['plans'] is Map ? Map<String, dynamic>.from(res['plans'] as Map) : {};
        _coinsPack =
            res['coins_pack'] is Map ? Map<String, dynamic>.from(res['coins_pack'] as Map) : {};
        _limits = res['limits'] is Map ? Map<String, dynamic>.from(res['limits'] as Map) : {};
        final price = res['counselling_session_price'];
        if (price is num) _counsellingPrice = price;
      });
    } catch (e) {
      if (mounted) setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _buy(String plan) async {
    setState(() => _paying = true);
    try {
      final res = await DatingApi.instance.initializePayment(plan: plan);
      final url = res['authorization_url']?.toString() ?? '';
      if (url.isEmpty) throw Exception('Payment could not be started');
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!mounted) return;
      showDatingSnack(
        context,
        launched
            ? 'Complete the payment in your browser, then pull to refresh here.'
            : 'Could not open the payment page',
        danger: !launched,
      );
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentPlan = _subscription?['plan']?.toString() ?? 'free';

    return Scaffold(
      appBar: AppBar(title: const Text('Dating plans')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: const TextStyle(color: DfColors.danger)),
                    ),
                  DatingSection(
                    title: 'Your plan',
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        DatingChip(
                          label: currentPlan.toUpperCase(),
                          icon: Icons.workspace_premium,
                        ),
                        DatingChip(
                          label: '${_limits['swipes_remaining'] ?? '—'} swipes left',
                          icon: Icons.favorite_border,
                        ),
                        DatingChip(
                          label: '${_limits['matches_remaining'] ?? '—'} matches left',
                          icon: Icons.people_outline,
                        ),
                        if (asInt(_subscription?['coins']) != null)
                          DatingChip(
                            label: '${asInt(_subscription?['coins'])} coins',
                            icon: Icons.toll,
                          ),
                        if ((asInt(_limits['streak_count']) ?? 0) > 0)
                          DatingChip(
                            label: '${asInt(_limits['streak_count'])} day streak',
                            icon: Icons.local_fire_department,
                            color: Colors.orange.shade800,
                          ),
                        if ((_limits['resets_in']?.toString() ?? '').isNotEmpty)
                          DatingChip(
                            label: 'Resets in ${_limits['resets_in']}',
                            icon: Icons.schedule,
                            color: DfColors.muted,
                          ),
                      ],
                    ),
                  ),
                  _planCard('free', currentPlan),
                  _planCard('silver', currentPlan),
                  _planCard('gold', currentPlan),
                  if (_coinsPack.isNotEmpty)
                    DatingSection(
                      title: _coinsPack['label']?.toString() ?? 'Coins pack',
                      subtitle: 'A one-off boost — no subscription.',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'GHS ${_coinsPack['price'] ?? '—'} · '
                            '${_coinsPack['swipes'] ?? 0} extra swipes · '
                            '${_coinsPack['matches'] ?? 0} extra matches',
                            style: const TextStyle(color: DfColors.muted),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: _paying ? null : () => _buy('coins'),
                            child: const Text('Buy coins pack'),
                          ),
                        ],
                      ),
                    ),
                  DatingSection(
                    title: 'Relationship counselling',
                    subtitle: 'GHS $_counsellingPrice per 30-minute session. '
                        'New members get an intro session free.',
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const CounsellingScreen()),
                      ),
                      icon: const Icon(Icons.volunteer_activism_outlined, size: 18),
                      label: const Text('Book a session'),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  Widget _planCard(String key, String currentPlan) {
    final plan = _plans[key] is Map ? Map<String, dynamic>.from(_plans[key] as Map) : null;
    if (plan == null) return const SizedBox.shrink();

    final isCurrent = currentPlan == key;
    final price = plan['price'];
    final swipes = asInt(plan['swipesPerDay']) ?? 0;
    final matches = asInt(plan['matchesPerDay']) ?? 0;
    final label = plan['label']?.toString() ?? key;

    final perks = <String>[
      swipes >= 9999 ? 'Unlimited swipes per day' : '$swipes swipes per day',
      '$matches matches per day',
      if (key != 'free') 'Top-pick likes',
      if (key != 'free') 'Read receipts in chat',
      if (key != 'free') 'See photos before matching',
      if (key == 'gold') 'Priority placement in discover',
      if (key == 'gold') 'Monthly free counselling session',
    ];

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCurrent ? DfColors.brand : DfColors.muted.withValues(alpha: 0.18),
          width: isCurrent ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 19)),
              const SizedBox(width: 8),
              if (isCurrent) const DatingChip(label: 'Current', icon: Icons.check),
              const Spacer(),
              Text(
                key == 'free' ? 'Free' : 'GHS $price',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 17,
                  color: DfColors.brandDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...perks.map(
            (perk) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, size: 15, color: DfColors.brand),
                  const SizedBox(width: 8),
                  Expanded(child: Text(perk, style: const TextStyle(fontSize: 13.5))),
                ],
              ),
            ),
          ),
          if (key != 'free' && !isCurrent) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _paying ? null : () => _buy(key),
                child: Text('Upgrade to $label'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

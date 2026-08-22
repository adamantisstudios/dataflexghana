import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'order_bundle_screen.dart';

class DataBundlesScreen extends StatefulWidget {
  const DataBundlesScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<DataBundlesScreen> createState() => DataBundlesScreenState();
}

class DataBundlesScreenState extends State<DataBundlesScreen> {
  static const providers = ['MTN', 'AirtelTigo', 'Telecel'];
  static const logos = {
    'MTN': 'assets/images/mtn.jpg',
    'AirtelTigo': 'assets/images/airteltigo.jpg',
    'Telecel': 'assets/images/telecel.jpg',
  };

  String _provider = 'MTN';
  Map<String, dynamic>? _payload;
  bool _loading = true;
  String? _error;
  double _walletBalance = 0;

  @override
  void initState() {
    super.initState();
    reload(force: true);
  }

  /// Called from HomeShell when Buy tab is opened.
  Future<void> reload({bool force = true}) => _load(force: force);

  Future<void> _load({bool force = true}) async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.dataBundles(forceRefresh: force);
      if (!mounted) return;
      final wb = data['wallet_balance'];
      setState(() {
        _payload = data;
        _walletBalance = wb is num ? wb.toDouble() : double.tryParse('$wb') ?? 0;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _normProvider(String? raw) {
    final u = (raw ?? '').toUpperCase();
    if (u.contains('MTN')) return 'MTN';
    if (u.contains('TELECEL') || u.contains('VODAFONE')) return 'Telecel';
    if (u.contains('AIRTEL') || u.contains('TIGO') || u == 'AT') return 'AirtelTigo';
    return raw?.trim() ?? '';
  }

  List<Map<String, dynamic>> get _allBundles {
    final all = _payload?['bundles'];
    if (all is! List) return [];
    return all.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  List<Map<String, dynamic>> get _bundles {
    // Prefer normalized network field from API, then by_provider, then raw provider.
    final by = _payload?['by_provider'];
    if (by is Map && by[_provider] is List) {
      final list = (by[_provider] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      if (list.isNotEmpty) return list;
    }
    return _allBundles.where((b) {
      final network = b['network']?.toString();
      if (network != null && network.isNotEmpty) return network == _provider;
      return _normProvider(b['provider']?.toString()) == _provider;
    }).toList();
  }

  double _num(Object? v) {
    if (v is num) return v.toDouble();
    return double.tryParse(v?.toString() ?? '') ?? 0;
  }

  double _estimateCommission(Map<String, dynamic> b) {
    final price = _num(b['price']);
    final rate = _num(b['commission_rate']);
    final raw = price * rate;
    if (raw <= 0) return 0;
    final rounded = (raw * 100).round() / 100;
    return rounded < 0.01 ? 0.01 : rounded;
  }

  @override
  Widget build(BuildContext context) {
    final body = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.embedded)
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Image.asset('assets/images/dataflex_logo.png', height: 28),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Buy data',
                      style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(onPressed: () => reload(force: true), icon: const Icon(Icons.refresh)),
                ],
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
            ),
            child: Row(
              children: [
                const Icon(Icons.account_balance_wallet, color: DfColors.brandDark, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Wallet  GHS ${_walletBalance.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                ),
                Text(
                  '${_bundles.length} packs',
                  style: const TextStyle(color: DfColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
        SizedBox(
          height: 96,
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            scrollDirection: Axis.horizontal,
            itemCount: providers.length,
            separatorBuilder: (context, index) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final p = providers[i];
              final selected = p == _provider;
              return GestureDetector(
                onTap: () => setState(() => _provider = p),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 108,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: selected ? DfColors.brand : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: selected ? DfColors.brandDark : DfColors.brand.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.asset(logos[p]!, fit: BoxFit.cover, width: double.infinity),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        p,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: selected ? Colors.white : DfColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        if (_loading) const Expanded(child: Center(child: CircularProgressIndicator(color: DfColors.brand))),
        if (!_loading && _error != null)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: () => reload(force: true), child: const Text('Retry')),
                ],
              ),
            ),
          ),
        if (!_loading && _error == null)
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => reload(force: true),
              color: DfColors.brand,
              child: _bundles.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        const SizedBox(height: 60),
                        const Icon(Icons.sim_card_alert_outlined, size: 48, color: DfColors.muted),
                        const SizedBox(height: 12),
                        Text(
                          'No $_provider bundles loaded',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: DfColors.muted, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Total from server: ${_allBundles.length}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: DfColors.muted, fontSize: 12),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: TextButton.icon(
                            onPressed: () => reload(force: true),
                            icon: const Icon(Icons.refresh),
                            label: const Text('Reload packs'),
                          ),
                        ),
                      ],
                    )
                  : ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: _bundles.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final b = _bundles[i];
                        final price = _num(b['price']);
                        final commission = _estimateCommission(b);
                        final size = b['size_gb'];
                        return Material(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => OrderBundleScreen(
                                    bundle: b,
                                    walletBalance: _walletBalance,
                                  ),
                                ),
                              );
                              reload(force: true);
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: DfColors.brand.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Text(
                                      '${size}GB',
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.w800,
                                        color: DfColors.brandDark,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          b['name']?.toString() ?? 'Bundle',
                                          style: const TextStyle(fontWeight: FontWeight.w700),
                                        ),
                                        Text(
                                          'Valid ${b['validity_months'] ?? '-'} mo · Earn GHS ${commission.toStringAsFixed(2)}',
                                          style: const TextStyle(color: DfColors.muted, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'GHS ${price.toStringAsFixed(2)}',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w800,
                                          color: DfColors.brandDark,
                                        ),
                                      ),
                                      const Text(
                                        'Order',
                                        style: TextStyle(
                                          color: DfColors.brand,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
      ],
    );

    if (widget.embedded) {
      return ColoredBox(color: DfColors.sand, child: body);
    }
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/dataflex_logo.png', height: 28),
            const SizedBox(width: 10),
            const Text('Data Bundles'),
          ],
        ),
        actions: [
          IconButton(onPressed: () => reload(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: body,
    );
  }
}

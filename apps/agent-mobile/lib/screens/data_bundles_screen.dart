import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'order_bundle_screen.dart';

class DataBundlesScreen extends StatefulWidget {
  const DataBundlesScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  State<DataBundlesScreen> createState() => _DataBundlesScreenState();
}

class _DataBundlesScreenState extends State<DataBundlesScreen> {
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.dataBundles(forceRefresh: force);
      setState(() => _payload = data);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _bundles {
    final by = _payload?['by_provider'];
    if (by is Map && by[_provider] is List) {
      return (by[_provider] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    final all = _payload?['bundles'];
    if (all is List) {
      return all
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .where((b) => b['provider']?.toString() == _provider)
          .toList();
    }
    return [];
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
      children: [
        if (widget.embedded)
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Buy data',
                      style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh)),
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
            separatorBuilder: (_, __) => const SizedBox(width: 10),
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
          Expanded(child: Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))),
        if (!_loading && _error == null)
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(force: true),
              child: _bundles.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No bundles for this network', style: TextStyle(color: DfColors.muted))),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: _bundles.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
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
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => OrderBundleScreen(bundle: b)),
                              );
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
                                  Text(
                                    'GHS ${price.toStringAsFixed(2)}',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w800,
                                      color: DfColors.brandDark,
                                    ),
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

    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Data Bundles'),
        actions: [
          IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: body,
    );
  }
}

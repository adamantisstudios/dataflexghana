import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../services/cache_store.dart';
import '../../theme/app_theme.dart';
import '../../utils/display_format.dart';

class HubMarketplaceTab extends StatefulWidget {
  const HubMarketplaceTab({super.key});

  @override
  State<HubMarketplaceTab> createState() => _HubMarketplaceTabState();
}

class _HubMarketplaceTabState extends State<HubMarketplaceTab> {
  static const _sections = [
    'Data bundles',
    'Services',
    'Wholesale',
    'Compliance',
    'Advertising',
    'Writing',
    'Real Estate',
    'Influencers',
  ];

  int _section = 0;
  String _provider = 'MTN';
  int _bundlePage = 1;
  int _bundleTotalPages = 1;
  int _bundleTotal = 0;
  bool _loading = true;
  String? _error;
  final Set<String> _busy = {};
  final Map<String, TextEditingController> _marginCtrls = {};
  final _serviceSearch = TextEditingController();

  List<Map<String, dynamic>> _settings = [];
  List<Map<String, dynamic>> _savedBundles = [];
  List<Map<String, dynamic>> _bundles = [];
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _wholesale = [];
  List<Map<String, dynamic>> _adPackages = [];
  List<Map<String, dynamic>> _writing = [];
  List<Map<String, dynamic>> _ownProperties = [];
  List<Map<String, dynamic>> _platformProperties = [];
  List<Map<String, dynamic>> _complianceSubs = [];
  List<Map<String, dynamic>> _influencerPackages = [];
  Map<String, dynamic>? _influencerProfile;
  bool _complianceVisible = false;
  bool _propertiesSuspended = false;

  final _money = NumberFormat.currency(symbol: 'GHS ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _loadSection();
  }

  @override
  void dispose() {
    for (final c in _marginCtrls.values) {
      c.dispose();
    }
    _serviceSearch.dispose();
    super.dispose();
  }

  TextEditingController _marginCtrl(String id, [double? initial]) {
    return _marginCtrls.putIfAbsent(id, () {
      final v = initial ?? _marginFor(id) ?? 0;
      return TextEditingController(text: v == 0 ? '' : v.toString());
    });
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  double? _marginFor(String itemId, [String itemType = 'data_bundle']) {
    for (final s in _settings) {
      if (s['item_type']?.toString() == itemType && s['item_id']?.toString() == itemId) {
        final m = s['custom_margin'];
        if (m is num) return m.toDouble();
        return double.tryParse(m?.toString() ?? '');
      }
    }
    return null;
  }

  bool _isVisible(String itemType, String itemId) {
    for (final s in _settings) {
      if (s['item_type']?.toString() == itemType && s['item_id']?.toString() == itemId) {
        return s['is_visible'] == true;
      }
    }
    return false;
  }

  bool _isComplianceVisible() {
    for (final s in _settings) {
      if (s['item_type']?.toString() == 'compliance_form' && s['is_visible'] == true) return true;
    }
    return false;
  }

  Future<void> _loadSettings({bool force = false}) async {
    if (!force) {
      final cached = await CacheStore.instance.getJson<Map<String, dynamic>>('hub_store_settings');
      if (cached != null) {
        final list = cached['settings'];
        _settings = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        final saved = cached['savedBundles'];
        _savedBundles = saved is List
            ? saved.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _complianceVisible = _isComplianceVisible();
        return;
      }
    }
    final data = await ApiClient.instance.getStoreSettings();
    await CacheStore.instance.putJson('hub_store_settings', data, ttl: const Duration(minutes: 30));
    final list = data['settings'];
    _settings = list is List
        ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : [];
    final saved = data['savedBundles'];
    _savedBundles = saved is List
        ? saved.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : [];
    _complianceVisible = _isComplianceVisible();
  }

  Future<void> _loadSection({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _loadSettings(force: force);
      switch (_section) {
        case 0:
          // The API hard-caps limit at 20, so paginate rather than over-requesting.
          final cacheKey = 'hub_bundles_${_provider}_p$_bundlePage';
          Map<String, dynamic>? data;
          if (!force) {
            data = await CacheStore.instance.getJson<Map<String, dynamic>>(cacheKey);
          }
          data ??= await ApiClient.instance.getStoreBundles(
            provider: _provider,
            page: _bundlePage,
            limit: 20,
          );
          await CacheStore.instance.putJson(cacheKey, data, ttl: const Duration(minutes: 15));
          final list = data['bundles'];
          _bundles = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          _bundleTotalPages = (data['totalPages'] is num)
              ? (data['totalPages'] as num).toInt().clamp(1, 9999)
              : 1;
          _bundleTotal = (data['total'] is num) ? (data['total'] as num).toInt() : _bundles.length;
          break;
        case 1:
          final q = _serviceSearch.text.trim();
          final data = await ApiClient.instance.getStoreServices(limit: 50);
          final list = data['services'];
          var services = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : <Map<String, dynamic>>[];
          if (q.isNotEmpty) {
            final lq = q.toLowerCase();
            services = services
                .where((s) =>
                    (s['title']?.toString().toLowerCase().contains(lq) ?? false) ||
                    (s['description']?.toString().toLowerCase().contains(lq) ?? false))
                .toList();
          }
          _services = services;
          break;
        case 2:
          final data = await ApiClient.instance.getStoreWholesale(limit: 50);
          final list = data['products'];
          _wholesale = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 3:
          final data = await ApiClient.instance.getComplianceSubmissions();
          final list = data['submissions'];
          _complianceSubs = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 4:
          final data = await ApiClient.instance.getAdvertisingPackages();
          final list = data['packages'];
          _adPackages = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 5:
          final data = await ApiClient.instance.getWritingPackages();
          final list = data['services'];
          _writing = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 6:
          final data = await ApiClient.instance.getStoreProperties();
          _propertiesSuspended = data['suspended'] == true;
          final own = data['own'];
          final platform = data['platform'];
          _ownProperties = own is List
              ? own.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          _platformProperties = platform is List
              ? platform.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 7:
          final results = await Future.wait([
            ApiClient.instance.getInfluencerProfile(),
            ApiClient.instance.getInfluencerPackages(),
          ]);
          final profile = results[0]['profile'];
          _influencerProfile = profile is Map ? Map<String, dynamic>.from(profile) : null;
          final pkgs = results[1]['packages'];
          _influencerPackages = pkgs is List
              ? pkgs.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setVisible({
    required String itemType,
    required String itemId,
    required bool visible,
    double? customMargin,
    String? successMessage,
  }) async {
    final key = '$itemType:$itemId';
    setState(() => _busy.add(key));
    try {
      await ApiClient.instance.upsertStoreSetting(
        itemType: itemType,
        itemId: itemId,
        isVisible: visible,
        customMargin: customMargin,
      );
      await CacheStore.instance.invalidate('hub_store_settings');
      await _loadSettings(force: true);
      setState(() {});
      _snack(successMessage ?? (visible ? 'Enabled on storefront' : 'Hidden from storefront'));
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(key));
    }
  }

  Future<void> _addBundleWithMargin(Map<String, dynamic> bundle) async {
    final id = bundle['id']?.toString() ?? '';
    final raw = _marginCtrl(id).text.trim();
    final margin = double.tryParse(raw) ?? 0;
    if (margin < 0) {
      _snack('Margin cannot be negative', error: true);
      return;
    }
    await _setVisible(
      itemType: 'data_bundle',
      itemId: id,
      visible: true,
      customMargin: margin,
      successMessage: 'Added to store',
    );
  }

  Future<void> _updateBundleMargin(String id) async {
    final raw = _marginCtrl(id).text.trim();
    final margin = double.tryParse(raw) ?? 0;
    if (margin < 0) {
      _snack('Margin cannot be negative', error: true);
      return;
    }
    await _setVisible(
      itemType: 'data_bundle',
      itemId: id,
      visible: true,
      customMargin: margin,
      successMessage: 'Margin updated',
    );
  }

  Future<void> _removeBundle(String id) async {
    final key = 'data_bundle:$id';
    setState(() => _busy.add(key));
    try {
      await ApiClient.instance.deleteStoreSetting(itemType: 'data_bundle', itemId: id);
      await CacheStore.instance.invalidate('hub_store_settings');
      await _loadSettings(force: true);
      setState(() {});
      _snack('Removed from store');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(key));
    }
  }

  String _fmtPrice(Object? v) {
    if (v is num) return _money.format(v);
    final n = double.tryParse(v?.toString() ?? '');
    return n != null ? _money.format(n) : '—';
  }

  String _networkAsset(String provider) {
    final p = provider.toLowerCase();
    if (p.contains('telecel')) return 'assets/images/telecel.jpg';
    if (p.contains('airtel') || p.contains('tigo')) return 'assets/images/airteltigo.jpg';
    return 'assets/images/mtn.jpg';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
            itemCount: _sections.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final selected = _section == i;
              return ChoiceChip(
                label: Text(_sections[i]),
                selected: selected,
                selectedColor: DfColors.brand.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: selected ? DfColors.brandDark : DfColors.ink,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 12,
                ),
                onSelected: (_) {
                  if (_section == i) return;
                  setState(() => _section = i);
                  _loadSection();
                },
              );
            },
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: DfColors.brand,
            onRefresh: () => _loadSection(force: true),
            child: _loading
                ? ListView(
                    children: const [
                      SizedBox(height: 120),
                      Center(child: CircularProgressIndicator(color: DfColors.brand)),
                    ],
                  )
                : _error != null
                    ? ListView(
                        padding: const EdgeInsets.all(24),
                        children: [
                          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
                          const SizedBox(height: 12),
                          Center(child: ElevatedButton(onPressed: () => _loadSection(force: true), child: const Text('Retry'))),
                        ],
                      )
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: _buildSectionBody(),
                      ),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildSectionBody() {
    switch (_section) {
      case 0:
        return _buildBundles();
      case 1:
        return _buildServices();
      case 2:
        return _buildWholesale();
      case 3:
        return _buildCompliance();
      case 4:
        return _buildSimpleToggleCards(
          title: 'Advertising packages',
          items: _adPackages,
          nameKey: 'package_name',
          priceKey: 'price',
          itemType: 'ad_package',
          imageKey: 'image_url',
        );
      case 5:
        return _buildSimpleToggleCards(
          title: 'Writing services',
          items: _writing,
          nameKey: 'service_name',
          priceKey: 'price',
          itemType: 'writing_service',
          imageKey: 'image_url',
        );
      case 6:
        return _buildRealEstate();
      case 7:
        return _buildInfluencers();
      default:
        return [const Text('Unknown section')];
    }
  }

  List<Widget> _buildBundles() {
    final savedIds = _settings
        .where((s) => s['item_type'] == 'data_bundle' && s['is_visible'] == true)
        .map((s) => s['item_id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toSet();

    return [
      Text('Data bundles', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text(
        'Pick a network, set your profit margin, then add to your store — same as the website Referral Hub.',
        style: TextStyle(color: DfColors.muted, fontSize: 12, height: 1.35),
      ),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        children: ['MTN', 'Telecel', 'AirtelTigo'].map((p) {
          final selected = _provider == p;
          return ChoiceChip(
            avatar: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.asset(_networkAsset(p), width: 18, height: 18, fit: BoxFit.cover),
            ),
            label: Text(p),
            selected: selected,
            selectedColor: DfColors.brand.withValues(alpha: 0.2),
            onSelected: (_) {
              if (_provider == p) return;
              setState(() {
                _provider = p;
                _bundlePage = 1;
              });
              _loadSection();
            },
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
      if (savedIds.isNotEmpty) ...[
        Text('Your store bundles', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...savedIds.map((id) {
          final bundle = _savedBundles.cast<Map<String, dynamic>?>().firstWhere(
                (b) => b?['id']?.toString() == id,
                orElse: () => _bundles.cast<Map<String, dynamic>?>().firstWhere(
                      (b) => b?['id']?.toString() == id,
                      orElse: () => null,
                    ),
              );
          final knownPrice = bundle?['price'];
          final base = (knownPrice is num) ? knownPrice.toDouble() : null;
          final margin = _marginFor(id) ?? 0;
          final busy = _busy.contains('data_bundle:$id');
          final label = bundle?['name']?.toString() ??
              'Bundle ${id.length > 8 ? id.substring(0, 8) : id}';
          final provider = bundle?['provider']?.toString();
          final sizeGb = bundle?['size_gb'];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                  // Base price is unknown when the bundle is no longer in the
                  // catalog; show only the margin rather than a bogus retail.
                  Text(
                    base == null
                        ? 'Margin ${_fmtPrice(margin)}'
                        : '${provider ?? _provider} · ${sizeGb ?? '?'}GB · Base ${_fmtPrice(base)} '
                            '· Margin ${_fmtPrice(margin)} · Sell ${_fmtPrice(base + margin)}',
                    style: const TextStyle(fontSize: 12, color: DfColors.muted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _marginCtrl(id, margin),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                          decoration: const InputDecoration(labelText: 'Your margin (GHS)', isDense: true),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: busy ? null : () => _updateBundleMargin(id),
                        child: const Text('Update'),
                      ),
                      IconButton(
                        onPressed: busy ? null : () => _removeBundle(id),
                        icon: const Icon(Icons.delete_outline, color: DfColors.danger),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 12),
        Text('Add more bundles', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
      ],
      if (_bundleTotal > 0)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            '$_bundleTotal $_provider bundles available · page $_bundlePage of $_bundleTotalPages',
            style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
          ),
        ),
      if (_bundles.isEmpty)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Center(
            child: Text('No bundles for $_provider.', style: const TextStyle(color: DfColors.muted)),
          ),
        )
      else
        ..._bundles.where((b) => !savedIds.contains(b['id']?.toString())).map((b) {
          final id = b['id']?.toString() ?? '';
          final busy = _busy.contains('data_bundle:$id');
          final base = (b['price'] is num) ? (b['price'] as num).toDouble() : 0.0;
          final img = b['image_url']?.toString();
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 56,
                      height: 56,
                      child: img != null && img.isNotEmpty
                          ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)
                          : Image.asset(_networkAsset(_provider), fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b['name']?.toString() ?? 'Bundle', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                        Text(
                          '${b['size_gb'] ?? '?'} GB · Base ${_fmtPrice(base)}',
                          style: const TextStyle(fontSize: 12, color: DfColors.muted),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _marginCtrl(id),
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                                decoration: const InputDecoration(
                                  labelText: 'Your margin (GHS)',
                                  isDense: true,
                                  hintText: 'e.g. 2',
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: busy ? null : () => _addBundleWithMargin(b),
                              child: busy
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Add'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      if (_bundleTotalPages > 1)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              OutlinedButton.icon(
                onPressed: _bundlePage <= 1 ? null : () => _goToBundlePage(_bundlePage - 1),
                icon: const Icon(Icons.chevron_left, size: 18),
                label: const Text('Previous'),
              ),
              Text(
                'Page $_bundlePage / $_bundleTotalPages',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              OutlinedButton.icon(
                onPressed:
                    _bundlePage >= _bundleTotalPages ? null : () => _goToBundlePage(_bundlePage + 1),
                icon: const Icon(Icons.chevron_right, size: 18),
                label: const Text('Next'),
              ),
            ],
          ),
        ),
    ];
  }

  void _goToBundlePage(int page) {
    setState(() => _bundlePage = page.clamp(1, _bundleTotalPages));
    _loadSection();
  }

  List<Widget> _buildServices() {
    return [
      Text('Referral services', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text(
        'Toggle which services appear on your storefront. Images and commissions match the website.',
        style: TextStyle(color: DfColors.muted, fontSize: 12),
      ),
      const SizedBox(height: 10),
      TextField(
        controller: _serviceSearch,
        decoration: InputDecoration(
          hintText: 'Search services…',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward), onPressed: () => _loadSection(force: true)),
        ),
        onSubmitted: (_) => _loadSection(force: true),
      ),
      const SizedBox(height: 12),
      if (_services.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Center(child: Text('No services found', style: TextStyle(color: DfColors.muted))),
        )
      else
        ..._services.map((svc) {
          final id = svc['id']?.toString() ?? '';
          final visible = _isVisible('referral_service', id);
          final busy = _busy.contains('referral_service:$id');
          final img = svc['image_url']?.toString();
          final commission = svc['agent_commission'] ?? svc['commission_amount'] ?? 0;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 64,
                      height: 64,
                      child: img != null && img.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: img,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(color: DfColors.sand, child: const Icon(Icons.handshake_outlined)),
                            )
                          : Container(color: DfColors.sand, child: const Icon(Icons.handshake_outlined)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(svc['title']?.toString() ?? 'Service', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                        if ((svc['description']?.toString() ?? '').isNotEmpty)
                          Text(
                            svc['description'].toString(),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          '${_fmtPrice(svc['cost'] ?? svc['product_cost'])} · Earn ${DisplayFormat.money(commission is num ? commission.toDouble() : 0)}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: DfColors.brandDark),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      Text(visible ? 'Visible' : 'Hidden', style: const TextStyle(fontSize: 11, color: DfColors.muted)),
                      Switch(
                        value: visible,
                        activeThumbColor: DfColors.brand,
                        onChanged: busy
                            ? null
                            : (v) => _setVisible(
                                  itemType: 'referral_service',
                                  itemId: id,
                                  visible: v,
                                  customMargin: 0,
                                ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
    ];
  }

  List<Widget> _buildWholesale() {
    return [
      Text('Wholesale products', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text(
        'Set your margin and toggle products onto your storefront.',
        style: TextStyle(color: DfColors.muted, fontSize: 12),
      ),
      const SizedBox(height: 12),
      ..._wholesale.map((p) {
        final id = p['id']?.toString() ?? '';
        final visible = _isVisible('wholesale_product', id);
        final busy = _busy.contains('wholesale_product:$id');
        final images = p['image_urls'];
        final img = images is List && images.isNotEmpty
            ? images.first.toString()
            : p['image_url']?.toString();
        final base = (p['price'] is num) ? (p['price'] as num).toDouble() : 0.0;
        final margin = _marginFor(id, 'wholesale_product') ?? 0;
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        width: 56,
                        height: 56,
                        child: img != null && img.isNotEmpty
                            ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)
                            : Container(color: DfColors.sand, child: const Icon(Icons.inventory_2_outlined)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p['name']?.toString() ?? 'Product', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
                          Text(
                            'Base ${_fmtPrice(base)}${visible ? ' · Retail ${_fmtPrice(base + margin)}' : ''}',
                            style: const TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: visible,
                      activeThumbColor: DfColors.brand,
                      onChanged: busy
                          ? null
                          : (v) {
                              final m = double.tryParse(_marginCtrl('w_$id', margin).text.trim()) ?? margin;
                              _setVisible(
                                itemType: 'wholesale_product',
                                itemId: id,
                                visible: v,
                                customMargin: m,
                              );
                            },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _marginCtrl('w_$id', margin),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Your margin (GHS)', isDense: true),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: busy
                          ? null
                          : () {
                              final m = double.tryParse(_marginCtrl('w_$id').text.trim()) ?? 0;
                              _setVisible(
                                itemType: 'wholesale_product',
                                itemId: id,
                                visible: true,
                                customMargin: m,
                              );
                            },
                      child: const Text('Save margin'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }),
    ];
  }

  List<Widget> _buildSimpleToggleCards({
    required String title,
    required List<Map<String, dynamic>> items,
    required String nameKey,
    required String priceKey,
    required String itemType,
    String? imageKey,
  }) {
    return [
      Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      if (items.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Center(child: Text('Nothing to show', style: TextStyle(color: DfColors.muted))),
        )
      else
        ...items.map((item) {
          final id = item['id']?.toString() ?? '';
          final visible = item['is_on_storefront'] == true || _isVisible(itemType, id);
          final busy = _busy.contains('$itemType:$id');
          final img = imageKey != null ? item[imageKey]?.toString() : null;
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: img != null && img.isNotEmpty
                      ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)
                      : Container(color: DfColors.sand, child: const Icon(Icons.layers_outlined)),
                ),
              ),
              title: Text(item[nameKey]?.toString() ?? 'Item', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
              subtitle: Text(_fmtPrice(item[priceKey]), style: const TextStyle(fontSize: 12)),
              trailing: Switch(
                value: visible,
                activeThumbColor: DfColors.brand,
                onChanged: busy
                    ? null
                    : (v) => _setVisible(itemType: itemType, itemId: id, visible: v, customMargin: 0),
              ),
            ),
          );
        }),
    ];
  }

  List<Widget> _buildCompliance() {
    return [
      Text('Compliance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      SwitchListTile(
        title: const Text('Sole Proprietorship form'),
        subtitle: const Text('Show compliance form on your storefront'),
        value: _complianceVisible,
        activeThumbColor: DfColors.brand,
        onChanged: (v) async {
          await _setVisible(
            itemType: 'compliance_form',
            itemId: 'sole_proprietorship',
            visible: v,
          );
          setState(() => _complianceVisible = _isComplianceVisible());
        },
      ),
      const SizedBox(height: 16),
      Text('Submissions', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      if (_complianceSubs.isEmpty)
        const Text('No submissions yet', style: TextStyle(color: DfColors.muted))
      else
        ..._complianceSubs.map((s) {
          return ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(s['form_type']?.toString() ?? 'Form'),
            subtitle: Text(
              '${s['status'] ?? '—'} · ${_fmtPrice(s['amount_paid'])}',
              style: const TextStyle(fontSize: 12, color: DfColors.muted),
            ),
          );
        }),
    ];
  }

  List<Widget> _buildRealEstate() {
    final all = <Map<String, dynamic>>[
      ..._ownProperties.map((p) => {...p, '_source': 'Own'}),
      ..._platformProperties.map((p) => {...p, '_source': 'Platform'}),
    ];
    return [
      Text('Real Estate', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      if (_propertiesSuspended)
        const Padding(
          padding: EdgeInsets.only(top: 8, bottom: 8),
          child: Text(
            'Your storefront property section is suspended.',
            style: TextStyle(color: DfColors.danger),
          ),
        ),
      const SizedBox(height: 8),
      if (all.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Center(child: Text('No properties', style: TextStyle(color: DfColors.muted))),
        )
      else
        ...all.map((p) {
          final id = p['id']?.toString() ?? '';
          final visible = _isVisible('property', id);
          final busy = _busy.contains('property:$id');
          final title = p['title']?.toString() ?? p['name']?.toString() ?? 'Property';
          final price = p['price'] ?? p['asking_price'] ?? p['rent_amount'];
          final images = p['image_urls'] ?? p['images'];
          final img = images is List && images.isNotEmpty
              ? images.first.toString()
              : p['image_url']?.toString() ?? p['cover_image']?.toString();
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: img != null && img.isNotEmpty
                      ? CachedNetworkImage(imageUrl: img, fit: BoxFit.cover)
                      : Container(color: DfColors.sand, child: const Icon(Icons.home_work_outlined)),
                ),
              ),
              title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
              subtitle: Text('${p['_source']} · ${_fmtPrice(price)}', style: const TextStyle(fontSize: 12, color: DfColors.muted)),
              trailing: Switch(
                value: visible,
                activeThumbColor: DfColors.brand,
                onChanged: busy
                    ? null
                    : (v) => _setVisible(itemType: 'property', itemId: id, visible: v),
              ),
            ),
          );
        }),
    ];
  }

  List<Widget> _buildInfluencers() {
    final profile = _influencerProfile;
    return [
      Text('Influencers', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: DfColors.brand.withValues(alpha: 0.2)),
        ),
        child: profile == null
            ? const Text(
                'No influencer profile yet. Apply from Referral Hub on the website to get approved, then manage packages here.',
                style: TextStyle(color: DfColors.muted, fontSize: 13),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    profile['approved'] == true ? 'Approved influencer' : 'Pending approval',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                  if (profile['niche'] != null) ...[
                    const SizedBox(height: 4),
                    Text('Niche: ${profile['niche']}', style: const TextStyle(fontSize: 13)),
                  ],
                  if (profile['audience_size'] != null) ...[
                    const SizedBox(height: 2),
                    Text('Audience: ${profile['audience_size']}', style: const TextStyle(fontSize: 13, color: DfColors.muted)),
                  ],
                  if (profile['bio'] != null) ...[
                    const SizedBox(height: 8),
                    Text(profile['bio'].toString(), style: const TextStyle(fontSize: 13)),
                  ],
                ],
              ),
      ),
      const SizedBox(height: 16),
      Text('Packages', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      if (_influencerPackages.isEmpty)
        const Text('No packages yet', style: TextStyle(color: DfColors.muted))
      else
        ..._influencerPackages.map((p) {
          return ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(p['title']?.toString() ?? 'Package'),
            subtitle: Text(_fmtPrice(p['price']), style: const TextStyle(color: DfColors.muted, fontSize: 12)),
          );
        }),
    ];
  }
}

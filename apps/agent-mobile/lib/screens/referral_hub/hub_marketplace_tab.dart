import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

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
  bool _loading = true;
  String? _error;
  final Set<String> _toggling = {};

  List<Map<String, dynamic>> _settings = [];
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

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
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
      if (s['item_type']?.toString() == 'compliance_form' && s['is_visible'] == true) {
        return true;
      }
    }
    return false;
  }

  Future<void> _loadSettings() async {
    final data = await ApiClient.instance.getStoreSettings();
    final list = data['settings'];
    _settings = list is List
        ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : [];
    _complianceVisible = _isComplianceVisible();
  }

  Future<void> _loadSection() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _loadSettings();
      switch (_section) {
        case 0:
          final data = await ApiClient.instance.getStoreBundles(provider: _provider, limit: 50);
          final list = data['bundles'];
          _bundles = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          break;
        case 1:
          final data = await ApiClient.instance.getStoreServices(limit: 50);
          final list = data['services'];
          _services = list is List
              ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
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
          _complianceVisible = _isComplianceVisible();
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

  Future<void> _toggleVisibility({
    required String itemType,
    required String itemId,
    required bool nextVisible,
    double? customMargin,
  }) async {
    final key = '$itemType:$itemId';
    setState(() => _toggling.add(key));
    try {
      await ApiClient.instance.upsertStoreSetting(
        itemType: itemType,
        itemId: itemId,
        isVisible: nextVisible,
        customMargin: customMargin,
      );
      await _loadSettings();
      setState(() {});
      _snack(nextVisible ? 'Enabled on storefront' : 'Hidden from storefront');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _toggling.remove(key));
    }
  }

  String _fmtPrice(Object? v) {
    if (v is num) return _money.format(v);
    final n = double.tryParse(v?.toString() ?? '');
    return n != null ? _money.format(n) : '—';
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
            onRefresh: _loadSection,
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
                          Center(child: ElevatedButton(onPressed: _loadSection, child: const Text('Retry'))),
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
        return _buildToggleList(
          title: 'Referral services',
          items: _services,
          nameKey: 'title',
          priceKey: 'cost',
          itemType: 'referral_service',
        );
      case 2:
        return _buildToggleList(
          title: 'Wholesale products',
          items: _wholesale,
          nameKey: 'name',
          priceKey: 'price',
          itemType: 'wholesale_product',
          allowMargin: true,
        );
      case 3:
        return _buildCompliance();
      case 4:
        return _buildToggleList(
          title: 'Advertising packages',
          items: _adPackages,
          nameKey: 'package_name',
          priceKey: 'price',
          itemType: 'ad_package',
          visibleOverride: (p) => p['is_on_storefront'] == true || _isVisible('ad_package', p['id']?.toString() ?? ''),
        );
        case 5:
          return _buildToggleList(
            title: 'Writing services',
            items: _writing,
            nameKey: 'service_name',
            priceKey: 'price',
            itemType: 'writing_service',
            visibleOverride: (p) =>
                p['is_on_storefront'] == true || _isVisible('writing_service', p['id']?.toString() ?? ''),
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
    return [
      Text('Data bundles', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text(
        'Toggle which bundles appear on your storefront. Optional custom margin adds to the retail price.',
        style: TextStyle(color: DfColors.muted, fontSize: 12),
      ),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        children: ['MTN', 'Telecel', 'AirtelTigo'].map((p) {
          final selected = _provider == p;
          return ChoiceChip(
            label: Text(p),
            selected: selected,
            selectedColor: DfColors.brand.withValues(alpha: 0.2),
            onSelected: (_) {
              if (_provider == p) return;
              setState(() => _provider = p);
              _loadSection();
            },
          );
        }).toList(),
      ),
      const SizedBox(height: 12),
      if (_bundles.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: Center(child: Text('No bundles', style: TextStyle(color: DfColors.muted))),
        )
      else
        ..._bundles.map((b) {
          final id = b['id']?.toString() ?? '';
          final visible = _isVisible('data_bundle', id);
          final busy = _toggling.contains('data_bundle:$id');
          final size = b['size_gb'];
          return _toggleTile(
            title: b['name']?.toString() ?? 'Bundle',
            subtitle: '${size ?? '?'} GB · ${_fmtPrice(b['price'])}',
            value: visible,
            busy: busy,
            onChanged: (v) => _toggleVisibility(
              itemType: 'data_bundle',
              itemId: id,
              nextVisible: v,
            ),
          );
        }),
    ];
  }

  List<Widget> _buildToggleList({
    required String title,
    required List<Map<String, dynamic>> items,
    required String nameKey,
    required String priceKey,
    required String itemType,
    bool allowMargin = false,
    bool Function(Map<String, dynamic>)? visibleOverride,
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
          final visible = visibleOverride?.call(item) ?? _isVisible(itemType, id);
          final busy = _toggling.contains('$itemType:$id');
          final name = item[nameKey]?.toString() ??
              item['title']?.toString() ??
              item['name']?.toString() ??
              'Item';
          return _toggleTile(
            title: name,
            subtitle: _fmtPrice(item[priceKey] ?? item['price'] ?? item['cost']),
            value: visible,
            busy: busy,
            onChanged: (v) => _toggleVisibility(
              itemType: itemType,
              itemId: id,
              nextVisible: v,
              customMargin: allowMargin ? 0 : null,
            ),
          );
        }),
    ];
  }

  List<Widget> _buildCompliance() {
    return [
      Text('Compliance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      _toggleTile(
        title: 'Sole Proprietorship form',
        subtitle: 'Show compliance form on your storefront',
        value: _complianceVisible,
        busy: _toggling.contains('compliance_form:sole_proprietorship'),
        onChanged: (v) async {
          await _toggleVisibility(
            itemType: 'compliance_form',
            itemId: 'sole_proprietorship',
            nextVisible: v,
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
            trailing: Text(
              _shortDate(s['created_at']),
              style: const TextStyle(fontSize: 11, color: DfColors.muted),
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
          final busy = _toggling.contains('property:$id');
          final title = p['title']?.toString() ?? p['name']?.toString() ?? 'Property';
          final price = p['price'] ?? p['asking_price'] ?? p['rent_amount'];
          return _toggleTile(
            title: title,
            subtitle: '${p['_source']} · ${_fmtPrice(price)}',
            value: visible,
            busy: busy,
            onChanged: (v) => _toggleVisibility(
              itemType: 'property',
              itemId: id,
              nextVisible: v,
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
                'No influencer profile yet. Apply from the website Referral Hub to get approved.',
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
                    Text(
                      'Audience: ${profile['audience_size']}',
                      style: const TextStyle(fontSize: 13, color: DfColors.muted),
                    ),
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
            subtitle: Text(
              _fmtPrice(p['price']),
              style: const TextStyle(color: DfColors.muted, fontSize: 12),
            ),
          );
        }),
    ];
  }

  Widget _toggleTile({
    required String title,
    required String subtitle,
    required bool value,
    required bool busy,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: SwitchListTile(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
        value: value,
        activeThumbColor: DfColors.brand,
        onChanged: busy ? null : onChanged,
        secondary: busy
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
              )
            : null,
      ),
    );
  }

  String _shortDate(Object? raw) {
    if (raw == null) return '';
    final dt = DateTime.tryParse(raw.toString());
    if (dt == null) return '';
    return DateFormat('dd MMM').format(dt.toLocal());
  }
}

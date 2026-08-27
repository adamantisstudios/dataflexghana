import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/influencer_api.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/display_format.dart';
import 'marketplace_common.dart';

/// Mirrors MarketplaceInfluencersSection.tsx: Apply, My packages and Orders.
class InfluencersSection extends StatefulWidget {
  const InfluencersSection({super.key});

  @override
  State<InfluencersSection> createState() => _InfluencersSectionState();
}

class _InfluencersSectionState extends State<InfluencersSection> with MarketplaceFeedback {
  static const _platforms = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Facebook',
    'Twitter/X',
    'LinkedIn',
  ];

  final _bio = TextEditingController();
  final _niche = TextEditingController();
  final _audience = TextEditingController();
  final _pkgTitle = TextEditingController();
  final _pkgDescription = TextEditingController();
  final _pkgPrice = TextEditingController();
  final _pkgDelivery = TextEditingController(text: '7');
  final _pkgTerms = TextEditingController();
  final List<_SocialRow> _socials = [_SocialRow('Instagram')];

  int _tab = 0;
  bool _loading = true;
  bool _saving = false;
  bool _termsAccepted = false;
  String? _error;
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _packages = [];
  List<Map<String, dynamic>> _orders = [];

  bool get _approved => _profile?['approved'] == true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _bio.dispose();
    _niche.dispose();
    _audience.dispose();
    _pkgTitle.dispose();
    _pkgDescription.dispose();
    _pkgPrice.dispose();
    _pkgDelivery.dispose();
    _pkgTerms.dispose();
    for (final s in _socials) {
      s.dispose();
    }
    super.dispose();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = InfluencerApi.instance;
      final profile = await api.getProfile();
      final packages = await api.getPackages();
      final orders = profile?['approved'] == true
          ? await api.getOrders()
          : <Map<String, dynamic>>[];
      _profile = profile;
      _packages = packages;
      _orders = orders;
      if (profile != null) {
        _bio.text = profile['bio']?.toString() ?? '';
        _niche.text = profile['niche']?.toString() ?? '';
        final size = profile['audience_size'];
        _audience.text = size == null ? '' : size.toString();
        _termsAccepted = true;
        final handles = profile['social_handles'];
        if (handles is Map && handles.isNotEmpty) {
          for (final s in _socials) {
            s.dispose();
          }
          _socials
            ..clear()
            ..addAll(handles.entries
                .map((e) => _SocialRow(e.key.toString(), e.value?.toString() ?? '')));
        }
        if (_approved) _tab = 1;
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitApplication() async {
    final audience = int.tryParse(_audience.text.trim()) ?? 0;
    if (_bio.text.trim().isEmpty) {
      snack('Bio is required', error: true);
      return;
    }
    if (audience < InfluencerApi.minAudience) {
      snack(
        'Audience size must be at least ${InfluencerApi.minAudience}',
        error: true,
      );
      return;
    }
    if (!_termsAccepted) {
      snack('You must accept the Influencer Terms', error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      final handles = <String, String>{};
      for (final s in _socials) {
        final platform = s.platform.text.trim();
        final url = s.url.text.trim();
        if (platform.isNotEmpty && url.isNotEmpty) handles[platform] = url;
      }
      final message = await InfluencerApi.instance.submitApplication(
        bio: _bio.text.trim(),
        niche: _niche.text.trim(),
        audienceSize: audience,
        socialHandles: handles,
        photoUrl: _profile?['photo_url']?.toString(),
      );
      snack(message ?? 'Application submitted');
      await _load(force: true);
    } catch (e) {
      snackError(e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _createPackage() async {
    final price = double.tryParse(_pkgPrice.text.trim()) ?? 0;
    if (_pkgTitle.text.trim().isEmpty || price <= 0) {
      snack('Title and a valid price are required', error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      await InfluencerApi.instance.createPackage(
        title: _pkgTitle.text.trim(),
        description: _pkgDescription.text,
        price: price,
        deliveryDays: int.tryParse(_pkgDelivery.text.trim()) ?? 7,
        terms: _pkgTerms.text,
      );
      _pkgTitle.clear();
      _pkgDescription.clear();
      _pkgPrice.clear();
      _pkgDelivery.text = '7';
      _pkgTerms.clear();
      snack('Package created');
      await _load(force: true);
    } catch (e) {
      snackError(e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _togglePackage(String id, bool active) async {
    try {
      await InfluencerApi.instance.updatePackage(id, isActive: active);
      await _load(force: true);
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _deletePackage(Map<String, dynamic> pkg) async {
    final id = pkg['id']?.toString() ?? '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete package?'),
        content: Text(
          'This permanently removes "${pkg['title'] ?? 'this package'}". Packages with '
          'existing orders cannot be deleted — deactivate them instead.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: DfColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await InfluencerApi.instance.deletePackage(id);
      snack('Package deleted');
      await _load(force: true);
    } catch (e) {
      snackError(e);
    }
  }

  Future<void> _editPackage(Map<String, dynamic> pkg) async {
    final title = TextEditingController(text: pkg['title']?.toString() ?? '');
    final description = TextEditingController(text: pkg['description']?.toString() ?? '');
    final price = TextEditingController(text: pkg['price']?.toString() ?? '');
    final delivery = TextEditingController(text: pkg['delivery_days']?.toString() ?? '7');
    final terms = TextEditingController(text: pkg['terms']?.toString() ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit package'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: title,
                decoration: const InputDecoration(labelText: 'Title', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: description,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: price,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                decoration: const InputDecoration(labelText: 'Price (GHS)', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: delivery,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'Delivery days', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: terms,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Custom terms (optional)',
                  isDense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save changes')),
        ],
      ),
    );

    if (saved == true) {
      final parsedPrice = double.tryParse(price.text.trim()) ?? 0;
      if (title.text.trim().isEmpty || parsedPrice <= 0) {
        snack('Title and price are required', error: true);
      } else {
        try {
          await InfluencerApi.instance.updatePackage(
            pkg['id']?.toString() ?? '',
            title: title.text.trim(),
            description: description.text,
            price: parsedPrice,
            deliveryDays: int.tryParse(delivery.text.trim()) ?? 7,
            terms: terms.text,
          );
          snack('Package updated');
          await _load(force: true);
        } catch (e) {
          snackError(e);
        }
      }
    }

    title.dispose();
    description.dispose();
    price.dispose();
    delivery.dispose();
    terms.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SectionBody(
      loading: _loading,
      error: _error,
      onRefresh: () => _load(force: true),
      children: [
        SectionHeader(
          title: MarketplaceSection.influencers.title,
          subtitle: 'We bring verified clients to you, handle payment collection, and make sure '
              'you get paid for your work. No chasing payments.',
          icon: Icons.auto_awesome,
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: TagChip(
            _approved
                ? 'Approved influencer'
                : _profile != null
                    ? 'Application pending admin approval'
                    : 'Not yet applied',
            color: _approved ? DfColors.brandDark : const Color(0xFF8A6100),
          ),
        ),
        const SizedBox(height: 12),
        SegmentedButton<int>(
          segments: [
            const ButtonSegment(value: 0, label: Text('Apply')),
            ButtonSegment(value: 1, label: const Text('Packages'), enabled: _approved),
            ButtonSegment(value: 2, label: const Text('Orders'), enabled: _approved),
          ],
          selected: {_tab},
          showSelectedIcon: false,
          onSelectionChanged: (s) => setState(() => _tab = s.first),
        ),
        const SizedBox(height: 14),
        if (_tab == 0) ..._applyTab() else if (_tab == 1) ..._packagesTab() else ..._ordersTab(),
      ],
    );
  }

  List<Widget> _applyTab() {
    return [
      InfoBanner(
        icon: Icons.info_outline,
        text: 'Minimum audience: ${InfluencerApi.minAudience} followers. The platform fee is '
            '10% for the buyer and 10% for the influencer.',
      ),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _bio,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Bio',
                  hintText: 'Tell clients about your content style and audience…',
                  isDense: true,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _niche,
                decoration: const InputDecoration(
                  labelText: 'Niche',
                  hintText: 'e.g. Fashion, Tech, Comedy',
                  isDense: true,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _audience,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'Audience size', isDense: true),
              ),
              const SizedBox(height: 16),
              SubHeading('Social handles'),
              ..._socials.asMap().entries.map((entry) {
                final i = entry.key;
                final row = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _platforms.contains(row.platform.text)
                                  ? row.platform.text
                                  : null,
                              isExpanded: true,
                              decoration: const InputDecoration(
                                labelText: 'Platform',
                                isDense: true,
                              ),
                              items: [
                                for (final p in _platforms)
                                  DropdownMenuItem(value: p, child: Text(p)),
                              ],
                              onChanged: (v) {
                                if (v != null) setState(() => row.platform.text = v);
                              },
                            ),
                          ),
                          if (_socials.length > 1)
                            IconButton(
                              tooltip: 'Remove',
                              icon: const Icon(Icons.delete_outline, color: DfColors.danger),
                              onPressed: () => setState(() {
                                _socials.removeAt(i).dispose();
                              }),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: row.url,
                        keyboardType: TextInputType.url,
                        decoration: const InputDecoration(
                          labelText: 'Profile URL',
                          isDense: true,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _socials.add(_SocialRow(''))),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add platform'),
                ),
              ),
              const SizedBox(height: 8),
              CheckboxListTile(
                value: _termsAccepted,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: DfColors.brand,
                onChanged: (v) => setState(() => _termsAccepted = v ?? false),
                title: const Text(
                  'I agree to the Influencer Terms and understand the 10% platform fee '
                  '(10% buyer fee + 10% influencer fee).',
                  style: TextStyle(fontSize: 12.5),
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: _saving ? null : _submitApplication,
                child: Text(
                  _saving
                      ? 'Submitting…'
                      : _profile != null
                          ? 'Update application'
                          : 'Submit application',
                ),
              ),
            ],
          ),
        ),
      ),
    ];
  }

  List<Widget> _packagesTab() {
    return [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Create package',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const SizedBox(height: 4),
              const Text(
                'You keep 90% of each order after the 10% influencer platform fee.',
                style: TextStyle(fontSize: 12, color: DfColors.muted),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _pkgTitle,
                decoration: const InputDecoration(labelText: 'Title', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _pkgDescription,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Description', isDense: true),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _pkgPrice,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                      decoration: const InputDecoration(
                        labelText: 'Price (GHS)',
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _pkgDelivery,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(
                        labelText: 'Delivery days',
                        isDense: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _pkgTerms,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Custom terms (optional)',
                  isDense: true,
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _saving ? null : _createPackage,
                child: Text(_saving ? 'Saving…' : 'Add package'),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 16),
      SubHeading('Your packages (${_packages.length})'),
      if (_packages.isEmpty)
        const EmptyState('No packages yet. Create your first package above.')
      else
        ..._packages.map(_packageCard),
    ];
  }

  Widget _packageCard(Map<String, dynamic> pkg) {
    final id = pkg['id']?.toString() ?? '';
    final active = pkg['is_active'] == true;
    final description = pkg['description']?.toString() ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    pkg['title']?.toString() ?? 'Package',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
                TagChip(
                  active ? 'Active' : 'Inactive',
                  color: active ? DfColors.brandDark : DfColors.muted,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  formatGhs(pkg['price']),
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: DfColors.brandDark,
                  ),
                ),
                Text(
                  '${pkg['delivery_days'] ?? 7} day delivery',
                  style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                ),
              ],
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12.5, color: DfColors.muted),
              ),
            ],
            const Divider(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Visible on storefront', style: TextStyle(fontSize: 12.5)),
                Switch(
                  value: active,
                  activeThumbColor: DfColors.brand,
                  onChanged: (v) => _togglePackage(id, v),
                ),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _editPackage(pkg),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: DfColors.danger,
                      side: const BorderSide(color: DfColors.danger),
                    ),
                    onPressed: () => _deletePackage(pkg),
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Delete'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _ordersTab() {
    if (_orders.isEmpty) return [const EmptyState('No orders yet.')];
    return _orders.map((o) {
      final status = o['status']?.toString() ?? 'pending';
      final email = o['client_email']?.toString() ?? '';
      return Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      o['client_name']?.toString() ?? 'Client',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                  TagChip(
                    InfluencerApi.orderStatusLabels[status] ?? status,
                    color: DfColors.brandDark,
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Payout ${formatGhs(o['influencer_payout'])} · '
                'Total paid ${formatGhs(o['total_price'])}',
                style: const TextStyle(fontSize: 12, color: DfColors.muted),
              ),
              const SizedBox(height: 8),
              const InfoBanner(
                text: 'Fee split: the buyer pays a 10% platform fee and the influencer '
                    'contributes 10% from the package payout.',
              ),
              if ((o['requirements']?.toString() ?? '').isNotEmpty)
                Text(
                  'Requirements: ${o['requirements']}',
                  style: const TextStyle(fontSize: 12.5),
                ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${o['client_phone'] ?? ''}${email.isEmpty ? '' : ' · $email'}',
                      style: const TextStyle(fontSize: 11.5, color: DfColors.muted),
                    ),
                  ),
                  if ((o['client_phone']?.toString() ?? '').isNotEmpty)
                    IconButton(
                      tooltip: 'Copy phone',
                      icon: const Icon(Icons.copy, size: 18),
                      onPressed: () => copyToClipboard(
                        o['client_phone'].toString(),
                        message: 'Phone copied',
                      ),
                    ),
                ],
              ),
              Text(
                DisplayFormat.dateAgo(o['created_at']?.toString()),
                style: const TextStyle(fontSize: 11, color: DfColors.muted),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }
}

class _SocialRow {
  _SocialRow(String platformName, [String urlValue = ''])
      : platform = TextEditingController(text: platformName),
        url = TextEditingController(text: urlValue);

  final TextEditingController platform;
  final TextEditingController url;

  void dispose() {
    platform.dispose();
    url.dispose();
  }
}

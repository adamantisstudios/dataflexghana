import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

/// Dashboard "Referral Services" — catalog of referral projects + refer form.
/// (MTN AFA is a separate product; do not map this menu to AFA.)
class ReferralServicesScreen extends StatefulWidget {
  const ReferralServicesScreen({super.key});

  @override
  State<ReferralServicesScreen> createState() => _ReferralServicesScreenState();
}

class _ReferralServicesScreenState extends State<ReferralServicesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _referrals = [];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.getReferralServicesCatalog(
          search: _search.text.trim().isEmpty ? null : _search.text.trim(),
          forceRefresh: force,
        ),
        ApiClient.instance.getMyReferrals(forceRefresh: force),
      ]);
      final services = results[0]['services'];
      final referrals = results[1]['referrals'];
      setState(() {
        _services = services is List
            ? services.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _referrals = referrals is List
            ? referrals.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openRefer(Map<String, dynamic> service) async {
    final submitted = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ReferServiceFormScreen(service: service)),
    );
    if (submitted == true) {
      await _load(force: true);
      _tabs.animateTo(1);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Referral Services'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Services'),
            Tab(text: 'My referrals'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          RefreshIndicator(
            color: DfColors.brand,
            onRefresh: () => _load(force: true),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Available services',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Browse projects, see your commission, and tap Refer to submit a client.',
                  style: TextStyle(color: DfColors.muted, fontSize: 13, height: 1.35),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _search,
                  decoration: InputDecoration(
                    hintText: 'Search services…',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.arrow_forward),
                      onPressed: () => _load(force: true),
                    ),
                  ),
                  onSubmitted: (_) => _load(force: true),
                ),
                const SizedBox(height: 14),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.only(top: 60),
                    child: Center(child: CircularProgressIndicator(color: DfColors.brand)),
                  )
                else if (_error != null)
                  Text(_error!, style: const TextStyle(color: DfColors.danger))
                else if (_services.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 60),
                    child: Center(child: Text('No referral services found', style: TextStyle(color: DfColors.muted))),
                  )
                else
                  ..._services.map(_serviceCard),
              ],
            ),
          ),
          RefreshIndicator(
            color: DfColors.brand,
            onRefresh: () => _load(force: true),
            child: _loading
                ? ListView(children: const [
                    SizedBox(height: 80),
                    Center(child: CircularProgressIndicator(color: DfColors.brand)),
                  ])
                : _referrals.isEmpty
                    ? ListView(children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No referrals yet', style: TextStyle(color: DfColors.muted))),
                      ])
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _referrals.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final r = _referrals[i];
                          final svc = r['services'];
                          final title = svc is Map
                              ? (svc['title']?.toString() ?? 'Service')
                              : 'Service';
                          final when = DateTime.tryParse(r['created_at']?.toString() ?? '');
                          return Card(
                            child: ListTile(
                              title: Text(
                                r['client_name']?.toString() ?? 'Client',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(
                                '$title\n${r['client_phone'] ?? ''} · ${r['status'] ?? 'pending'}'
                                '${when != null ? '\n${DateFormat.yMMMd().format(when.toLocal())}' : ''}',
                              ),
                              isThreeLine: true,
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _serviceCard(Map<String, dynamic> s) {
    final images = <String>[];
    final urls = s['image_urls'];
    if (urls is List) {
      for (final u in urls) {
        final t = u?.toString() ?? '';
        if (t.isNotEmpty) images.add(t);
      }
    }
    final single = s['image_url']?.toString();
    if (images.isEmpty && single != null && single.isNotEmpty) images.add(single);

    final commission = (s['agent_commission'] is num)
        ? (s['agent_commission'] as num).toDouble()
        : (s['commission_amount'] is num)
            ? (s['commission_amount'] as num).toDouble()
            : 0.0;
    final cost = (s['cost'] is num)
        ? (s['cost'] as num).toDouble()
        : (s['product_cost'] is num)
            ? (s['product_cost'] as num).toDouble()
            : 0.0;
    final materials = s['materials_link']?.toString();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (images.isNotEmpty)
            SizedBox(
              height: 160,
              child: PageView.builder(
                itemCount: images.length,
                itemBuilder: (_, i) => CachedNetworkImage(
                  imageUrl: images[i],
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: DfColors.sand),
                  errorWidget: (_, __, ___) => Container(
                    color: DfColors.sand,
                    child: const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s['title']?.toString() ?? 'Service',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17),
                ),
                if ((s['description']?.toString() ?? '').isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    s['description'].toString(),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: DfColors.muted, fontSize: 13, height: 1.35),
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _chip('Earn ${DisplayFormat.money(commission)}', DfColors.brand),
                    _chip('Cost ${DisplayFormat.money(cost)}', Colors.blueGrey),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (materials != null && materials.isNotEmpty)
                      TextButton(
                        onPressed: () => launchUrl(Uri.parse(materials), mode: LaunchMode.externalApplication),
                        child: const Text('Materials'),
                      ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () => _openRefer(s),
                      child: const Text('Refer'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}

class ReferServiceFormScreen extends StatefulWidget {
  const ReferServiceFormScreen({super.key, required this.service});

  final Map<String, dynamic> service;

  @override
  State<ReferServiceFormScreen> createState() => _ReferServiceFormScreenState();
}

class _ReferServiceFormScreenState extends State<ReferServiceFormScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _description = TextEditingController();
  bool _allowContact = true;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty || _phone.text.trim().isEmpty || _description.text.trim().isEmpty) {
      setState(() => _error = 'Client name, phone, and description are required.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ApiClient.instance.submitReferral(
        serviceId: widget.service['id']?.toString() ?? '',
        clientName: _name.text.trim(),
        clientPhone: _phone.text.trim(),
        description: _description.text.trim(),
        allowDirectContact: _allowContact,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Referral submitted successfully')),
      );
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.service['title']?.toString() ?? 'Refer';
    final commission = widget.service['agent_commission'] ?? widget.service['commission_amount'];
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Refer a client', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 22)),
          const SizedBox(height: 6),
          Text(
            'Submit this referral and track it under My referrals. Commission: ${DisplayFormat.money(commission is num ? commission.toDouble() : double.tryParse('$commission') ?? 0)}',
            style: const TextStyle(color: DfColors.muted, height: 1.35),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Client full name *', prefixIcon: Icon(Icons.person_outline)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(labelText: 'Client phone *', prefixIcon: Icon(Icons.phone_iphone)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Project / request details *',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.notes_outlined),
            ),
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _allowContact,
            onChanged: (v) => setState(() => _allowContact = v ?? true),
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('Allow admin to contact the client directly', style: TextStyle(fontSize: 13)),
          ),
          if (_error != null) Text(_error!, style: const TextStyle(color: DfColors.danger)),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Submit referral'),
          ),
        ],
      ),
    );
  }
}

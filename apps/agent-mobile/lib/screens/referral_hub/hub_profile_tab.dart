import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../services/session_store.dart';
import '../../theme/app_theme.dart';

class HubProfileTab extends StatefulWidget {
  const HubProfileTab({super.key});

  @override
  State<HubProfileTab> createState() => _HubProfileTabState();
}

class _HubProfileTabState extends State<HubProfileTab> {
  final _storeName = TextEditingController();
  final _storeSlug = TextEditingController();
  final _primaryColor = TextEditingController(text: '#0E8F3D');
  final _whatsapp = TextEditingController();
  final _phone = TextEditingController();
  final _channelUrl = TextEditingController();
  final _businessInfo = TextEditingController();

  bool _showWhatsappPopup = true;
  bool _loading = true;
  bool _saving = false;
  bool _checkingSlug = false;
  String? _error;
  String? _slugStatus;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _storeName.dispose();
    _storeSlug.dispose();
    _primaryColor.dispose();
    _whatsapp.dispose();
    _phone.dispose();
    _channelUrl.dispose();
    _businessInfo.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.getStoreProfile();
      final profile = data['profile'];
      if (profile is Map) {
        final p = Map<String, dynamic>.from(profile);
        _storeName.text = p['store_name']?.toString() ?? '';
        _storeSlug.text = p['store_slug']?.toString() ?? '';
        _primaryColor.text = p['primary_color']?.toString() ?? '#0E8F3D';
        _whatsapp.text = p['whatsapp_number']?.toString() ?? '';
        _phone.text = p['phone_number']?.toString() ?? '';
        _channelUrl.text = p['whatsapp_channel_url']?.toString() ?? '';
        _businessInfo.text = p['business_info']?.toString() ?? '';
        _showWhatsappPopup = p['show_whatsapp_popup'] != false;
      } else {
        final agent = await SessionStore.instance.getAgent();
        _phone.text = agent?['phone_number']?.toString() ?? '';
        _whatsapp.text = agent?['phone_number']?.toString() ?? '';
        final name = agent?['full_name']?.toString() ?? '';
        if (name.isNotEmpty) _storeName.text = name;
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkSlug() async {
    final slug = _storeSlug.text.trim();
    if (slug.isEmpty) {
      setState(() => _slugStatus = 'Enter a slug first');
      return;
    }
    setState(() {
      _checkingSlug = true;
      _slugStatus = null;
    });
    try {
      final agent = await SessionStore.instance.getAgent();
      final data = await ApiClient.instance.checkStoreSlug(
        slug,
        agentId: agent?['id']?.toString(),
      );
      final available = data['available'] == true;
      final reason = data['reason']?.toString();
      final normalized = data['normalized']?.toString();
      if (available) {
        if (normalized != null && normalized.isNotEmpty) {
          _storeSlug.text = normalized;
        }
        setState(() => _slugStatus = 'Slug available');
      } else {
        setState(() => _slugStatus = reason ?? 'Slug unavailable');
      }
    } on ApiException catch (e) {
      setState(() => _slugStatus = e.message);
    } catch (e) {
      setState(() => _slugStatus = e.toString());
    } finally {
      if (mounted) setState(() => _checkingSlug = false);
    }
  }

  Future<void> _save() async {
    var color = _primaryColor.text.trim();
    if (color.isNotEmpty && !color.startsWith('#')) color = '#$color';
    setState(() => _saving = true);
    try {
      await ApiClient.instance.saveStoreProfile({
        'store_name': _storeName.text.trim(),
        'store_slug': _storeSlug.text.trim().isEmpty ? null : _storeSlug.text.trim(),
        'primary_color': color.isEmpty ? '#0E8F3D' : color,
        'whatsapp_number': _whatsapp.text.trim(),
        'phone_number': _phone.text.trim(),
        'whatsapp_channel_url': _channelUrl.text.trim().isEmpty ? null : _channelUrl.text.trim(),
        'show_whatsapp_popup': _showWhatsappPopup,
        'business_info': _businessInfo.text.trim().isEmpty ? null : _businessInfo.text.trim(),
      });
      _snack('Store profile saved');
      await _load();
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: DfColors.brand));
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: DfColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Store profile',
            style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          const Text(
            'Customize your white-label storefront name, slug, and contact details.',
            style: TextStyle(color: DfColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _storeName,
            decoration: const InputDecoration(labelText: 'Store name'),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _storeSlug,
                  decoration: const InputDecoration(
                    labelText: 'Store slug',
                    hintText: 'my-store',
                    helperText: 'Used in /store/{slug}',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: OutlinedButton(
                  onPressed: _checkingSlug ? null : _checkSlug,
                  child: _checkingSlug
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: DfColors.brand),
                        )
                      : const Text('Check'),
                ),
              ),
            ],
          ),
          if (_slugStatus != null) ...[
            const SizedBox(height: 6),
            Text(
              _slugStatus!,
              style: TextStyle(
                fontSize: 12,
                color: _slugStatus == 'Slug available' ? DfColors.brand : DfColors.danger,
              ),
            ),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: _primaryColor,
            decoration: const InputDecoration(
              labelText: 'Primary color',
              hintText: '#0E8F3D',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _whatsapp,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'WhatsApp number'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Phone number'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _channelUrl,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'WhatsApp channel URL',
              hintText: 'https://whatsapp.com/channel/...',
            ),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Show WhatsApp popup'),
            subtitle: const Text('Prompt visitors to chat on WhatsApp'),
            value: _showWhatsappPopup,
            activeThumbColor: DfColors.brand,
            onChanged: (v) => setState(() => _showWhatsappPopup = v),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _businessInfo,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Business info',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Save profile'),
          ),
        ],
      ),
    );
  }
}

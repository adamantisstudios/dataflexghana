import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class ChannelsScreen extends StatefulWidget {
  const ChannelsScreen({super.key});

  @override
  State<ChannelsScreen> createState() => _ChannelsScreenState();
}

class _ChannelsScreenState extends State<ChannelsScreen> {
  List<Map<String, dynamic>> _channels = [];
  bool _loading = true;
  String? _error;
  String? _joining;

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
      final data = await ApiClient.instance.getChannels();
      setState(() {
        _channels = (data['channels'] is List)
            ? (data['channels'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Future<void> _join(Map<String, dynamic> channel) async {
    final id = channel['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final paid = channel['subscription_enabled'] == true;
    String? message;
    if (paid) {
      final ctrl = TextEditingController();
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Join request'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'This channel has a monthly fee of GHS ${(channel['subscription_fee'] is num) ? (channel['subscription_fee'] as num).toStringAsFixed(0) : channel['subscription_fee']}. Include a short message.',
                style: const TextStyle(fontSize: 13, color: DfColors.muted),
              ),
              const SizedBox(height: 10),
              TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'Message *'), maxLines: 2),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Request')),
          ],
        ),
      );
      if (ok != true) return;
      message = ctrl.text.trim();
      if (!mounted) return;
      if (message.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message required for paid channels')));
        return;
      }
    }

    setState(() => _joining = id);
    try {
      final res = await ApiClient.instance.joinChannel(id, requestMessage: message);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            res['requiresPayment'] == true
                ? 'Join requested — complete payment on the website if required.'
                : 'Join request submitted',
          ),
        ),
      );
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _joining = null);
    }
  }

  Future<void> _openWeb(String? channelId) async {
    final base = await SessionStore.instance.getBaseUrl();
    final path = channelId == null || channelId.isEmpty
        ? '$base/agent/teaching'
        : '$base/agent/teaching?channel=$channelId';
    await launchUrl(Uri.parse(path), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dataflex Channels'),
        actions: [
          IconButton(onPressed: () => _openWeb(null), icon: const Icon(Icons.open_in_new)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : RefreshIndicator(
              onRefresh: _load,
              color: DfColors.brand,
              child: _error != null
                  ? ListView(children: [Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: DfColors.danger)))])
                  : _channels.isEmpty
                      ? ListView(children: const [SizedBox(height: 80), Center(child: Text('No public channels yet'))])
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _channels.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final c = _channels[i];
                            final id = c['id']?.toString() ?? '';
                            final img = DisplayFormat.resolveImageUrl(c['image_url']?.toString());
                            final status = c['membership_status']?.toString() ?? 'none';
                            final isMember = c['is_member'] == true || status == 'active';
                            final joining = _joining == id;
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: img.isEmpty
                                          ? Container(
                                              width: 64,
                                              height: 64,
                                              color: Colors.black12,
                                              child: const Icon(Icons.podcasts),
                                            )
                                          : CachedNetworkImage(
                                              imageUrl: img,
                                              width: 64,
                                              height: 64,
                                              fit: BoxFit.cover,
                                            ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            c['name']?.toString() ?? 'Channel',
                                            style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                                          ),
                                          if ((c['description']?.toString() ?? '').isNotEmpty)
                                            Text(
                                              c['description'].toString(),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(color: DfColors.muted, fontSize: 12),
                                            ),
                                          const SizedBox(height: 4),
                                          Text(
                                            isMember
                                                ? 'Member · $status'
                                                : c['subscription_enabled'] == true
                                                    ? 'Paid · GHS ${c['subscription_fee']} / mo · $status'
                                                    : 'Free · $status',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              if (!isMember && status != 'pending')
                                                ElevatedButton(
                                                  onPressed: joining ? null : () => _join(c),
                                                  style: ElevatedButton.styleFrom(minimumSize: const Size(88, 36)),
                                                  child: joining
                                                      ? const SizedBox(
                                                          width: 16,
                                                          height: 16,
                                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                                        )
                                                      : const Text('Join'),
                                                )
                                              else
                                                OutlinedButton(
                                                  onPressed: () => _openWeb(id),
                                                  style: OutlinedButton.styleFrom(minimumSize: const Size(88, 36)),
                                                  child: Text(isMember ? 'Open' : 'View'),
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
                          },
                        ),
            ),
    );
  }
}

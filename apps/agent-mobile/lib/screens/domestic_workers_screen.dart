import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';
import 'domestic_worker_hire_screen.dart';
import 'domestic_worker_register_screen.dart';

class DomesticWorkersScreen extends StatefulWidget {
  const DomesticWorkersScreen({super.key});

  @override
  State<DomesticWorkersScreen> createState() => _DomesticWorkersScreenState();
}

class _DomesticWorkersScreenState extends State<DomesticWorkersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _search = TextEditingController();
  List<Map<String, dynamic>> _workers = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({int page = 1}) async {
    setState(() {
      _loading = true;
      _error = null;
      _page = page;
    });
    try {
      final data = await ApiClient.instance.getDomesticWorkers(
        search: _search.text,
        page: page,
      );
      final list = data['workers'];
      final pag = data['pagination'];
      setState(() {
        _workers = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
        _totalPages = pag is Map ? (pag['totalPages'] as num?)?.toInt() ?? 1 : 1;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openWhatsAppAdmin(Map<String, dynamic> w) async {
    final msg = '''Hello Admin, I'm interested in this domestic worker:

Worker ID: ${w['id']}
Name: ${w['full_name']}
Experience: ${w['years_of_experience']} years
Location: ${w['current_location']}
Skills: ${w['key_skills']}

Please provide more details and arrange a meeting.''';
    final uri = Uri.parse('https://wa.me/233246827049?text=${Uri.encodeComponent(msg)}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _browseTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _search,
                  decoration: const InputDecoration(
                    hintText: 'Search by name, location, skills…',
                    prefixIcon: Icon(Icons.search),
                    isDense: true,
                  ),
                  onSubmitted: (_) => _load(page: 1),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _load(page: 1),
                style: ElevatedButton.styleFrom(minimumSize: const Size(48, 48)),
                child: const Icon(Icons.search),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
                  : RefreshIndicator(
                      onRefresh: () => _load(page: _page),
                      color: DfColors.brand,
                      child: _workers.isEmpty
                          ? ListView(
                              children: const [
                                SizedBox(height: 80),
                                Center(
                                  child: Text(
                                    'No published workers found.\nTry a different search.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: DfColors.muted),
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                              itemCount: _workers.length + 1,
                              separatorBuilder: (_, _) => const SizedBox(height: 12),
                              itemBuilder: (context, i) {
                                if (i == _workers.length) {
                                  return Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      TextButton(
                                        onPressed: _page > 1 ? () => _load(page: _page - 1) : null,
                                        child: const Text('Previous'),
                                      ),
                                      Text('Page $_page / $_totalPages'),
                                      TextButton(
                                        onPressed: _page < _totalPages ? () => _load(page: _page + 1) : null,
                                        child: const Text('Next'),
                                      ),
                                    ],
                                  );
                                }
                                final w = _workers[i];
                                return _WorkerCard(
                                  worker: w,
                                  onHire: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => DomesticWorkerHireScreen(worker: w),
                                      ),
                                    );
                                  },
                                  onWhatsApp: () => _openWhatsAppAdmin(w),
                                );
                              },
                            ),
                    ),
        ),
      ],
    );
  }

  Widget _generalHireTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Request domestic help', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
        const SizedBox(height: 6),
        const Text(
          'Submit a general hire request when the client has not chosen a specific worker yet. Admin will match a candidate.',
          style: TextStyle(color: DfColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DomesticWorkerHireScreen()),
            );
          },
          icon: const Icon(Icons.person_search),
          label: const Text('Open hire request form'),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            final uri = Uri.parse(
              'https://wa.me/233246827049?text=${Uri.encodeComponent("Hello Admin, I need help finding a domestic worker for a client.")}',
            );
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          },
          icon: const Icon(Icons.chat),
          label: const Text('Chat admin on WhatsApp'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Domestic Workers'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Browse & Hire'),
            Tab(text: 'General Request'),
            Tab(text: 'Register Worker'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _browseTab(),
          _generalHireTab(),
          const DomesticWorkerRegisterScreen(embedded: true),
        ],
      ),
    );
  }
}

class _WorkerCard extends StatelessWidget {
  const _WorkerCard({required this.worker, required this.onHire, required this.onWhatsApp});
  final Map<String, dynamic> worker;
  final VoidCallback onHire;
  final VoidCallback onWhatsApp;

  String _abridged(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length <= 1) return name;
    return '${parts.first} ${parts.last[0]}.';
  }

  @override
  Widget build(BuildContext context) {
    final img = worker['image_url_1']?.toString() ?? '';
    final available = worker['availability_status']?.toString() == 'available';
    final extras = <String>[
      if ((worker['image_url_2']?.toString() ?? '').isNotEmpty) '2',
      if ((worker['image_url_3']?.toString() ?? '').isNotEmpty) '3',
    ];

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onHire,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: img.isEmpty
                        ? Container(
                            width: 84,
                            height: 84,
                            color: Colors.black12,
                            child: const Icon(Icons.person, size: 36),
                          )
                        : CachedNetworkImage(
                            imageUrl: DisplayFormat.resolveImageUrl(img),
                            width: 84,
                            height: 84,
                            fit: BoxFit.cover,
                          ),
                  ),
                  if (extras.isNotEmpty)
                    Positioned(
                      right: 4,
                      bottom: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
                        child: Text('+${extras.length}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _abridged(worker['full_name']?.toString() ?? 'Worker'),
                            style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: available ? DfColors.brand.withValues(alpha: 0.12) : Colors.orange.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            available ? 'Available' : 'Busy',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: available ? DfColors.brandDark : Colors.orange.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${worker['years_of_experience'] ?? 0} yrs · ${worker['current_location'] ?? '—'}',
                      style: const TextStyle(color: DfColors.muted, fontSize: 12),
                    ),
                    if ((worker['key_skills']?.toString() ?? '').isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        worker['key_skills'].toString(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, height: 1.3),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: onHire,
                            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(40)),
                            child: const Text('Request hire'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.outlined(
                          onPressed: onWhatsApp,
                          icon: const Icon(Icons.chat, color: DfColors.brandDark),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

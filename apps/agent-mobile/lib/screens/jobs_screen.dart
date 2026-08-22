import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';
import 'job_detail_screen.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  static const _industries = [
    ('all', 'All Jobs'),
    ('featured', 'Featured'),
    ('Technology', 'Technology'),
    ('Finance', 'Finance'),
    ('Healthcare', 'Healthcare'),
    ('Marketing', 'Marketing'),
    ('Sales', 'Sales'),
    ('Customer Service', 'Customer Service'),
  ];

  final _search = TextEditingController();
  String _industry = 'all';
  List<Map<String, dynamic>> _jobs = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  bool _fromCache = false;

  @override
  void initState() {
    super.initState();
    _load(force: false);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  bool get _featured => _industry == 'featured';

  Future<void> _load({bool force = false, int page = 1}) async {
    if (page == 1) {
      setState(() {
        _loading = true;
        _error = null;
        _page = 1;
        if (force) _fromCache = false;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final data = await ApiClient.instance.jobs(
        search: _search.text,
        industry: _featured ? '' : (_industry == 'all' ? '' : _industry),
        featured: _featured,
        page: page,
        forceRefresh: force,
        onUpdated: (fresh) {
          if (!mounted || page != 1) return;
          _applyPayload(fresh, page: 1, fromCache: false);
        },
      );
      if (!mounted) return;
      _applyPayload(data, page: page, fromCache: !force && page == 1);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  void _applyPayload(Map<String, dynamic> data, {required int page, required bool fromCache}) {
    final list = (data['jobs'] is List)
        ? (data['jobs'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : <Map<String, dynamic>>[];
    final pagination = data['pagination'];
    var totalPages = 1;
    if (pagination is Map && pagination['totalPages'] is num) {
      totalPages = (pagination['totalPages'] as num).toInt().clamp(1, 999);
    }
    setState(() {
      _page = page;
      if (page == 1) {
        _jobs = list;
        _fromCache = fromCache;
      } else {
        _jobs = [..._jobs, ...list];
      }
      _totalPages = totalPages;
    });
  }

  void _onFilter(String id) {
    setState(() {
      _industry = id;
      _page = 1;
    });
    _load(force: true);
  }

  void _onSearch() {
    setState(() => _page = 1);
    _load(force: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Opportunities'),
        actions: [
          if (_fromCache)
            const Padding(
              padding: EdgeInsets.only(right: 8),
              child: Center(
                child: Text('Cached', style: TextStyle(fontSize: 11, color: Colors.white70)),
              ),
            ),
          IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search title, company, location…',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(onPressed: _onSearch, icon: const Icon(Icons.arrow_forward)),
              ),
              onSubmitted: (_) => _onSearch(),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _industries.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final (id, label) = _industries[i];
                final selected = _industry == id;
                return FilterChip(
                  label: Text(label),
                  selected: selected,
                  onSelected: (_) => _onFilter(id),
                  selectedColor: DfColors.brand.withValues(alpha: 0.2),
                  checkmarkColor: DfColors.brandDark,
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
                : _error != null
                    ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
                    : RefreshIndicator(
                        onRefresh: () => _load(force: true),
                        color: DfColors.brand,
                        child: _jobs.isEmpty
                            ? ListView(
                                children: const [
                                  SizedBox(height: 80),
                                  Center(child: Text('No jobs match your search.', style: TextStyle(color: DfColors.muted))),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                                itemCount: _jobs.length + (_page < _totalPages ? 1 : 0),
                                separatorBuilder: (_, __) => const SizedBox(height: 12),
                                itemBuilder: (context, i) {
                                  if (i == _jobs.length) {
                                    return Center(
                                      child: _loadingMore
                                          ? const Padding(
                                              padding: EdgeInsets.all(16),
                                              child: CircularProgressIndicator(color: DfColors.brand),
                                            )
                                          : TextButton(
                                              onPressed: () => _load(page: _page + 1),
                                              child: const Text('Load more jobs'),
                                            ),
                                    );
                                  }
                                  return _JobCard(
                                    job: _jobs[i],
                                    onTap: () async {
                                      final id = _jobs[i]['id']?.toString() ?? '';
                                      if (id.isEmpty) return;
                                      await Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => JobDetailScreen(jobId: id)),
                                      );
                                    },
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job, required this.onTap});
  final Map<String, dynamic> job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final logo = DisplayFormat.resolveImageUrl(job['employer_logo_url']?.toString());
    final title = job['job_title']?.toString() ?? job['industry']?.toString() ?? 'Job opening';
    final company = job['employer_name']?.toString() ?? 'Employer';
    final location = job['location']?.toString() ?? '';
    final featured = job['is_featured'] == true;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: DfColors.brand.withValues(alpha: 0.12)),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: logo.isNotEmpty
                      ? CachedNetworkImage(imageUrl: logo, fit: BoxFit.cover, errorWidget: (_, __, ___) => _logoFallback())
                      : _logoFallback(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
                        ),
                        if (featured)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF7ED),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFF59E0B)),
                            ),
                            child: const Text('Featured', style: TextStyle(fontSize: 10, color: Color(0xFFB45309), fontWeight: FontWeight.w700)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(company, style: const TextStyle(color: DfColors.muted, fontSize: 13)),
                    if (location.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: DfColors.muted),
                          const SizedBox(width: 4),
                          Expanded(child: Text(location, style: const TextStyle(fontSize: 12, color: DfColors.muted))),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(DisplayFormat.salary(job), style: TextStyle(fontWeight: FontWeight.w600, color: DfColors.brandDark, fontSize: 13)),
                    Text(DisplayFormat.dateAgo(job['created_at']?.toString()), style: const TextStyle(fontSize: 11, color: DfColors.muted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: DfColors.muted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _logoFallback() => Container(
        color: DfColors.brand.withValues(alpha: 0.1),
        child: const Icon(Icons.business, color: DfColors.brand),
      );
}

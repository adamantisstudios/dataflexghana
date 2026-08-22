import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../utils/display_format.dart';

class JobDetailScreen extends StatefulWidget {
  const JobDetailScreen({super.key, required this.jobId});
  final String jobId;

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load(force: false);
  }

  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.jobDetail(widget.jobId, forceRefresh: force);
      final job = data['job'];
      if (job is! Map) throw ApiException('Job not found');
      if (mounted) setState(() => _job = Map<String, dynamic>.from(job));
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openUrl(String? url) async {
    if (url == null || url.trim().isEmpty) return;
    final uri = Uri.tryParse(url.trim());
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        actions: [IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: DfColors.danger)))
              : _job == null
                  ? const Center(child: Text('Job not found'))
                  : RefreshIndicator(
                      onRefresh: () => _load(force: true),
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          _Header(job: _job!),
                          const SizedBox(height: 16),
                          _InfoTile(icon: Icons.payments_outlined, label: 'Salary', value: DisplayFormat.salary(_job!)),
                          _InfoTile(icon: Icons.location_on_outlined, label: 'Location', value: _job!['location']?.toString() ?? '—'),
                          if (_job!['industry'] != null)
                            _InfoTile(icon: Icons.category_outlined, label: 'Industry', value: _job!['industry']?.toString() ?? ''),
                          if (_job!['application_deadline'] != null)
                            _InfoTile(icon: Icons.event, label: 'Deadline', value: _job!['application_deadline']?.toString() ?? ''),
                          const SizedBox(height: 12),
                          _Section(title: 'Description', body: _job!['description']?.toString()),
                          _Section(title: 'Requirements', body: _job!['requirements']?.toString()),
                          const SizedBox(height: 16),
                          if (_job!['contact_email'] != null)
                            _InfoTile(icon: Icons.email_outlined, label: 'Email', value: _job!['contact_email']?.toString() ?? ''),
                          if (_job!['contact_phone'] != null)
                            _InfoTile(icon: Icons.phone_outlined, label: 'Phone', value: _job!['contact_phone']?.toString() ?? ''),
                          const SizedBox(height: 20),
                          if (_job!['application_url'] != null)
                            ElevatedButton.icon(
                              onPressed: () => _openUrl(_job!['application_url']?.toString()),
                              icon: const Icon(Icons.open_in_new),
                              label: const Text('Apply on website'),
                            ),
                        ],
                      ),
                    ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.job});
  final Map<String, dynamic> job;

  @override
  Widget build(BuildContext context) {
    final logo = DisplayFormat.resolveImageUrl(job['employer_logo_url']?.toString());
    final title = job['job_title']?.toString() ?? 'Job opening';
    final company = job['employer_name']?.toString() ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 64,
              height: 64,
              child: logo.isNotEmpty
                  ? CachedNetworkImage(imageUrl: logo, fit: BoxFit.cover)
                  : Container(color: DfColors.brand.withValues(alpha: 0.12), child: const Icon(Icons.business, color: DfColors.brand, size: 32)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20)),
                if (company.isNotEmpty) Text(company, style: const TextStyle(color: DfColors.muted)),
                Text(DisplayFormat.dateAgo(job['created_at']?.toString()), style: const TextStyle(fontSize: 12, color: DfColors.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: DfColors.brand),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.body});
  final String title;
  final String? body;

  @override
  Widget build(BuildContext context) {
    if (body == null || body!.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 8),
          Text(body!, style: const TextStyle(height: 1.5)),
        ],
      ),
    );
  }
}

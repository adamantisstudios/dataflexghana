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
    var raw = url.trim();
    if (!raw.contains(':')) raw = 'https://$raw';
    final uri = Uri.tryParse(raw);
    if (uri == null) return;
    await _launch(uri);
  }

  Future<void> _launch(Uri uri) async {
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) throw Exception('no handler');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No app available to open ${uri.scheme}')),
      );
    }
  }

  String? _text(Object? value) {
    final s = value?.toString().trim() ?? '';
    return s.isEmpty || s == 'null' ? null : s;
  }

  Future<void> _applyByEmail(String email) async {
    final title = _text(_job?['job_title']) ?? 'your vacancy';
    final employer = _text(_job?['employer_name']);
    final body = '''Dear ${employer ?? 'Hiring Manager'},

I would like to apply for the $title position advertised on DataFlex Ghana.

Please find my details below. I have attached my CV for your consideration.

Kind regards,''';
    await _launch(
      Uri(
        scheme: 'mailto',
        path: email,
        query: Uri(queryParameters: {
          'subject': 'Application for $title',
          'body': body,
        }).query,
      ),
    );
  }

  Widget _buildApplyCard() {
    final job = _job!;
    final method = _text(job['application_method'])?.toLowerCase();
    final url = _text(job['application_url']);
    final email = _text(job['contact_email']);
    final phone = _text(job['contact_phone']);

    if (url == null && email == null && phone == null && method == null) {
      return const SizedBox.shrink();
    }

    // Website prefers the declared method, but falls back to whatever contact
    // details exist so an agent is never left with a dead end.
    final actions = <Widget>[];
    if (url != null && (method == 'hyperlink' || method == 'website' || method == null || email == null)) {
      actions.add(_ApplyButton(
        icon: Icons.public,
        label: 'Apply on Company Website',
        onTap: () => _openUrl(url),
        primary: true,
      ));
    }
    if (email != null) {
      actions.add(_ApplyButton(
        icon: Icons.mail_outline,
        label: 'Send Email Application',
        sublabel: email,
        onTap: () => _applyByEmail(email),
        primary: actions.isEmpty,
      ));
    }
    if (phone != null) {
      actions.add(_ApplyButton(
        icon: Icons.call_outlined,
        label: 'Call Employer',
        sublabel: phone,
        onTap: () => _launch(Uri(scheme: 'tel', path: phone)),
        primary: actions.isEmpty,
      ));
      actions.add(_ApplyButton(
        icon: Icons.chat_bubble_outline,
        label: 'WhatsApp Employer',
        onTap: () => _openUrl('https://wa.me/${phone.replaceAll(RegExp(r'\D'), '')}'),
        primary: false,
      ));
    }
    if (actions.isEmpty) {
      actions.add(
        Text(
          method ?? 'Contact the employer directly using the information above.',
          style: const TextStyle(color: DfColors.muted, height: 1.4),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [DfColors.brand.withValues(alpha: 0.10), const Color(0xFF3B82F6).withValues(alpha: 0.10)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DfColors.brand.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt, color: DfColors.brand),
              const SizedBox(width: 8),
              Text('How to Apply', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Tap an option below to start your application right away.',
            style: TextStyle(color: DfColors.muted, fontSize: 12.5, height: 1.35),
          ),
          const SizedBox(height: 14),
          for (final a in actions) Padding(padding: const EdgeInsets.only(bottom: 10), child: a),
        ],
      ),
    );
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
                          const SizedBox(height: 8),
                          _buildApplyCard(),
                          const SizedBox(height: 24),
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

class _ApplyButton extends StatelessWidget {
  const _ApplyButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.primary,
    this.sublabel,
  });

  final IconData icon;
  final String label;
  final String? sublabel;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final fg = primary ? Colors.white : DfColors.brandDark;
    return Material(
      color: primary ? DfColors.brand : Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: primary ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: primary ? Colors.transparent : DfColors.brand.withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: fg),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                    if (sublabel != null)
                      Text(
                        sublabel!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: fg.withValues(alpha: 0.8),
                          fontSize: 11.5,
                        ),
                      ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_rounded, size: 18, color: fg.withValues(alpha: 0.9)),
            ],
          ),
        ),
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

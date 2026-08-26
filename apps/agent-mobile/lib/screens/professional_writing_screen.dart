import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'professional_writing_form_screen.dart';

class WritingService {
  const WritingService({
    required this.id,
    required this.title,
    required this.price,
    required this.blurb,
  });

  final String id;
  final String title;
  final int price;
  final String blurb;
}

const writingServices = <WritingService>[
  WritingService(
    id: 'resume-writing',
    title: 'Resume Writing',
    price: 65,
    blurb: 'Professional resume tailored for your industry',
  ),
  WritingService(
    id: 'curriculum-vitae',
    title: 'Curriculum Vitae',
    price: 65,
    blurb: 'Detailed academic / professional CV',
  ),
  WritingService(
    id: 'business-presentation',
    title: 'Business Presentation',
    price: 80,
    blurb: 'Pitch decks and business presentations',
  ),
  WritingService(
    id: 'international-resume',
    title: 'International Resume',
    price: 270,
    blurb: 'Country-specific CV formats (Europass, US, UK, etc.)',
  ),
];

class ProfessionalWritingScreen extends StatefulWidget {
  const ProfessionalWritingScreen({super.key});

  @override
  State<ProfessionalWritingScreen> createState() => _ProfessionalWritingScreenState();
}

class _ProfessionalWritingScreenState extends State<ProfessionalWritingScreen> {
  List<Map<String, dynamic>> _submissions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = true}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.writingSubmissions(forceRefresh: force);
      final list = data['submissions'];
      setState(() {
        _submissions = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
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

  Future<void> _openService(WritingService service) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => ProfessionalWritingFormScreen(service: service),
      ),
    );
    if (result == true) _load(force: true);
  }

  String _formatDate(Object? raw) {
    if (raw == null) return '—';
    final dt = DateTime.tryParse(raw.toString());
    if (dt == null) return raw.toString();
    return DateFormat('dd MMM yyyy, HH:mm').format(dt.toLocal());
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return DfColors.brand;
      case 'in_progress':
      case 'processing':
        return Colors.orange.shade700;
      case 'rejected':
      case 'cancelled':
        return DfColors.danger;
      default:
        return DfColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Professional Writing'),
        actions: [
          IconButton(onPressed: () => _load(force: true), icon: const Icon(Icons.refresh)),
        ],
      ),
      body: RefreshIndicator(
        color: DfColors.brand,
        onRefresh: () => _load(force: true),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Writing services',
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            const Text(
              'Request a resume, CV, presentation, or international CV.',
              style: TextStyle(color: DfColors.muted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            ...writingServices.map((s) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => _openService(s),
                    child: Ink(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFEC4899).withValues(alpha: 0.35)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEC4899).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.description_outlined, color: Color(0xFFBE185D)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.title,
                                  style: GoogleFonts.dmSans(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                                Text(s.blurb, style: const TextStyle(fontSize: 12, color: DfColors.muted)),
                              ],
                            ),
                          ),
                          Text(
                            '₵${s.price}',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFFBE185D),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 8),
            Text(
              'Your submissions',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: DfColors.brand)),
              )
            else if (_error != null)
              Text(_error!, style: const TextStyle(color: DfColors.danger))
            else if (_submissions.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No submissions yet. Choose a service above to get started.',
                  style: TextStyle(color: DfColors.muted),
                ),
              )
            else
              ..._submissions.map((sub) {
                final status = sub['status']?.toString() ?? 'pending';
                final type = sub['service_label']?.toString() ??
                    sub['service_type']?.toString() ??
                    'Writing';
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: DfColors.brand.withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(type, style: const TextStyle(fontWeight: FontWeight.w700)),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: _statusColor(status).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              status,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: _statusColor(status),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Submitted ${_formatDate(sub['submitted_at'] ?? sub['created_at'])}',
                        style: const TextStyle(fontSize: 12, color: DfColors.muted),
                      ),
                      if (sub['cv_type'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'CV type: ${sub['cv_type']}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                    ],
                  ),
                );
              }),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }
}

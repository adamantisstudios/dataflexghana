import 'dart:convert';

/// Format helpers mirroring the website job board + fashion catalog.
class DisplayFormat {
  static String salary(Map<String, dynamic> job) {
    final type = job['salary_type']?.toString();
    final currency = job['salary_currency']?.toString() ?? 'GHS ';
    if (type == null || type.isEmpty) return 'Not specified';
    switch (type) {
      case 'negotiable':
        return 'Negotiable';
      case 'fixed_range':
        final min = job['salary_min'];
        final max = job['salary_max'];
        if (min is num && max is num) {
          return '$currency${min.toStringAsFixed(0)} - $currency${max.toStringAsFixed(0)}';
        }
        return 'Not specified';
      case 'exact_amount':
        final exact = job['salary_exact'];
        if (exact is num) return '$currency${exact.toStringAsFixed(0)}';
        return 'Not specified';
      default:
        return job['salary_custom']?.toString() ?? 'Not specified';
    }
  }

  static String dateAgo(String? raw) {
    if (raw == null || raw.isEmpty) return 'Recently';
    final date = DateTime.tryParse(raw);
    if (date == null) return 'Recently';
    final now = DateTime.now();
    final d = DateTime(date.year, date.month, date.day);
    final n = DateTime(now.year, now.month, now.day);
    final diff = n.difference(d).inDays;
    if (diff <= 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    if (diff < 7) return '$diff days ago';
    return '${diff ~/ 7} weeks ago';
  }

  static String money(num? value, {String prefix = 'GHS '}) {
    if (value == null) return '${prefix}0.00';
    return '$prefix${value.toStringAsFixed(2)}';
  }

  static String resolveImageUrl(String? raw, {String base = 'https://www.dataflexghana.com'}) {
    if (raw == null || raw.trim().isEmpty) return '';
    final s = raw.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('//')) return 'https:$s';
    if (s.startsWith('/')) return '$base$s';
    return '$base/$s';
  }
}

bool mapsEqualJson(Map<String, dynamic> a, Map<String, dynamic> b) {
  try {
    return jsonEncode(a) == jsonEncode(b);
  } catch (_) {
    return false;
  }
}

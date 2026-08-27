import '../../widgets/ops_widgets.dart';
import 'order_common.dart';

/// A row from `data_orders`, as returned by /api/admin/data-orders.
class DataOrder {
  DataOrder(this.raw);

  final Map<String, dynamic> raw;

  Map<String, dynamic> get _bundle {
    final b = raw['data_bundles'];
    return b is Map ? b.cast<String, dynamic>() : const {};
  }

  Map<String, dynamic> get _agent {
    final a = raw['agents'];
    return a is Map ? a.cast<String, dynamic>() : const {};
  }

  String get id => pick(raw, ['id'], fallback: '');
  String get status => pick(raw, ['status'], fallback: 'pending').toLowerCase();
  String get paymentMethod => pick(raw, ['payment_method'], fallback: 'manual').toLowerCase();
  bool get isWallet => paymentMethod == 'wallet';
  String get recipientPhone => pick(raw, ['recipient_phone']);
  String get reference => pick(raw, ['payment_reference', 'reference_code']);
  String get agentName => pick(_agent, ['full_name'], fallback: 'Unknown agent');
  String get agentPhone => pick(_agent, ['phone_number']);
  String get agentId => pick(raw, ['agent_id'], fallback: '');
  String get provider => pick(_bundle, ['provider'], fallback: '');
  String get adminMessage => pick(raw, ['admin_message'], fallback: '');
  String get createdAt => pick(raw, ['created_at'], fallback: '');
  String get updatedAt => pick(raw, ['updated_at'], fallback: '');
  bool get commissionPaid => raw['commission_paid'] == true;
  double get price => asDouble(_bundle['price'] ?? raw['amount']);
  double get commission => asDouble(raw['commission_amount']);
  String get validityDays => pick(_bundle, ['validity_days'], fallback: '');
  String get bundleStatus => pick(raw, ['bundle_status'], fallback: '');

  /// Mirrors the website's getBundleDisplayName().
  String get bundleName {
    final name = pick(_bundle, ['name'], fallback: '');
    final size = pick(_bundle, ['size_gb'], fallback: '');
    final prov = provider;
    if (name.isNotEmpty && name != 'Bundle Not Found' && name != 'Unknown Bundle') {
      if (name.contains('GB') &&
          (name.contains('MTN') || name.contains('AirtelTigo') || name.contains('Telecel'))) {
        return name;
      }
      if (size.isNotEmpty && prov.isNotEmpty) return '${size}GB $prov - $name';
      if (size.isNotEmpty) return '${size}GB - $name';
      if (prov.isNotEmpty && prov != 'Unknown') return '$prov - $name';
      return name;
    }
    final parts = <String>[];
    if (size.isNotEmpty) parts.add('${size}GB');
    if (prov.isNotEmpty && prov != 'Unknown') parts.add(prov);
    return parts.isEmpty ? 'Unknown bundle' : parts.join(' ');
  }

  /// The website locks completed/canceled orders from further status changes.
  bool get isLocked => status == 'completed' || status == 'canceled' || status == 'cancelled';

  /// Matches the DELETE route's deletableStatuses guard.
  bool get isDeletable => const ['pending', 'canceled', 'failed'].contains(status);

  bool matches(String term) {
    if (term.trim().isEmpty) return true;
    final q = term.toLowerCase().trim();
    return [
      agentName,
      agentPhone,
      recipientPhone,
      reference,
      bundleName,
      id,
      status,
      provider,
    ].any((v) => v.toLowerCase().contains(q));
  }
}

/// A row from `data_orders_log` (guest / no-registration orders).
class BundleLogOrder {
  BundleLogOrder(this.raw);

  final Map<String, dynamic> raw;

  String get id => pick(raw, ['id'], fallback: '');
  String get network => pick(raw, ['network'], fallback: 'Unknown');
  String get bundle => pick(raw, ['data_bundle'], fallback: '—');
  String get phone => pick(raw, ['phone_number']);
  String get reference => pick(raw, ['reference_code']);
  String get paymentMethod => pick(raw, ['payment_method'], fallback: 'manual').toLowerCase();
  String get createdAt => pick(raw, ['created_at'], fallback: '');
  String get updatedAt => pick(raw, ['updated_at'], fallback: '');
  double get amount => asDouble(raw['amount']);

  bool matches(String term) {
    if (term.trim().isEmpty) return true;
    final q = term.toLowerCase().trim();
    return [network, bundle, phone, reference, paymentMethod]
        .any((v) => v.toLowerCase().contains(q));
  }
}

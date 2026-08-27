import '../../services/admin_api.dart';
import '../../services/admin_session.dart';

/// Thin wrapper over the website's admin wallet routes.
///
/// Only routes that actually exist are exposed here — the mobile tab must never
/// invent a money-moving action the backend does not support.
class WalletApi {
  const WalletApi._();

  static const _walletPath = '/api/admin/wallet';

  static String _adminId() {
    final id = AdminSession.instance.admin?.id ?? '';
    if (id.isEmpty) {
      throw AdminApiException('Admin session expired — sign in again.', statusCode: 401);
    }
    return id;
  }

  /// GET /api/admin/wallet-overview → { success, stats { … } }
  static Future<Map<String, dynamic>> overview() async {
    final res = await AdminApi.instance.getJson('/api/admin/wallet-overview');
    final stats = res['stats'];
    return stats is Map ? stats.cast<String, dynamic>() : <String, dynamic>{};
  }

  /// GET /api/admin/wallet-topups?status=&limit=&offset=
  /// → { data: [...wallet_topups + agents], meta: { total, limit, offset, hasMore } }
  static Future<TopupPage> topups({
    String status = 'pending',
    int limit = 25,
    int offset = 0,
  }) async {
    final res = await AdminApi.instance.getJson('/api/admin/wallet-topups', query: {
      'status': status,
      'limit': '$limit',
      'offset': '$offset',
    });
    final raw = res['data'] ?? res['items'];
    final rows = raw is List
        ? raw.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList()
        : <Map<String, dynamic>>[];
    final meta = res['meta'];
    final metaMap = meta is Map ? meta.cast<String, dynamic>() : const <String, dynamic>{};
    return TopupPage(
      rows: rows,
      total: (metaMap['total'] is num) ? (metaMap['total'] as num).toInt() : rows.length,
      hasMore: metaMap['hasMore'] == true,
    );
  }

  /// POST /api/admin/wallet-topups — queues a PENDING request. Never credits.
  static Future<Map<String, dynamic>> createTopupRequest({
    required String agentId,
    required double amount,
    String? paymentReference,
    String? paymentMethod,
  }) async {
    return AdminApi.instance.post('/api/admin/wallet-topups', body: {
      'agent_id': agentId,
      'amount': amount,
      if (paymentReference != null && paymentReference.trim().isNotEmpty)
        'payment_reference': paymentReference.trim(),
      if (paymentMethod != null && paymentMethod.trim().isNotEmpty)
        'payment_method': paymentMethod.trim(),
    });
  }

  /// POST /api/admin/wallet-topups/{id}/reject — pending requests only.
  static Future<Map<String, dynamic>> rejectTopupRequest(String topupId, {String? reason}) async {
    final res = await AdminApi.instance.post(
      '/api/admin/wallet-topups/$topupId/reject',
      body: {
        'admin_id': _adminId(),
        if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
      },
    );
    return {..._data(res), 'message': res['message']};
  }

  /// DELETE /api/admin/wallet-topups/{id} — resolved requests only.
  static Future<Map<String, dynamic>> deleteTopupRequest(String topupId) async {
    final res = await AdminApi.instance.delete('/api/admin/wallet-topups/$topupId');
    return {..._data(res), 'message': res['message']};
  }

  /// GET /api/admin/agents/list?search=&limit= → { agents: [...] }
  /// The route only applies the search filter for terms of 4+ characters.
  static Future<List<Map<String, dynamic>>> agents({String search = '', int limit = 50}) {
    return AdminApi.instance.getList(
      '/api/admin/agents/list',
      query: {'search': search.trim(), 'limit': '$limit'},
      keys: const ['agents'],
    );
  }

  /// POST /api/admin/agents/search { searchTerm } → { agents: [...] }
  /// Used for short search terms that `agents/list` would ignore.
  static Future<List<Map<String, dynamic>>> searchAgents(String term) async {
    final res = await AdminApi.instance.post(
      '/api/admin/agents/search',
      body: {'searchTerm': term.trim()},
    );
    final list = res['agents'];
    if (list is List) {
      return list.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
    }
    return const [];
  }

  /// GET /api/admin/wallet?agent_id=&action=summary
  /// → { data: { balance, summary, recent_transactions } }
  static Future<Map<String, dynamic>> summary(String agentId) async {
    final res = await AdminApi.instance.getJson(
      _walletPath,
      query: {'agent_id': agentId, 'action': 'summary'},
    );
    final data = res['data'];
    return data is Map ? data.cast<String, dynamic>() : <String, dynamic>{};
  }

  /// GET /api/admin/wallet?agent_id=&action=transactions
  static Future<List<Map<String, dynamic>>> transactions(String agentId) async {
    final res = await AdminApi.instance.getJson(
      _walletPath,
      query: {'agent_id': agentId, 'action': 'transactions'},
    );
    final data = res['data'];
    final list = data is Map ? data['transactions'] : null;
    if (list is List) {
      return list.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
    }
    return const [];
  }

  /// GET /api/admin/wallet?agent_id=&action=validate
  static Future<Map<String, dynamic>> validate(String agentId) async {
    final res = await AdminApi.instance.getJson(
      _walletPath,
      query: {'agent_id': agentId, 'action': 'validate'},
    );
    final data = res['data'];
    return data is Map ? data.cast<String, dynamic>() : <String, dynamic>{};
  }

  /// POST /api/admin/wallet { action: 'adjustment', … } — manual credit / debit.
  static Future<Map<String, dynamic>> adjustment({
    required String agentId,
    required double amount,
    required String reason,
    required bool isCredit,
  }) async {
    final res = await AdminApi.instance.post(_walletPath, body: {
      'action': 'adjustment',
      'agent_id': agentId,
      'admin_id': _adminId(),
      'amount': amount,
      'reason': reason,
      'is_positive': isCredit,
    });
    return _data(res);
  }

  /// POST /api/admin/wallet { action: 'sync_balance' } — recompute stored balance.
  static Future<Map<String, dynamic>> syncBalance(String agentId) async {
    final res = await AdminApi.instance.post(_walletPath, body: {
      'action': 'sync_balance',
      'agent_id': agentId,
      'admin_id': _adminId(),
    });
    return _data(res);
  }

  /// POST /api/admin/wallet/reverse — reverse an approved top-up transaction.
  static Future<Map<String, dynamic>> reverseTopup({
    required String transactionId,
    required String agentId,
    required String reason,
  }) async {
    final res = await AdminApi.instance.post('/api/admin/wallet/reverse', body: {
      'transaction_id': transactionId,
      'agent_id': agentId,
      'reason': reason,
    });
    return _data(res);
  }

  /// PUT /api/admin/wallet — approve / reject a pending wallet transaction.
  static Future<Map<String, dynamic>> setTransactionStatus({
    required String transactionId,
    required String status,
    String? adminNotes,
  }) async {
    final res = await AdminApi.instance.put(_walletPath, body: {
      'transaction_id': transactionId,
      'status': status,
      'admin_id': _adminId(),
      if (adminNotes != null && adminNotes.trim().isNotEmpty) 'admin_notes': adminNotes.trim(),
    });
    return _data(res);
  }

  /// POST /api/admin/wallet-topups/{id}/approve — explicit approval of a
  /// pending top-up request. Nothing else credits a wallet automatically.
  static Future<Map<String, dynamic>> approveTopupRequest(String topupId) async {
    final res = await AdminApi.instance.post(
      '/api/admin/wallet-topups/$topupId/approve',
      body: {'admin_id': _adminId()},
    );
    return _data(res);
  }

  static Map<String, dynamic> _data(Map<String, dynamic> res) {
    final data = res['data'];
    return data is Map ? data.cast<String, dynamic>() : <String, dynamic>{};
  }
}

/// One page of the wallet top-up queue.
class TopupPage {
  const TopupPage({required this.rows, required this.total, required this.hasMore});

  final List<Map<String, dynamic>> rows;
  final int total;
  final bool hasMore;
}

/// Transaction types that increase the spendable wallet balance.
/// Mirrors `WALLET_CREDIT_TYPES` in `lib/wallet-transaction-types.ts`.
const walletCreditTypes = <String>{
  'topup',
  'refund',
  'adjustment',
  'credit',
  'deposit',
  'interest',
  'payment_completed',
};

/// Types that decrease the spendable balance (`WALLET_DEBIT_TYPES`).
const walletDebitTypes = <String>{
  'debit',
  'deduction',
  'withdrawal_deduction',
  'withdrawal',
  'penalty',
};

bool isCreditTransaction(String? type) => walletCreditTypes.contains((type ?? '').toLowerCase());

bool isDebitTransaction(String? type) => walletDebitTypes.contains((type ?? '').toLowerCase());

String transactionTypeLabel(String? type) {
  switch ((type ?? '').toLowerCase()) {
    case 'topup':
      return 'Wallet top-up';
    case 'deduction':
      return 'Purchase / order payment';
    case 'refund':
      return 'Refund';
    case 'commission':
    case 'commission_deposit':
      return 'Commission deposit';
    case 'withdrawal':
    case 'withdrawal_deduction':
      return 'Withdrawal';
    case 'adjustment':
    case 'credit':
      return 'Admin credit';
    case 'debit':
      return 'Admin debit';
    case 'penalty':
      return 'Penalty';
    case 'interest':
      return 'Interest';
    case 'deposit':
      return 'Deposit';
    case 'payment_completed':
      return 'Payment completed';
    default:
      return 'Transaction';
  }
}

double asAmount(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse('${value ?? ''}') ?? 0;
}

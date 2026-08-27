import '../../services/admin_api.dart';
import 'storefront_common.dart';

/// Paged payload shared by the three storefront endpoints.
class StorefrontPage<T> {
  const StorefrontPage({
    required this.items,
    required this.page,
    required this.totalPages,
    required this.total,
    this.pendingCount = 0,
  });

  final List<T> items;
  final int page;
  final int totalPages;
  final int total;
  final int pendingCount;
}

/// Thin wrapper over the same admin routes the website's Storefront Management
/// tab calls, so mobile and dashboard never drift apart.
class StorefrontApi {
  StorefrontApi._();
  static final StorefrontApi instance = StorefrontApi._();

  static const _ordersPath = '/api/admin/storefront-orders';
  static const _cashoutProfilesPath = '/api/admin/storefront/cashout-profiles';
  static const _cashoutPath = '/api/admin/storefront/cashout';
  static const _compliancePath = '/api/admin/storefront/compliance';

  // ---------------------------------------------------------------- orders

  Future<StorefrontPage<Map<String, dynamic>>> fetchOrders({
    int page = 1,
    int limit = kStorefrontPageLimit,
    String status = 'all',
    String search = '',
  }) async {
    final json = await AdminApi.instance.getJson(
      _ordersPath,
      query: {
        'page': page,
        'limit': limit,
        'status': status,
        if (search.trim().isNotEmpty) 'search': search.trim(),
      },
    );
    return StorefrontPage(
      items: _listOf(json['orders']),
      page: asInt(json['page']) == 0 ? page : asInt(json['page']),
      totalPages: asInt(json['totalPages']) == 0 ? 1 : asInt(json['totalPages']),
      total: asInt(json['total']),
      pendingCount: asInt(json['pendingCount']),
    );
  }

  Future<Map<String, dynamic>> updateOrderStatus(String id, String status) async {
    final res = await AdminApi.instance.patch(_ordersPath, body: {'id': id, 'status': status});
    return asMap(res['order']) ?? const {};
  }

  Future<int> deleteCompletedOrders() async {
    final res = await AdminApi.instance.delete(_ordersPath);
    return asInt(res['deletedCount']);
  }

  // --------------------------------------------------------------- cashout

  Future<StorefrontPage<Map<String, dynamic>>> fetchCashoutProfiles({
    int page = 1,
    int limit = kStorefrontPageLimit,
    bool positiveOnly = true,
    bool requestedOnly = true,
    String search = '',
  }) async {
    final json = await AdminApi.instance.getJson(
      _cashoutProfilesPath,
      query: {
        'page': page,
        'limit': limit,
        'positiveOnly': positiveOnly ? 'true' : 'false',
        'requestedOnly': requestedOnly ? 'true' : 'false',
        if (search.trim().isNotEmpty) 'search': search.trim(),
      },
    );
    return StorefrontPage(
      items: _listOf(json['profiles']),
      page: asInt(json['page']) == 0 ? page : asInt(json['page']),
      totalPages: asInt(json['totalPages']) == 0 ? 1 : asInt(json['totalPages']),
      total: asInt(json['total']),
    );
  }

  Future<String> markCashoutPaid(String agentId) async {
    final res = await AdminApi.instance.post(_cashoutPath, body: {'agent_id': agentId});
    final message = (res['message'] ?? '').toString();
    return message.isEmpty ? 'Cashout recorded' : message;
  }

  Future<String> deleteCashoutEntry(String agentId, {required bool confirmClearBalance}) async {
    final res = await AdminApi.instance.delete(
      _cashoutPath,
      body: {'agent_id': agentId, 'confirm_clear_balance': confirmClearBalance},
    );
    final message = (res['message'] ?? '').toString();
    return message.isEmpty ? 'Cashout entry removed' : message;
  }

  // ------------------------------------------------------------ compliance

  Future<StorefrontPage<Map<String, dynamic>>> fetchCompliance({
    int page = 1,
    int limit = kStorefrontPageLimit,
    String status = 'all',
    String search = '',
  }) async {
    final json = await AdminApi.instance.getJson(
      _compliancePath,
      query: {
        'page': page,
        'limit': limit,
        'status': status,
        if (search.trim().isNotEmpty) 'search': search.trim(),
      },
    );
    return StorefrontPage(
      items: _listOf(json['submissions']),
      page: asInt(json['page']) == 0 ? page : asInt(json['page']),
      totalPages: asInt(json['totalPages']) == 0 ? 1 : asInt(json['totalPages']),
      total: asInt(json['total']),
    );
  }

  Future<void> updateComplianceStatus(String id, String status) async {
    await AdminApi.instance.patch(_compliancePath, body: {'id': id, 'status': status});
  }

  Future<void> deleteComplianceSubmission(String id) async {
    final res = await AdminApi.instance.delete(_compliancePath, query: {'id': id});
    if (res['success'] == false) {
      throw AdminApiException((res['error'] ?? 'Delete failed').toString());
    }
  }

  List<Map<String, dynamic>> _listOf(Object? value) {
    if (value is! List) return const [];
    return value.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
  }
}

import 'package:flutter/material.dart';

class OpsColors {
  static const brand = Color(0xFF0D9488);
  static const scaffold = Color(0xFF0B1220);
  static const card = Color(0xFF111827);
  static const cardAlt = Color(0xFF0F172A);
  static const border = Color(0xFF1F2937);

  static const success = Color(0xFF2DD4BF);
  static const warning = Color(0xFFFBBF24);
  static const danger = Color(0xFFF87171);
  static const info = Color(0xFF60A5FA);

  static Color statusColor(String? status) {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'active':
      case 'success':
      case 'paid':
      case 'delivered':
        return success;
      case 'pending':
      case 'processing':
      case 'ringing':
      case 'awaiting_payment':
        return warning;
      case 'failed':
      case 'rejected':
      case 'declined':
      case 'cancelled':
      case 'canceled':
        return danger;
      default:
        return info;
    }
  }
}

ThemeData buildOpsTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: OpsColors.brand,
    brightness: Brightness.dark,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: OpsColors.scaffold,
    fontFamily: 'Roboto',
    cardTheme: const CardThemeData(
      color: OpsColors.card,
      elevation: 0,
      margin: EdgeInsets.only(bottom: 10),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      isDense: true,
    ),
  );
}

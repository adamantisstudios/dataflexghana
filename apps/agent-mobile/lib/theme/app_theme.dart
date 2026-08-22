import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// DataFlex brand — forest green, warm sand, charcoal (not generic purple).
class DfColors {
  static const brand = Color(0xFF0E8F3D);
  static const brandLight = Color(0xFF35B24A);
  static const brandDark = Color(0xFF0A5C2A);
  static const sand = Color(0xFFF3EFE6);
  static const ink = Color(0xFF14201A);
  static const muted = Color(0xFF5C6B62);
  static const card = Color(0xFFFFFFF8);
  static const danger = Color(0xFFC62828);
}

ThemeData buildAgentTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: DfColors.brand,
      brightness: Brightness.light,
      primary: DfColors.brand,
      surface: DfColors.sand,
    ),
    scaffoldBackgroundColor: DfColors.sand,
  );

  return base.copyWith(
    textTheme: GoogleFonts.dmSansTextTheme(base.textTheme).apply(
      bodyColor: DfColors.ink,
      displayColor: DfColors.ink,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: DfColors.brandDark,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: DfColors.brand,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: DfColors.brand.withValues(alpha: 0.25)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: DfColors.brand, width: 2),
      ),
    ),
  );
}

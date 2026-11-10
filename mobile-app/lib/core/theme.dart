import 'package:flutter/material.dart';

/// The website's colours (app/globals.css), so the app looks like the same brand.
class AppColors {
  static const navy = Color(0xFF062B4E);
  static const dark = Color(0xFF03223F);
  static const ink = Color(0xFF092A49);
  static const gold = Color(0xFFC99432);
  static const goldSoft = Color(0xFFE4B653);
  static const champagne = Color(0xFFF4D889);
  static const cream = Color(0xFFF7F2E8);
  static const paper = Color(0xFFFCFBF8);
  static const mist = Color(0xFFF6F5F0);
  static const line = Color(0xFFDDD1B8);
  static const softLine = Color(0xFFEEE6D8);
  static const muted = Color(0xFF66717D);
  static const bronze = Color(0xFF976C20);
  static const deepGold = Color(0xFF9B712B);
  static const verified = Color(0xFF1D9BF0);
  static const whatsapp = Color(0xFF148744);
  static const green = Color(0xFF3D6B4A);
  static const greenBg = Color(0xFFEEF4EF);
  static const red = Color(0xFFA33A2C);
  static const redBg = Color(0xFFFBEEEC);
  static const goldBg = Color(0xFFFCF4E1);
  static const goldText = Color(0xFF806126);
  static const sand = Color(0xFFF8F4EB);
  static const sandLine = Color(0xFFDDCFB1);
}

// As on the website: headings, buttons and labels in Poppins, body text in Inter, and Urdu in
// Noto Nastaliq Urdu (Latin letters inside Urdu text fall back to Inter and Poppins).
const _fallback = ['NotoNastaliqUrdu', 'NotoNaskhArabic'];
const headingFont = 'Poppins';

ThemeData buildTheme({bool urdu = false}) {
  final body = urdu ? 'NotoNastaliqUrdu' : 'Inter';
  final heading = urdu ? 'NotoNastaliqUrdu' : headingFont;
  final fallback = urdu ? const ['Inter', 'Poppins'] : _fallback;
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: body,
    fontFamilyFallback: fallback,
    colorScheme: ColorScheme.fromSeed(seedColor: AppColors.navy, primary: AppColors.navy, secondary: AppColors.gold, surface: Colors.white),
    scaffoldBackgroundColor: AppColors.paper,
  );
  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(fontFamily: heading, fontFamilyFallback: fallback, fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
    ),
    textTheme: base.textTheme.apply(bodyColor: AppColors.navy, displayColor: AppColors.navy, fontFamily: body).copyWith(
      displayLarge: base.textTheme.displayLarge?.copyWith(fontFamily: heading, color: AppColors.navy),
      displayMedium: base.textTheme.displayMedium?.copyWith(fontFamily: heading, color: AppColors.navy),
      displaySmall: base.textTheme.displaySmall?.copyWith(fontFamily: heading, color: AppColors.navy),
      headlineLarge: base.textTheme.headlineLarge?.copyWith(fontFamily: heading, color: AppColors.navy),
      headlineMedium: base.textTheme.headlineMedium?.copyWith(fontFamily: heading, color: AppColors.navy),
      headlineSmall: base.textTheme.headlineSmall?.copyWith(fontFamily: heading, color: AppColors.navy),
      titleLarge: base.textTheme.titleLarge?.copyWith(fontFamily: heading, color: AppColors.navy),
      titleMedium: base.textTheme.titleMedium?.copyWith(fontFamily: heading, color: AppColors.navy),
      labelLarge: base.textTheme.labelLarge?.copyWith(fontFamily: heading),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFFAFBF9),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFDCE0DC))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFDCE0DC))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.gold, width: 1.6)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.red)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.red, width: 1.6)),
      hintStyle: const TextStyle(color: Color(0xFF9AA3AC), fontSize: 14),
      labelStyle: const TextStyle(color: AppColors.navy),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating, backgroundColor: AppColors.dark),
    dividerTheme: const DividerThemeData(color: AppColors.softLine, space: 1),
    checkboxTheme: CheckboxThemeData(fillColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? AppColors.navy : null)),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? Colors.white : null),
      trackColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? AppColors.navy : null),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.gold),
    bottomSheetTheme: const BottomSheetThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.white, showDragHandle: true),
    dialogTheme: const DialogThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.white),
  );
}

/// Urdu calligraphy lines, like the website's Urdu component.
const urduStyle = TextStyle(fontFamily: 'NotoNastaliqUrdu', height: 2.1, color: AppColors.deepGold);

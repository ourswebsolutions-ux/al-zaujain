import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import 'common.dart';

List<Json> rowsOf(Object? list) => ((list as List?) ?? const []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList();
String valueText(Object? value) => value == null ? '' : '$value';

/// The navy header with the emblem and the profile ID.
class BiodataHeader extends StatelessWidget {
  const BiodataHeader({super.key, required this.data});
  final Json data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: const BoxDecoration(color: AppColors.navy, border: Border(bottom: BorderSide(color: AppColors.gold, width: 3))),
      child: Column(children: [
        Row(children: [
          Container(decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Image.asset('assets/images/logo.png', width: 44, height: 44)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(tr('AL ZAUJAIN'), style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 1)),
              Text(tr('Marriage Bureau Multan Pakistan').toUpperCase(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.champagne, fontSize: 7.5, letterSpacing: 0.3)),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(tr('PROFILE ID'), style: const TextStyle(color: AppColors.champagne, fontSize: 9, letterSpacing: 2)),
            Text('${data['code']}', style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800)),
          ]),
        ]),
        if (data['headline'] != null && '${data['headline']}'.isNotEmpty) UrduLine('${data['headline']}', size: 21, color: AppColors.champagne, align: TextAlign.center),
      ]),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.letter, this.title, this.urdu);
  final String letter;
  final String title;
  final String urdu;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.only(bottom: 8),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.softLine))),
      child: Row(children: [
        Container(width: 30, height: 30, alignment: Alignment.center, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.gold)), child: Text(letter, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.deepGold))),
        const SizedBox(width: 10),
        Expanded(child: Tx(titleCase(tr(title)), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
        UrduLine(urdu, size: 12),
      ]),
    );
  }
}

class _Sub extends StatelessWidget {
  const _Sub(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(top: 22, bottom: 6), child: Text(tr(text).toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: app.t.isUrdu ? 0 : 1.6, color: AppColors.bronze)));
}

class _Rows extends StatelessWidget {
  const _Rows(this.rows);
  final List<Json> rows;
  @override
  Widget build(BuildContext context) => Column(children: [for (final row in rows) InfoRow('${row['label']}', valueText(row['value']))]);
}

/// Section A: the candidate's own details, always kept apart from the partner requirements.
class CandidateSection extends StatelessWidget {
  const CandidateSection({super.key, required this.data, this.after});
  final Json data;
  final Widget? after;

  @override
  Widget build(BuildContext context) {
    final highlights = rowsOf(data['highlights']).where((item) => item['value'] != null && '${item['value']}'.isNotEmpty).toList();
    final residence = rowsOf(data['residence']);
    final family = rowsOf(data['family']);
    final contact = rowsOf(data['contact']);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const _Heading('A', 'Candidate information', 'امیدوار کی معلومات'),
      LayoutBuilder(builder: (context, size) {
        final width = (size.maxWidth - 10) / 2;
        return Wrap(spacing: 10, runSpacing: 10, children: [
          for (final item in highlights)
            Container(
              width: width,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(color: const Color(0xFFFBF8F1), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFECE4D4))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(titleCase(tr('${item['label']}')), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                Tx(titleCase(tr(valueText(item['value']))), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: headFont, fontSize: 17, fontWeight: FontWeight.w800, height: 1.25)),
              ]),
            ),
        ]);
      }),
      const SizedBox(height: 10),
      _Rows(rowsOf(data['candidate'])),
      if (residence.isNotEmpty) ...[const _Sub('Residence'), _Rows(residence)],
      if (family.isNotEmpty) ...[const _Sub('Family details'), _Rows(family)],
      if (data['familyBackground'] != null) ...[const _Sub('Family background'), Tx('${data['familyBackground']}', style: const TextStyle(fontSize: 14, height: 1.7, color: Color(0xFF536471)))],
      if (data['about'] != null) ...[const _Sub('About the candidate'), Tx('${data['about']}', style: const TextStyle(fontSize: 14, height: 1.7, color: Color(0xFF536471)))],
      if (contact.isNotEmpty)
        Container(
          margin: const EdgeInsets.only(top: 22),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.lock_rounded, size: 15), const SizedBox(width: 6), Text(tr('Private contact details'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))]),
            const SizedBox(height: 4),
            for (final row in contact) _ContactRow(label: '${row['label']}', value: valueText(row['value'])),
          ]),
        ),
      ?after,
    ]);
  }
}

/// A contact detail the viewer may see, with a button to call, WhatsApp or email.
class _ContactRow extends StatelessWidget {
  const _ContactRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final digits = value.replaceAll(RegExp(r'[^0-9+]'), '');
    final intl = digits.startsWith('0') ? '92${digits.substring(1)}' : digits.replaceFirst('+', '');
    final (IconData icon, String url) = switch (label) {
      'WhatsApp' => (Icons.chat_rounded, 'https://wa.me/$intl'),
      'Email' => (Icons.email_rounded, 'mailto:$value'),
      _ => (Icons.call_rounded, 'tel:$digits'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE9E2D4)))),
      child: Row(children: [
        SizedBox(width: 90, child: Text(tr(label), style: const TextStyle(fontSize: 12.5, color: AppColors.muted))),
        Expanded(child: GestureDetector(onLongPress: () => copyText(context, value, 'Copied'), child: Text(value, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)))),
        IconButton(visualDensity: VisualDensity.compact, icon: Icon(icon, size: 19, color: AppColors.gold), onPressed: () => openLink(context, url)),
      ]),
    );
  }
}

/// Section B: the partner demand in the family's own words, then the structured preferences.
class PartnerSection extends StatelessWidget {
  const PartnerSection({super.key, required this.data});
  final Json data;

  @override
  Widget build(BuildContext context) {
    final partner = (data['partner'] as Map?)?.cast<String, dynamic>() ?? const {};
    final rows = rowsOf(partner['rows']);
    if (partner['demand'] == null && rows.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 24),
      decoration: const BoxDecoration(color: Color(0xFFFBF8F1), border: Border(top: BorderSide(color: AppColors.gold, width: 3))),
      child: Column(children: [
        Container(width: 30, height: 30, alignment: Alignment.center, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.gold)), child: Text(tr('B'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.deepGold))),
        const UrduLine('رشتے کی ضروریات', size: 21, color: AppColors.navy, align: TextAlign.center),
        Text(tr('Partner requirements').toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: app.t.isUrdu ? 0 : 2.4, color: AppColors.bronze)),
        const SizedBox(height: 14),
        if (partner['demand'] != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFECE4D4))),
            child: Tx('${partner['demand']}', style: TextStyle(fontSize: 15, height: _isUrdu('${partner['demand']}') ? 2.2 : 1.7, fontFamily: _isUrdu('${partner['demand']}') ? 'NotoNastaliqUrdu' : null)),
          ),
        if (rows.isNotEmpty) ...[const SizedBox(height: 10), _Rows(rows)],
      ]),
    );
  }

  static bool _isUrdu(String text) => RegExp(r'[؀-ۿ]').allMatches(text).length > text.length / 3;
}

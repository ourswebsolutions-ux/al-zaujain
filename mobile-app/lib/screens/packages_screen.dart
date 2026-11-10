import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/site.dart';
import 'auth_screens.dart';
import 'payments_screen.dart';

// The tier colours of the website's package cards, in order.
const tiers = <(List<Color>, Color)>[
  ([Color(0xFFA8834F), Color(0xFFC9A46C)], Color(0xFFA8834F)),
  ([Color(0xFF7D8A99), Color(0xFFAAB4BF)], Color(0xFF7D8A99)),
  ([Color(0xFFC99432), Color(0xFFE4B653)], Color(0xFFC99432)),
  ([AppColors.navy, Color(0xFF0D4A80)], Color(0xFF0D3D6B)),
  ([Color(0xFF1F8A6F), Color(0xFF3FB393)], Color(0xFF1F8A6F)),
  ([Color(0xFFA33A2C), Color(0xFFD4573F)], Color(0xFFB8452F)),
];

String planName(String category, int index) {
  final text = category.toLowerCase();
  if (RegExp('gulf|uae|saudi|qatar|oman').hasMatch(text)) return 'Gulf';
  if (RegExp('overseas|uk|usa|canada|abroad').hasMatch(text)) return 'Overseas';
  if (RegExp('doctor|engineer|govt|government|business|second marriage').hasMatch(text)) return 'Professional';
  return index == 0 ? 'Standard' : 'Plan ${index + 1}';
}

num amountOf(String fee) => num.tryParse((RegExp(r'\d[\d,]*(\.\d+)?').firstMatch(fee)?.group(0) ?? '0').replaceAll(',', '')) ?? 0;

String rupees(num value) => value.round().toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');

/// One package card as on the website: a coloured name tag, the price, facts with their Urdu lines,
/// and a full-width button.
class PackageCard extends StatelessWidget {
  const PackageCard({super.key, required this.tier, required this.name, required this.price, this.note = '', required this.rows, required this.cta, required this.onPressed, this.ribbon, this.was = 0, this.discount = 0, this.color});
  final int tier;
  final String name;
  final num price;
  final num was;
  final num discount;
  // The package's own colour from the admin panel (#b08d57); otherwise the tier colour.
  final String? color;
  final String note;
  final List<(String, String, String?)> rows;
  final String cta;
  final VoidCallback onPressed;
  final String? ribbon;

  @override
  Widget build(BuildContext context) {
    var (tag, colour) = tiers[tier % tiers.length];
    final custom = int.tryParse((color ?? '').replaceFirst('#', ''), radix: 16);
    if (custom != null && (color ?? '').length == 7) {
      colour = Color(0xFF000000 | custom);
      tag = [colour, Color.lerp(colour, Colors.black, 0.1)!];
    }
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: const [BoxShadow(color: Color(0x14062B4E), blurRadius: 30, offset: Offset(0, 10))]),
      clipBehavior: Clip.antiAlias,
      child: Stack(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 22),
          child: Column(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              decoration: BoxDecoration(gradient: LinearGradient(colors: tag), borderRadius: BorderRadius.circular(30), boxShadow: const [BoxShadow(color: Color(0x26000000), blurRadius: 14, offset: Offset(0, 6))]),
              child: Text(tr(name).toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 2)),
            ),
            SizedBox(height: was > 0 ? 18 : 22),
            if (was > 0)
              Row(mainAxisAlignment: MainAxisAlignment.center, textDirection: TextDirection.ltr, children: [
                Text('${tr('Was')} ', style: const TextStyle(fontSize: 15, color: Color(0xFF777777))),
                Text('Rs. ${rupees(was)}', style: const TextStyle(fontSize: 15, color: Color(0xFF777777), decoration: TextDecoration.lineThrough, decorationColor: Color(0xFFC0392B), decorationThickness: 2)),
              ]),
            Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, textDirection: TextDirection.ltr, children: [
              const Text('Rs. ', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Color(0xFF222222))),
              Text(rupees(price), style: TextStyle(fontFamily: 'Poppins', fontSize: 38, fontWeight: FontWeight.w800, color: colour)),
            ]),
            if (note.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(titleCase(tr(note)), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            ],
            const SizedBox(height: 18),
            const Divider(height: 1, color: Color(0xFFEEE6DA)),
            for (final (label, value, ur) in rows)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1EBE1)))),
                child: Column(children: [
                  Text(titleCase(tr(label)), textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: Color(0xFF444444))),
                  const SizedBox(height: 2),
                  Text(titleCase(tr(value)), textAlign: TextAlign.center, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: Color(0xFF1F2A37), height: 1.35)),
                  if (ur != null && !app.t.isUrdu) Padding(padding: const EdgeInsets.only(top: 2), child: Text(ur, textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 14, color: const Color(0xFF333333), height: 2))),
                ]),
              ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: onPressed,
                style: FilledButton.styleFrom(backgroundColor: colour, foregroundColor: Colors.white, elevation: 4, shadowColor: const Color(0x40000000), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: Text(tr(cta), style: TextStyle(fontFamily: headFont, fontSize: 15.5, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
        if (discount > 0 || ribbon != null)
          Positioned(
            right: -48,
            top: 22,
            child: Transform.rotate(
              angle: math.pi / 4,
              child: Container(width: 170, padding: const EdgeInsets.symmetric(vertical: 5), color: colour, alignment: Alignment.center, child: Text(discount > 0 ? '$discount% ${tr('OFF')}' : tr(ribbon!), textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white))),
            ),
          ),
      ]),
    );
  }
}

/// The website's Packages page: the consultancy packages (from the official fee structure) and the
/// premium profile credit packages, each as cards to swipe through.
class PackagesScreen extends StatefulWidget {
  const PackagesScreen({super.key});

  @override
  State<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends State<PackagesScreen> {
  final scroll = ScrollController();
  final webKey = GlobalKey();
  final consultancyKey = GlobalKey();

  void _buy(Json pack) => push(context, app.signedIn ? PaymentSubmitScreen(pack: pack) : LoginScreen(then: PaymentSubmitScreen(pack: pack)));

  @override
  Widget build(BuildContext context) {
    final fees = ((app.config['fees'] as Map?) ?? const {}).cast<String, dynamic>();
    final registration = ((fees['registration'] as List?) ?? const []).cast<Map>();
    final finalization = ((fees['finalization'] as List?) ?? const []).cast<Map>();
    final packages = app.packages;
    final local = packages.where((pack) => pack['kind'] != 'boost' && pack['scope'] != 'foreign').toList();
    final foreign = packages.where((pack) => pack['kind'] != 'boost' && pack['scope'] == 'foreign').toList();
    final boosts = packages.where((pack) => pack['kind'] == 'boost').toList();
    final urdu = !app.t.isUrdu;
    // A section title like the website's: ❝ Title ❞, the Urdu line, then a note in both languages.
    Widget heading(String title, String ur, String text, [String? textUr]) => Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 22),
          child: Column(children: [
            Text('❝ ${tr(title)} ❞', textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 22, fontWeight: FontWeight.w700, color: const Color(0xFF111111))),
            if (urdu) ...[const SizedBox(height: 10), Text('❞ $ur ❝', textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 20, color: const Color(0xFF111111)))],
            if (text.isNotEmpty) ...[const SizedBox(height: 8), Text(tr(text), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 14.5, fontWeight: FontWeight.w600, color: const Color(0xFF9B712B), height: 1.5))],
            if (urdu && textUr != null) ...[const SizedBox(height: 6), Text(textUr, textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 15, color: const Color(0xFF9B712B), height: 2.1))],
          ]),
        );
    List<(String, String, String?)> connectRows(Json pack) => [
          ('Profile Connect', '${pack['credits']}', 'پروفائل کنیکٹ: ${pack['credits']}'),
          ('Duration', 'Unlimited', 'مدت: لا محدود'),
          ('Audio Call', pack['audioCall'] == true ? 'Available' : 'Not Available', 'آڈیو کال: ${pack['audioCall'] == true ? 'دستیاب ہے' : 'دستیاب نہیں'}'),
          ('Video Call', pack['videoCall'] == true ? 'Available' : 'Not Available', 'ویڈیو کال: ${pack['videoCall'] == true ? 'دستیاب ہے' : 'دستیاب نہیں'}'),
        ];
    // Stacked one under another, as on the website's phone view.
    Widget connectCards(List<Json> list, int offset) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(children: [
            for (var i = 0; i < list.length; i++)
              Padding(padding: const EdgeInsets.only(bottom: 28), child: PackageCard(
                color: list[i]['color'] as String?,
                tier: i + offset,
                name: '${list[i]['name']}',
                price: (list[i]['price'] as num?) ?? 0,
                was: (list[i]['wasPrice'] as num?) ?? 0,
                discount: (list[i]['discount'] as num?) ?? 0,
                ribbon: list[i]['featured'] == true ? 'Featured' : null,
                rows: connectRows(list[i]),
                cta: 'Register Now',
                onPressed: () => _buy(list[i]),
              )),
          ]),
        );
    return Scaffold(
      backgroundColor: const Color(0xFFF8F1E6),
      appBar: AppBar(title: Text(titleCase(tr('Packages')))),
      body: ListView(controller: scroll, padding: const EdgeInsets.only(bottom: 40), children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 36, 16, 10),
          child: Column(children: [
            SiteLabel(tr('Welcome to {company}', {'company': 'Al Zaujain Marriage Bureau'})),
            const SizedBox(height: 6),
            GradientText(tr('Rishta Packages'), size: 34),
            if (urdu) Text('رشتہ پیکجز', textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 26)),
            const SizedBox(height: 8),
            const Ornament(),
            const SizedBox(height: 18),
            for (final line in [
              'Al Zaujain offers mainly two types of rishta services: Web & App Based Packages and Personalized Matchmaking.',
              'In Web & App Based Packages you use our matrimonial website and app to find proposals yourself, on a self-service basis.',
              'In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements.',
            ])
              Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(tr(line), style: const TextStyle(fontSize: 15, height: 1.7, color: Color(0xFF2F3B4A)))),
            const SizedBox(height: 14),
            Text(tr('Which Type of Rishta Service Do You Need?'), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 19, fontWeight: FontWeight.w700, color: const Color(0xFF111111))),
            if (urdu) Text('آپ کو کس قسم کی رشتہ سروس کی ضرورت ہے؟', textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 17, color: const Color(0xFF333333))),
            const SizedBox(height: 16),
            Row(children: [
              if (local.isNotEmpty || foreign.isNotEmpty) ...[
                Expanded(child: _TypeButton(label: 'Web & App Based Packages', urdu: 'ویب اور ایپ پر مبنی پیکجز', colors: const [AppColors.navy, Color(0xFF0D3D6B)], onTap: () => Scrollable.ensureVisible(webKey.currentContext!, duration: const Duration(milliseconds: 500)))),
                const SizedBox(width: 12),
              ],
              Expanded(child: _TypeButton(label: 'Personalized Matchmaking', urdu: 'ذاتی نوعیت کی میچ میکنگ', colors: const [Color(0xFF9B712B), AppColors.gold], onTap: () => Scrollable.ensureVisible(consultancyKey.currentContext!, duration: const Duration(milliseconds: 500)))),
            ]),
          ]),
        ),
        SizedBox(key: webKey, height: 30),
        if (local.isNotEmpty) ...[
          heading('Local Rishta Packages (Pakistan)', 'لوکل رشتہ پیکجز (پاکستان)', 'With these packages you can connect with all members in this category. Overseas (Foreign) profiles are not included: to contact overseas members, please buy the International package.', 'ان پیکجز کے ذریعے آپ اس کیٹیگری کے تمام ممبرز سے رابطہ کر سکتے ہیں۔ بیرونِ ملک (فارن) پروفائلز اس میں شامل نہیں؛ ان سے رابطے کے لیے انٹرنیشنل پیکج خریدیں۔'),
          connectCards(local, 0),
          const SizedBox(height: 40),
        ],
        if (foreign.isNotEmpty) ...[
          heading('International Rishta Packages (Foreign)', 'انٹرنیشنل رشتہ پیکجز (بیرونِ ملک)', 'Connect with overseas members as well as members in Pakistan.'),
          connectCards(foreign, 3),
          const SizedBox(height: 40),
        ],
        if (local.isNotEmpty || foreign.isNotEmpty) ...[
          heading('Web & App Based Packages Comparison', 'ویب اور ایپ پر مبنی پیکجز کا موازنہ', ''),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: _Comparison(groups: [if (local.isNotEmpty) ('Local Rishta Packages (Pakistan)', local), if (foreign.isNotEmpty) ('International Rishta Packages (Foreign)', foreign)])),
          const SizedBox(height: 40),
        ],
        if (boosts.isNotEmpty) ...[
          heading('Boost my Proposal', 'اپنی پروپوزل بوسٹ کریں', 'To boost your proposal, your profile information must be complete and your profile photo must be visible.', 'پروپوزل بوسٹ کرنے کے لیے ضروری ہے کہ آپ کی پروفائل کی معلومات مکمل ہوں اور آپ کی پروفائل تصویر نظر آ رہی ہو۔'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(children: [
              for (var i = 0; i < boosts.length; i++)
                Padding(padding: const EdgeInsets.only(bottom: 28), child: PackageCard(
                  color: boosts[i]['color'] as String?,
                  tier: i + 2,
                  name: '${boosts[i]['name']}',
                  price: (boosts[i]['price'] as num?) ?? 0,
                  was: (boosts[i]['wasPrice'] as num?) ?? 0,
                  discount: (boosts[i]['discount'] as num?) ?? 0,
                  rows: [
                    ('Duration', '${boosts[i]['days']} Days', 'مدت: ${boosts[i]['days']} دن'),
                    ('Proposal Status', boosts[i]['superBoost'] == true ? 'Super Boosted' : 'Boosted', 'پروپوزل کی حیثیت: ${boosts[i]['superBoost'] == true ? 'سپر بوسٹ شدہ' : 'بوسٹ شدہ'}'),
                    ('Visibility', '${boosts[i]['description'] ?? ''}'.isNotEmpty ? '${boosts[i]['description']}' : 'Top of search results', 'بوسٹڈ پروپوزلز تلاش کے نتائج میں سب سے اوپر دکھائے جاتے ہیں۔'),
                  ],
                  cta: 'Register Now',
                  onPressed: () => _buy(boosts[i]),
                )),
            ]),
          ),
          const SizedBox(height: 40),
        ],
        SizedBox(key: consultancyKey, height: 0),
        heading('Personalized Matchmaking', 'ذاتی نوعیت کی میچ میکنگ', 'In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements. The registration fee is paid when you register and is non-refundable; the finalization fee is paid only after the rishta is finalized.'),
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 16),
          child: SwipeCards(height: 620, children: [
            for (var i = 0; i < registration.length; i++)
              PackageCard(
                tier: i,
                name: planName('${registration[i]['category']}', i),
                price: amountOf('${registration[i]['fee']}'),
                note: 'Registration Fee · Non-Refundable',
                ribbon: planName('${registration[i]['category']}', i) == 'Overseas' ? 'International' : null,
                rows: [
                  ('For', '${registration[i]['category']}', null),
                  ('Registration Fee', '${registration[i]['fee']}', 'رجسٹریشن فیس: ${registration[i]['fee']}'),
                  if (i < finalization.length) ('Finalization Fee', '${finalization[i]['fee']}', 'رشتہ طے ہونے کی فیس: ${finalization[i]['fee']}'),
                  ('Finalization Fee Paid', 'After The Rishta Is Finalized', 'رشتہ طے ہونے کے بعد'),
                ],
                cta: 'Register Now',
                onPressed: () => openProfileForm(context),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 30, 16, 0),
          child: Notice(tr('Web & App Based Packages are separate from the Personalized Matchmaking fees. Our team will tell you which package fits your family; contact us on WhatsApp any time.')),
        ),
      ]),
    );
  }
}

/// The website's comparison table: each package's connects, duration and prices before and after discount.
class _Comparison extends StatelessWidget {
  const _Comparison({required this.groups});
  final List<(String, List<Json>)> groups;

  @override
  Widget build(BuildContext context) {
    const head = TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Colors.white);
    Widget cell(String text, {TextStyle? style, TextDecoration? decoration}) => Padding(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 11), child: Text(text, textAlign: TextAlign.center, style: (style ?? const TextStyle(fontSize: 13, color: Color(0xFF1F2A37))).copyWith(decoration: decoration)));
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x14062B4E), blurRadius: 30, offset: Offset(0, 10))]),
      clipBehavior: Clip.antiAlias,
      child: Table(
        columnWidths: const {0: FlexColumnWidth(1.25), 1: FlexColumnWidth(1), 2: FlexColumnWidth(1.15), 3: FlexColumnWidth(1.15)},
        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
        children: [
          TableRow(decoration: const BoxDecoration(color: AppColors.navy), children: [for (final title in ['Packages', 'Profile Connect', 'Before Discount', 'After Discount']) cell(titleCase(tr(title)), style: head)]),
          for (final (title, list) in groups) ...[
            TableRow(decoration: const BoxDecoration(color: Color(0xFFF6EFE2)), children: [cell(tr(title), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF9B712B))), const SizedBox(), const SizedBox(), const SizedBox()]),
            for (final pack in list)
              TableRow(decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1EBE1)))), children: [
                cell(titleCase(tr('${pack['name']}')), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.navy)),
                cell('${pack['credits']}'),
                cell(((pack['wasPrice'] as num?) ?? 0) > 0 ? 'Rs. ${rupees(pack['wasPrice'] as num)}' : '—', style: const TextStyle(fontSize: 13, color: Color(0xFF777777)), decoration: ((pack['wasPrice'] as num?) ?? 0) > 0 ? TextDecoration.lineThrough : null),
                cell('Rs. ${rupees((pack['price'] as num?) ?? 0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1F8A4C))),
              ]),
          ],
        ],
      ),
    );
  }
}

class _TypeButton extends StatelessWidget {
  const _TypeButton({required this.label, required this.urdu, required this.colors, required this.onTap});
  final String label;
  final String urdu;
  final List<Color> colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        borderRadius: BorderRadius.circular(6),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          decoration: BoxDecoration(gradient: LinearGradient(colors: colors), border: Border.all(color: AppColors.gold)),
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
              child: Column(children: [
                Text(titleCase(tr(label)), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 13.5, fontWeight: FontWeight.w600, color: Colors.white)),
                if (!app.t.isUrdu) Text(urdu, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 13, color: AppColors.champagne, height: 2)),
              ]),
            ),
          ),
        ),
      );
}

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/site.dart';
import 'auth_screens.dart';
import 'credits_screen.dart';

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
  const PackageCard({super.key, required this.tier, required this.name, required this.price, required this.note, required this.rows, required this.cta, required this.onPressed, this.ribbon});
  final int tier;
  final String name;
  final num price;
  final String note;
  final List<(String, String, String?)> rows;
  final String cta;
  final VoidCallback onPressed;
  final String? ribbon;

  @override
  Widget build(BuildContext context) {
    final (tag, colour) = tiers[tier % tiers.length];
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
              child: Text(titleCase(tr(name)), style: TextStyle(fontFamily: headFont, fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1)),
            ),
            const SizedBox(height: 22),
            Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, textDirection: TextDirection.ltr, children: [
              const Text('Rs. ', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Color(0xFF222222))),
              Text(rupees(price), style: TextStyle(fontFamily: 'Poppins', fontSize: 38, fontWeight: FontWeight.w800, color: colour)),
            ]),
            const SizedBox(height: 6),
            Text(titleCase(tr(note)), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
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
        if (ribbon != null)
          Positioned(
            right: -48,
            top: 22,
            child: Transform.rotate(
              angle: math.pi / 4,
              child: Container(width: 170, padding: const EdgeInsets.symmetric(vertical: 4), color: colour, alignment: Alignment.center, child: Text(tr(ribbon!), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white))),
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
  final creditsKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    final fees = ((app.config['fees'] as Map?) ?? const {}).cast<String, dynamic>();
    final registration = ((fees['registration'] as List?) ?? const []).cast<Map>();
    final finalization = ((fees['finalization'] as List?) ?? const []).cast<Map>();
    final packages = app.packages;
    final cost = app.unlockCost;
    Widget heading(String title, String urdu, String text) => Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 22),
          child: Column(children: [
            Text('“\u00A0${tr(title)}\u00A0”', textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 23, fontWeight: FontWeight.w700, color: const Color(0xFF111111))),
            if (!app.t.isUrdu) const SizedBox(height: 10),
            if (!app.t.isUrdu) Text(urdu, textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 21, color: const Color(0xFF111111))),
            const SizedBox(height: 8),
            Text(tr(text), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF9B712B), height: 1.5)),
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
            if (!app.t.isUrdu) Text('رشتہ پیکجز', textDirection: TextDirection.rtl, style: urduStyle.copyWith(fontSize: 26)),
            const SizedBox(height: 8),
            const Ornament(),
            const SizedBox(height: 18),
            Text(tr('Al Zaujain offers two kinds of packages. Consultancy packages, where our consultants personally find and present suitable proposals for your family, and Premium Profile Credits, to open premium profiles on this website yourself.'), style: const TextStyle(fontSize: 15, height: 1.7, color: Color(0xFF2F3B4A))),
            if (packages.isNotEmpty) ...[
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: _TypeButton(label: 'Consultancy Packages', urdu: 'کنسلٹنسی پیکجز', colors: const [AppColors.navy, Color(0xFF0D3D6B)], onTap: () {})),
                const SizedBox(width: 12),
                Expanded(child: _TypeButton(label: 'Premium Profile Credits', urdu: 'پریمیم پروفائل کریڈٹس', colors: const [Color(0xFF9B712B), AppColors.gold], onTap: () => Scrollable.ensureVisible(creditsKey.currentContext!, duration: const Duration(milliseconds: 500)))),
              ]),
            ],
          ]),
        ),
        const SizedBox(height: 30),
        heading('Rishta Consultancy Packages', 'رشتہ کنسلٹنسی پیکجز', 'The registration fee is paid when you register and is non-refundable. The finalization fee is paid only after the rishta is finalized.'),
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
        if (packages.isNotEmpty) ...[
          const SizedBox(height: 40),
          Container(key: creditsKey, child: heading('Premium Profile Credits', 'پریمیم پروفائل کریڈٹس', 'Each credit opens one Premium profile’s photo and contact details. An opened profile stays open for you.')),
          Padding(
            padding: const EdgeInsetsDirectional.only(start: 16),
            child: SwipeCards(height: 560, children: [
              for (var i = 0; i < packages.length; i++)
                PackageCard(
                  tier: i,
                  name: '${packages[i]['name']}',
                  price: (packages[i]['price'] as num?) ?? 0,
                  note: 'One-Time Payment',
                  ribbon: packages[i]['featured'] == true ? 'Featured' : null,
                  rows: [
                    ('Premium Credits', '${packages[i]['credits']}', 'پریمیم کریڈٹس: ${packages[i]['credits']}'),
                    ('Premium Profiles You Can Open', '${((packages[i]['credits'] as num?) ?? 0) ~/ cost}', 'کھلنے والی پریمیم پروفائلز: ${((packages[i]['credits'] as num?) ?? 0) ~/ cost}'),
                    ('Opened Profiles', 'Stay Open For You', 'کھلی پروفائل ہمیشہ کھلی رہتی ہے'),
                    if ('${packages[i]['description'] ?? ''}'.isNotEmpty) ('Details', '${packages[i]['description']}', null),
                  ],
                  cta: 'Buy Now',
                  onPressed: () => push(context, app.signedIn ? const BuyCreditsScreen() : const LoginScreen(then: BuyCreditsScreen())),
                ),
            ]),
          ),
        ],
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 30, 16, 0),
          child: Notice(tr('Consultancy fees are separate from Premium Profile Credits. Our team will tell you which package fits your family; contact us on WhatsApp any time.')),
        ),
      ]),
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

/// One official fee plan as the website's fee page shows it: the plan name, the registration fee as
/// the price, and the finalization fee (paid only after the rishta) beneath it. The Overseas plan is navy.
class FeePlanCard extends StatelessWidget {
  const FeePlanCard({super.key, required this.index, required this.category, required this.registration, this.finalization});
  final int index;
  final String category;
  final String registration;
  final String? finalization;

  @override
  Widget build(BuildContext context) {
    final name = planName(category, index);
    final featured = name == 'Overseas';
    final icon = switch (name) { 'Gulf' => Icons.mosque_rounded, 'Overseas' => Icons.public_rounded, 'Professional' => Icons.work_rounded, _ => Icons.groups_rounded };
    final muted = featured ? const Color(0xFFC7D3DD) : AppColors.muted;
    final strong = featured ? Colors.white : AppColors.navy;
    final accent = featured ? AppColors.champagne : const Color(0xFFA17A33);
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 26, 22, 22),
      decoration: BoxDecoration(
        gradient: featured ? const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF0A3A66), AppColors.navy, AppColors.dark]) : null,
        color: featured ? null : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: featured ? AppColors.gold : const Color(0xFFE8DFCC)),
        boxShadow: [BoxShadow(color: featured ? const Color(0x40062B4E) : const Color(0x10062B4E), blurRadius: 32, offset: const Offset(0, 12))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 32, height: 32, decoration: BoxDecoration(color: featured ? Colors.white12 : const Color(0xFFF6EFE1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 16, color: accent)),
          const SizedBox(width: 8),
          Expanded(child: Text(tr('Plan {number}', {'number': '${index + 1}'.padLeft(2, '0')}), style: TextStyle(fontFamily: headFont, fontSize: 12.5, fontWeight: FontWeight.w600, color: accent))),
          if (featured) Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFF4D889), AppColors.gold]), borderRadius: BorderRadius.circular(10)), child: Text(tr('International'), style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.dark))),
        ]),
        const SizedBox(height: 10),
        Text(tr('$name Plan'), style: TextStyle(fontFamily: headFont, fontSize: 21, fontWeight: FontWeight.w700, color: strong)),
        const SizedBox(height: 8),
        Text(tr(category), style: TextStyle(fontSize: 14, height: 1.55, color: muted)),
        Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: Divider(height: 1, color: featured ? Colors.white24 : const Color(0xFFEFE7D6))),
        Text(titleCase(tr('Registration fee')), style: TextStyle(fontFamily: headFont, fontSize: 13, fontWeight: FontWeight.w600, color: muted)),
        Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, textDirection: TextDirection.ltr, children: [
          Text('Rs ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: accent)),
          Text(rupees(amountOf(registration)), style: TextStyle(fontFamily: 'Poppins', fontSize: 36, fontWeight: FontWeight.w800, color: strong)),
        ]),
        Text(tr('One-time, non-refundable'), style: TextStyle(fontSize: 12.5, color: muted)),
        if (finalization != null) ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: featured ? Colors.white.withValues(alpha: 0.07) : const Color(0xFFFAF6EE), borderRadius: BorderRadius.circular(16), border: Border.all(color: featured ? Colors.white12 : const Color(0xFFEFE5D0))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(titleCase(tr('Finalization fee')), style: TextStyle(fontFamily: headFont, fontSize: 13, fontWeight: FontWeight.w600, color: muted)),
              Text('Rs ${rupees(amountOf(finalization!))}', textDirection: TextDirection.ltr, style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: accent)),
              const SizedBox(height: 4),
              Row(children: [const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF2F9A55)), const SizedBox(width: 6), Expanded(child: Text(tr('Paid only after the rishta is finalized'), style: TextStyle(fontSize: 12, color: muted)))]),
            ]),
          ),
        ],
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: FilledButton.icon(
            onPressed: () => openProfileForm(context),
            style: FilledButton.styleFrom(backgroundColor: featured ? AppColors.gold : AppColors.navy, foregroundColor: featured ? AppColors.dark : Colors.white, shape: const StadiumBorder()),
            icon: const Icon(Icons.arrow_forward_rounded, size: 16),
            label: Text(tr('Register Now'), style: TextStyle(fontFamily: headFont, fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
    );
  }
}

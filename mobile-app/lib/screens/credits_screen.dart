import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';
import 'packages_screen.dart';
import 'payments_screen.dart';
import 'profile_screen.dart';

/// Premium Credits: the same balance, unlocks and history as the website's dashboard page.
class CreditsScreen extends StatelessWidget {
  const CreditsScreen({super.key});

  static const kinds = {'purchase': 'Credits purchased', 'unlock': 'Profile unlocked', 'adjustment': 'Adjusted by Al Zaujain', 'refund': 'Credits refunded'};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Premium Credits'))),
      body: Loader(
        load: () async {
          final data = await app.api.get('credits');
          app.refreshAccount();
          return data;
        },
        builder: (context, data, reload) {
          final cost = (data['unlockCost'] as num?)?.toInt() ?? 1;
          final unlocks = rowsOf(data['unlocks']);
          final purchases = rowsOf(data['purchases']);
          final history = rowsOf(data['transactions']);
          final pending = data['pending'] as Map?;
          Future<void> buy() async {
            await push(context, const BuyCreditsScreen());
            reload();
          }

          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            PageIntro('Premium Credits', text: tr('Credits unlock Premium profiles: their real photo and contact details. Each unlock uses {cost} of your credits and stays open for you. Free profiles never use credits.', {'cost': cost})),
            if (pending != null) ...[
              Notice(tr('Your payment for {name} is waiting for review. The credits are added as soon as our team approves it.', {'name': pending['package']}), warning: true),
              const SizedBox(height: 12),
            ],
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.7,
              children: [
                _Tile(Icons.toll_rounded, 'Available credits', '${data['balance']}', highlight: true),
                _Tile(Icons.shopping_cart_rounded, 'Total purchased', '${data['purchased']}'),
                _Tile(Icons.lock_open_rounded, 'Total used', '${data['used']}'),
                _Tile(Icons.verified_rounded, 'Unlocked profiles', '${unlocks.length}'),
              ],
            ),
            const SizedBox(height: 12),
            AppButton('Buy Premium Credits', tone: Tone.gold, icon: Icons.shopping_cart_rounded, expand: true, onPressed: buy),
            const SizedBox(height: 16),
            Panel(
              title: 'Unlocked profiles',
              child: unlocks.isEmpty
                  ? Padding(padding: const EdgeInsets.all(8), child: Tx(tr('Profiles you unlock appear here, so you can open them again at no cost.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)))
                  : Column(children: [
                      for (final row in unlocks)
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: SizedBox(width: 46, height: 46, child: NetImage(row['photo'] as String?, radius: 23)),
                          title: Text('${row['name']} · ${row['code']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${tr('${row['city'] ?? ''}')} · ${formatDate(row['at'])}'),
                          trailing: const Icon(Icons.chevron_right_rounded),
                          onTap: () => push(context, ProfileScreen(code: '${row['code']}')),
                        ),
                    ]),
            ),
            const SizedBox(height: 14),
            Panel(
              title: 'Purchase history',
              child: purchases.isEmpty
                  ? Padding(padding: const EdgeInsets.all(8), child: Tx(tr('Buy a package to start unlocking Premium profiles.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)))
                  : Column(children: [
                      for (final row in purchases)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${row['package']} · ${tr('{count} credits', {'count': row['credits']})}', style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text('Rs ${row['amount']} · ${formatDate(row['createdAt'])}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            ])),
                            paymentStatusPill('${row['status']}'),
                          ]),
                        ),
                    ]),
            ),
            const SizedBox(height: 14),
            Panel(
              title: 'Credit history',
              child: history.isEmpty
                  ? Padding(padding: const EdgeInsets.all(8), child: Text(tr('No credit activity yet.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)))
                  : Column(children: [
                      for (final row in history)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${tr(kinds['${row['kind']}'] ?? '${row['kind']}')}${row['kind'] == 'unlock' && row['reference'] != null ? ' · ${row['reference']}' : ''}', style: const TextStyle(fontWeight: FontWeight.w500)),
                              Text(formatDate(row['createdAt'], time: true), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            ])),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text((row['amount'] as num) > 0 ? '+${row['amount']}' : '${row['amount']}', textDirection: TextDirection.ltr, style: TextStyle(fontWeight: FontWeight.w700, color: (row['amount'] as num) > 0 ? const Color(0xFF1F8A3A) : AppColors.red)),
                              Text(tr('Balance {count}', {'count': row['balance']}), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                            ]),
                          ]),
                        ),
                    ]),
            ),
          ]);
        },
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile(this.icon, this.label, this.value, {this.highlight = false});
  final IconData icon;
  final String label;
  final String value;
  final bool highlight;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: highlight ? AppColors.navy : Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE7E9EE))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [Icon(icon, size: 16, color: highlight ? AppColors.goldSoft : const Color(0xFFA67B2E)), const SizedBox(width: 6), Expanded(child: Text(tr(label), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: highlight ? const Color(0xFFC7D3DD) : AppColors.muted)))]),
          Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: highlight ? Colors.white : AppColors.navy)),
        ]),
      );
}

/// Buy Premium Credits: the packages the bureau has set, then the payment form for the chosen one.
class BuyCreditsScreen extends StatelessWidget {
  const BuyCreditsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Buy Premium Credits'))),
      body: Loader(
        load: () => app.api.get('credits'),
        builder: (context, data, reload) {
          final cost = (data['unlockCost'] as num?)?.toInt() ?? 1;
          final packages = rowsOf(data['packages']);
          final intro = PageIntro('Buy Premium Credits', text: tr('Choose a package. Unlocking one Premium profile uses {cost} of your credits. Credits are added after our team confirms your payment.', {'cost': cost}));
          if (data['pending'] != null) return Column(children: [intro, const EmptyState(icon: Icons.schedule_rounded, title: 'Your credit purchase is being reviewed', text: 'Our team will check it shortly. The credits are added as soon as it is approved.')]);
          if (packages.isEmpty) return Column(children: [intro, const EmptyState(icon: Icons.toll_rounded, title: 'No packages are available yet', text: 'Please check back soon, or contact our team on WhatsApp.')]);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            intro,
            for (final pack in packages) _PackageCard(pack: pack, cost: cost, onChoose: () async {
              final done = await push<bool>(context, PaymentSubmitScreen(pack: pack));
              if (done == true && context.mounted) Navigator.pop(context);
            }),
          ]);
        },
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.pack, required this.cost, required this.onChoose});
  final Json pack;
  final int cost;
  final VoidCallback onChoose;

  @override
  Widget build(BuildContext context) {
    final featured = pack['featured'] == true;
    final credits = (pack['credits'] as num).toInt();
    final profiles = credits ~/ cost;
    final boost = pack['kind'] == 'boost';
    final was = (pack['wasPrice'] as num?) ?? 0;
    final kind = boost ? (pack['superBoost'] == true ? 'Super Boost' : 'Boost my Proposal') : pack['scope'] == 'foreign' ? 'International (Foreign + Pakistan)' : 'Local (Pakistan)';
    final lines = boost
        ? [tr('Your proposal at the top of search results'), tr('Needs a complete profile with a visible photo')]
        : [tr('Unlock {count} Premium profiles', {'count': profiles}), tr('Real photos and contact details'), tr('Unlocked profiles stay open'), if (pack['scope'] == 'foreign') tr('Overseas profiles included')];
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: featured ? AppColors.gold : const Color(0xFFE7E9EE), width: featured ? 2 : 1), boxShadow: const [BoxShadow(color: Color(0x0F03223F), blurRadius: 20, offset: Offset(0, 8))]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('${pack['name']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
          if (featured) Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)]), borderRadius: BorderRadius.circular(20)), child: Text(tr('Most popular'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.dark))),
        ]),
        Text(titleCase(tr(kind)), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.deepGold, letterSpacing: 0.4)),
        const SizedBox(height: 8),
        Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(boost ? '${pack['days']}' : '$credits', style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w800, height: 1)),
          const SizedBox(width: 6),
          Text(tr(boost ? 'days' : credits == 1 ? 'profile' : 'profiles'), style: const TextStyle(fontSize: 14, color: AppColors.muted, fontWeight: FontWeight.w600)),
          const Spacer(),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            if (was > 0) Text('Rs ${money(was)}', style: const TextStyle(fontSize: 13, color: AppColors.muted, decoration: TextDecoration.lineThrough)),
            Text('Rs ${money(pack['price'])}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.deepGold)),
          ]),
        ]),
        if (pack['description'] != null && '${pack['description']}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Tx('${pack['description']}', style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5))),
        const SizedBox(height: 10),
        for (final line in lines)
          Padding(padding: const EdgeInsets.symmetric(vertical: 2), child: Row(children: [const Icon(Icons.check_rounded, size: 16, color: Color(0xFF1F8A3A)), const SizedBox(width: 6), Expanded(child: Text(line, style: const TextStyle(fontSize: 13)))])),
        const SizedBox(height: 12),
        AppButton(tr('Choose {name}', {'name': pack['name']}), tone: featured ? Tone.gold : Tone.navy, expand: true, onPressed: onChoose),
      ]),
    );
  }
}

/// The official consultancy fee structure. Separate from premium credit packages.
class FeesScreen extends StatelessWidget {
  const FeesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final fees = ((app.config['fees'] as Map?) ?? const {}).cast<String, dynamic>();
    final whatsapp = '${fees['whatsapp'] ?? ''}';
    final digits = whatsapp.replaceAll(RegExp(r'\D'), '');
    return Scaffold(
      appBar: AppBar(title: Text(tr('Fee structure'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Panel(
          color: AppColors.sand,
          borderColor: AppColors.sandLine,
          child: Row(children: [
            Image.asset('assets/images/logo.png', width: 56, height: 56),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${fees['company'] ?? ''}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              Text([fees['registered'], fees['city']].where((part) => part != null && '$part'.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.goldText)),
              Text([fees['ntn'], fees['ceo']].where((part) => part != null && '$part'.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
            ])),
          ]),
        ),
        const SizedBox(height: 16),
        for (var i = 0; i < rowsOf(fees['registration']).length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: FeePlanCard(
              index: i,
              category: '${rowsOf(fees['registration'])[i]['category']}',
              registration: '${rowsOf(fees['registration'])[i]['fee']}',
              finalization: i < rowsOf(fees['finalization']).length ? '${rowsOf(fees['finalization'])[i]['fee']}' : null,
            ),
          ),
        Panel(
          title: 'Please note',
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            for (final line in ['Advance registration fees are non-refundable.', 'Rishta finalization fees are payable after the rishta is finalized.', 'These consultancy fees are separate from Premium Profile Packages, which are bought on the website to unlock premium profiles.'])
              Padding(padding: const EdgeInsets.only(bottom: 8), child: Tx('• ${tr(line)}', style: const TextStyle(fontSize: 13.5, height: 1.5, color: Color(0xFF536471)))),
          ]),
        ),
        const SizedBox(height: 14),
        Panel(title: 'International services', child: Tx(tr('${fees['countries'] ?? ''}'), style: const TextStyle(fontSize: 13.5, height: 1.6, color: Color(0xFF536471)))),
        const SizedBox(height: 14),
        Wrap(spacing: 10, runSpacing: 10, children: [
          if (digits.isNotEmpty) AppButton(whatsapp, tone: Tone.whatsapp, icon: Icons.chat_rounded, onPressed: () => openLink(context, 'https://wa.me/${digits.startsWith('0') ? '92${digits.substring(1)}' : digits}')),
          if ('${fees['email'] ?? ''}'.isNotEmpty) AppButton('${fees['email']}', tone: Tone.outline, icon: Icons.email_rounded, onPressed: () => openLink(context, 'mailto:${fees['email']}')),
        ]),
      ]),
    );
  }
}

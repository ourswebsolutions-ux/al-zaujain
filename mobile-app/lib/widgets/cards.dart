import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../screens/auth_screens.dart';
import '../screens/credits_screen.dart';
import '../screens/payments_screen.dart';
import '../screens/profile_form_screen.dart';
import '../screens/profile_screen.dart';
import 'common.dart';

/// Unpaid visitors see blurred photos when the bureau turns that restriction on (the server blurs them).
bool get photosLocked {
  final restrictions = (app.config['restrictions'] as List?) ?? const [];
  final photo = restrictions.cast<Map>().where((item) => item['key'] == 'photo');
  final on = photo.isNotEmpty && photo.first['on'] == true;
  final staff = app.signedIn && !app.isMember;
  return on && !app.paid && !staff;
}

/// The website's "Unlock Full Profile Access" popup.
Future<void> showUnlockSheet(BuildContext context) {
  const benefits = ['View original profile photographs.', 'Access contact information.', 'Connect through WhatsApp.', 'Send direct messages.', 'Explore complete profile details.'];
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    builder: (sheet) => SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(24, 26, 24, 22),
          decoration: const BoxDecoration(color: AppColors.navy, border: Border(bottom: BorderSide(color: AppColors.gold, width: 3))),
          child: Column(children: [
            Container(width: 54, height: 54, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.goldSoft.withValues(alpha: 0.6))), child: const Icon(Icons.lock_rounded, color: AppColors.goldSoft)),
            const SizedBox(height: 12),
            Text(tr('Unlock Full Profile Access'), textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Tx(tr('Get access to complete matrimonial profiles and connect with potential matches.'), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 13, height: 1.6)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(22, 20, 22, 18),
          child: Column(children: [
            for (final benefit in benefits)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(children: [
                  Container(width: 20, height: 20, decoration: const BoxDecoration(color: Color(0x2BE4B653), shape: BoxShape.circle), child: const Icon(Icons.check_rounded, size: 13, color: Color(0xFF946C13))),
                  const SizedBox(width: 10),
                  Expanded(child: Tx(tr(benefit), style: const TextStyle(fontSize: 14))),
                ]),
              ),
            const SizedBox(height: 16),
            AppButton('Buy Premium Credits', tone: Tone.gold, expand: true, onPressed: () {
              Navigator.pop(sheet);
              push(context, app.signedIn ? const BuyCreditsScreen() : const LoginScreen(then: BuyCreditsScreen()));
            }),
            Padding(padding: const EdgeInsets.only(top: 6), child: Tx(tr('Each credit unlocks one Premium profile, and it stays open for you.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.muted))),
            const SizedBox(height: 8),
            AppButton('View Payment Options', tone: Tone.outline, expand: true, onPressed: () {
              Navigator.pop(sheet);
              push(context, app.signedIn ? const PaymentSubmitScreen() : const LoginScreen(then: PaymentSubmitScreen()));
            }),
            TextButton(onPressed: () => Navigator.pop(sheet), child: Text(tr('Continue Browsing'), style: const TextStyle(color: AppColors.muted))),
          ]),
        ),
      ]),
    ),
  );
}

/// In the app, browsing is open to everyone, but full proposals and profile submission are for members.
Future<void> requireAccount(BuildContext context, Widget then, {String title = 'Create a free account to continue'}) async {
  if (app.signedIn) {
    await push(context, then);
    return;
  }
  await showModalBottomSheet(
    context: context,
    builder: (sheet) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 0, 22, 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 56, height: 56, decoration: const BoxDecoration(color: AppColors.cream, shape: BoxShape.circle), child: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.gold)),
          const SizedBox(height: 12),
          Tx(tr(title), textAlign: TextAlign.center, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Tx(tr('Browsing is open to everyone. Full proposals, submitting a profile, saving and chat are for registered members. It is free and takes a minute.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13.5, color: AppColors.muted, height: 1.5)),
          const SizedBox(height: 18),
          AppButton('Create an account', tone: Tone.gold, expand: true, onPressed: () {
            Navigator.pop(sheet);
            push(context, RegisterScreen(then: then));
          }),
          const SizedBox(height: 10),
          AppButton('Sign in', tone: Tone.outline, expand: true, onPressed: () {
            Navigator.pop(sheet);
            push(context, LoginScreen(then: then));
          }),
        ]),
      ),
    ),
  );
}

Future<void> openProposal(BuildContext context, String code) => requireAccount(context, ProfileScreen(code: code), title: 'Create a free account to view this proposal');

Future<void> openProfileForm(BuildContext context) => requireAccount(context, const ProfileFormScreen(), title: 'Create a free account to submit a profile');

class SaveHeart extends StatefulWidget {
  const SaveHeart({super.key, required this.code});
  final String code;

  @override
  State<SaveHeart> createState() => _SaveHeartState();
}

class _SaveHeartState extends State<SaveHeart> {
  bool busy = false;

  @override
  Widget build(BuildContext context) {
    final saved = app.saved.contains(widget.code);
    return Material(
      color: Colors.white.withValues(alpha: 0.94),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: busy
            ? null
            : () async {
                setState(() => busy = true);
                try {
                  await app.toggleSaved(widget.code, !saved);
                  if (context.mounted) showMessage(context, saved ? 'Removed from your saved profiles.' : 'Saved to your shortlist.');
                } on ApiException catch (error) {
                  if (context.mounted) showMessage(context, error.message, error: true);
                } finally {
                  if (mounted) setState(() => busy = false);
                }
              },
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(saved ? Icons.favorite_rounded : Icons.favorite_border_rounded, size: 20, color: saved ? const Color(0xFFC0392B) : AppColors.navy, semanticLabel: tr(saved ? 'Remove from saved' : 'Save profile')),
        ),
      ),
    );
  }
}

String placeOf(Json card) => [card['city'], card['country']].where((part) => part != null && '$part'.isNotEmpty).map((part) => tr('$part')).join(', ');

/// The corner ribbon from the profile-ui reference: Free, Premium (unlocks with credits) or Exclusive.
class _Ribbon extends StatelessWidget {
  const _Ribbon({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    final (label, background, fold, foreground) = switch (type) {
      'public' => ('Free', const Color(0xFF1F8A3A), const Color(0xFF145C27), Colors.white),
      'premium' => ('Exclusive', AppColors.navy, AppColors.dark, AppColors.champagne),
      _ => ('Premium', AppColors.gold, const Color(0xFF8C6420), AppColors.dark),
    };
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return Column(crossAxisAlignment: CrossAxisAlignment.end, mainAxisSize: MainAxisSize.min, children: [
      ClipPath(
        clipper: _RibbonClipper(rtl),
        child: Container(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 4, 12, 4),
          decoration: BoxDecoration(color: background, gradient: type == 'paid' ? const LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)]) : null),
          child: Text(tr(label).toUpperCase(), style: TextStyle(color: foreground, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: app.t.isUrdu ? 0 : 0.6)),
        ),
      ),
      CustomPaint(size: const Size(6, 6), painter: _FoldPainter(fold, rtl)),
    ]);
  }
}

class _RibbonClipper extends CustomClipper<Path> {
  _RibbonClipper(this.rtl);
  final bool rtl;
  @override
  Path getClip(Size size) => rtl
      ? (Path()..moveTo(0, 0)..lineTo(size.width - 9, 0)..lineTo(size.width, size.height / 2)..lineTo(size.width - 9, size.height)..lineTo(0, size.height)..close())
      : (Path()..moveTo(9, 0)..lineTo(size.width, 0)..lineTo(size.width, size.height)..lineTo(9, size.height)..lineTo(0, size.height / 2)..close());
  @override
  bool shouldReclip(_RibbonClipper oldClipper) => oldClipper.rtl != rtl;
}

class _FoldPainter extends CustomPainter {
  _FoldPainter(this.color, this.rtl);
  final Color color;
  final bool rtl;
  @override
  void paint(Canvas canvas, Size size) {
    final path = rtl ? (Path()..moveTo(0, 0)..lineTo(size.width, 0)..lineTo(size.width, size.height)..close()) : (Path()..moveTo(0, 0)..lineTo(size.width, 0)..lineTo(0, size.height)..close());
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_FoldPainter oldDelegate) => oldDelegate.color != color || oldDelegate.rtl != rtl;
}

/// The oval portrait with a round status button over its edge, as in the reference.
class _OvalPhoto extends StatelessWidget {
  const _OvalPhoto({required this.card, required this.width, required this.height});
  final Json card;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final type = '${card['type'] ?? 'paid'}';
    final unlocked = type == 'paid' && app.unlocked.contains('${card['code']}');
    final photo = card['photo'] as String?;
    final blurred = photo != null && photosLocked && type != 'public' && !unlocked;
    final (IconData icon, Color background, Color foreground, String hint) = type == 'premium'
        ? (Icons.workspace_premium_rounded, AppColors.navy, AppColors.champagne, 'Exclusive proposal, introduced by our consultants')
        : type == 'paid' && !unlocked
            ? (Icons.lock_rounded, AppColors.gold, AppColors.dark, 'Premium profile: unlock with credits')
            : (Icons.lock_open_rounded, const Color(0xFF1F8A3A), Colors.white, unlocked ? 'Unlocked for you' : 'Free profile');
    final button = width * 0.3;
    return SizedBox(
      width: width,
      height: height,
      child: Stack(clipBehavior: Clip.none, children: [
        Container(
          width: width,
          height: height,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.all(Radius.elliptical(width / 2, height / 2)), border: Border.all(color: const Color(0xFFB18433), width: 3), boxShadow: const [BoxShadow(color: Color(0x2603223F), blurRadius: 20, offset: Offset(0, 8))]),
          child: ClipOval(
            child: Stack(fit: StackFit.expand, children: [
              NetImage(photo == null ? null : '/media/photos/$photo'),
              if (blurred)
                GestureDetector(
                  onTap: () => showUnlockSheet(context),
                  child: Container(color: const Color(0x3303223F), alignment: Alignment.center, child: Container(width: 38, height: 38, decoration: const BoxDecoration(color: Color(0x9903223F), shape: BoxShape.circle), child: const Icon(Icons.visibility_off_rounded, color: Colors.white, size: 18))),
                ),
            ]),
          ),
        ),
        PositionedDirectional(
          start: 0,
          bottom: height * 0.04,
          child: Tooltip(
            message: tr(hint),
            child: Container(
              width: button.clamp(34, 44),
              height: button.clamp(34, 44),
              decoration: BoxDecoration(
                color: background,
                gradient: type == 'paid' && !unlocked ? const LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)]) : null,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
                boxShadow: const [BoxShadow(color: Color(0x4003223F), blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Icon(icon, size: 16, color: foreground, semanticLabel: tr(hint)),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 1.5),
        child: Row(children: [
          Icon(icon, size: 14, color: const Color(0xFFA9B2BD)),
          const SizedBox(width: 7),
          Expanded(child: Tx(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, color: Color(0xFF47566A)))),
        ]),
      );
}

/// The candidate card, following the supplied profile-ui reference and the website's card: an oval
/// portrait, a corner ribbon, the name, facts with icons, "View Profile" and, for locked Premium
/// profiles, "Unlock". Wide and sideways on phones; upright with a larger portrait in narrow grid cells.
class ProposalCard extends StatelessWidget {
  const ProposalCard({super.key, required this.card, this.tag, this.compact = false});
  final Json card;
  final String? tag;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final code = '${card['code']}';
    final type = '${card['type'] ?? 'paid'}';
    final locked = type == 'paid' && !app.unlocked.contains(code);
    final score = card['score'];
    final label = tag ?? (score != null ? tr('{score}% match', {'score': score}) : null);
    final cost = app.unlockCost;
    return LayoutBuilder(builder: (context, size) {
      final upright = compact || size.maxWidth < 330;
      final photoWidth = upright ? (size.maxWidth * 0.62).clamp(96.0, 172.0) : 116.0;
      final details = Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
        if (label != null)
          Container(margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3), decoration: BoxDecoration(color: AppColors.goldBg, borderRadius: BorderRadius.circular(20)), child: Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.goldText))),
        Row(children: [
          Flexible(child: Text('${card['name']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: compact ? 17 : 21, fontWeight: FontWeight.w800, color: AppColors.navy))),
          if (card['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 5), child: VerifiedBadge(size: 17)),
        ]),
        Text(code, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted, letterSpacing: 0.5)),
        const SizedBox(height: 6),
        _Fact(Icons.cake_rounded, '${tr('{count} Years', {'count': card['age'] ?? ''})}${card['maritalStatus'] == null || compact ? '' : ' · ${tr('${card['maritalStatus']}')}'}'),
        _Fact(Icons.work_rounded, card['profession'] == null ? '—' : tr('${card['profession']}')),
        if (!compact && card['education'] != null) _Fact(Icons.school_rounded, tr('${card['education']}')),
        _Fact(Icons.location_on_rounded, placeOf(card).isEmpty ? '—' : placeOf(card)),
      ]);
      final buttons = Row(children: [
        Expanded(
          child: FilledButton(
            onPressed: () => openProposal(context, code),
            style: FilledButton.styleFrom(backgroundColor: AppColors.navy, foregroundColor: Colors.white, minimumSize: const Size(0, 44), padding: const EdgeInsets.symmetric(horizontal: 10), shape: const StadiumBorder()),
            child: Text(tr('View Profile'), maxLines: 1, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
        ),
        if (locked && !compact) ...[
          const SizedBox(width: 8),
          Expanded(
            child: DecoratedBox(
              decoration: const ShapeDecoration(shape: StadiumBorder(), gradient: LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)])),
              child: TextButton.icon(
                onPressed: () => openProposal(context, code),
                style: TextButton.styleFrom(foregroundColor: AppColors.dark, minimumSize: const Size(0, 44), padding: const EdgeInsets.symmetric(horizontal: 8), shape: const StadiumBorder()),
                icon: const Icon(Icons.lock_rounded, size: 14),
                label: Text(cost == 1 ? tr('Unlock · 1 credit') : tr('Unlock · {cost} credits', {'cost': cost}), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
        if (app.isMember) ...[const SizedBox(width: 6), SaveHeart(code: code)],
      ]);
      return Material(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22), side: const BorderSide(color: Color(0xFFE9E2D4))),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => openProposal(context, code),
          child: Container(
            decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.white, Color(0xFFFBF8F1)])),
            child: Stack(children: [
              Padding(
                padding: EdgeInsets.all(compact ? 12 : 16),
                child: upright
                    ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        const SizedBox(height: 8),
                        Center(child: _OvalPhoto(card: card, width: photoWidth, height: photoWidth * 1.27)),
                        const SizedBox(height: 12),
                        details,
                        const SizedBox(height: 12),
                        buttons,
                      ])
                    : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _OvalPhoto(card: card, width: photoWidth, height: photoWidth * 1.27),
                          const SizedBox(width: 14),
                          Expanded(child: Padding(padding: const EdgeInsetsDirectional.only(top: 22), child: details)),
                        ]),
                        const SizedBox(height: 14),
                        buttons,
                      ]),
              ),
              PositionedDirectional(end: -2, top: 14, child: _Ribbon(type: type)),
            ]),
          ),
        ),
      );
    });
  }
}

/// The same card in its smaller form, for dashboard rows and two-column grids.
class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.card, this.width});
  final Json card;
  final double? width;

  @override
  Widget build(BuildContext context) => SizedBox(width: width, child: ProposalCard(card: card, compact: true));
}

/// Cards in one column on phones and two or three on tablets.
class CardGrid extends StatelessWidget {
  const CardGrid({super.key, required this.cards, this.compact = false});
  final List<Json> cards;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, size) {
      // Phones: one wide card per row, like the reference. Tablets: two or three, larger screens four.
      final columns = compact ? (size.maxWidth > 700 ? 4 : 2) : (size.maxWidth > 1100 ? 4 : size.maxWidth > 760 ? 3 : size.maxWidth > 520 ? 2 : 1);
      final gap = compact ? 12.0 : 16.0;
      final width = (size.maxWidth - gap * (columns - 1)) / columns;
      return Wrap(spacing: gap, runSpacing: gap, children: [
        for (final card in cards) SizedBox(width: width, child: compact ? MatchCard(card: card) : ProposalCard(card: card, tag: card['tag'] == null ? null : tr('${card['tag']}'))),
      ]);
    });
  }
}

/// The home screen card from the app design: a round portrait in a gold ring, the heart, the
/// name in serif, age and city, and two small facts. Premium profiles keep their lock badge.
class HomeProfileCard extends StatelessWidget {
  const HomeProfileCard({super.key, required this.card});
  final Json card;

  @override
  Widget build(BuildContext context) {
    final code = '${card['code']}';
    final type = '${card['type'] ?? 'paid'}';
    final unlocked = type == 'paid' && app.unlocked.contains(code);
    final photo = card['photo'] as String?;
    final blurred = photo != null && photosLocked && type != 'public' && !unlocked;
    final facts = <(IconData, String)>[
      if (card['education'] != null) (Icons.school_rounded, tr('${card['education']}')),
      if (card['profession'] != null) (Icons.work_rounded, tr('${card['profession']}')),
    ];
    final (IconData badgeIcon, Color badgeColor, String hint) = type == 'premium'
        ? (Icons.workspace_premium_rounded, AppColors.navy, 'Exclusive proposal, introduced by our consultants')
        : type == 'paid' && !unlocked
            ? (Icons.lock_rounded, AppColors.gold, 'Premium profile: unlock with credits')
            : (Icons.lock_open_rounded, const Color(0xFF1F8A3A), unlocked ? 'Unlocked for you' : 'Free profile');
    return Material(
      color: const Color(0xFFFFFDF8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: Color(0xFFEDE3CF))),
      elevation: 0,
      shadowColor: const Color(0x2203223F),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openProposal(context, code),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Stack(clipBehavior: Clip.none, children: [
              Center(
                child: LayoutBuilder(builder: (context, size) {
                  final d = (size.maxWidth * 0.68).clamp(80.0, 140.0);
                  return Container(
                    width: d,
                    height: d,
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFE9C77B), Color(0xFFB8893A)]),
                      boxShadow: const [BoxShadow(color: Color(0x2603223F), blurRadius: 14, offset: Offset(0, 6))],
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: Color(0xFFF5EBDA), shape: BoxShape.circle),
                      child: ClipOval(
                        child: Stack(fit: StackFit.expand, children: [
                          photo == null
                              ? Container(color: const Color(0xFFF1E6D2), padding: const EdgeInsets.all(18), child: Opacity(opacity: 0.55, child: Image.asset('assets/images/logo.png')))
                              : NetImage('/media/photos/$photo'),
                          if (blurred) Container(color: const Color(0x3303223F), alignment: Alignment.center, child: const Icon(Icons.visibility_off_rounded, color: Colors.white, size: 22)),
                        ]),
                      ),
                    ),
                  );
                }),
              ),
              PositionedDirectional(
                end: -4,
                top: -4,
                child: app.isMember
                    ? SaveHeart(code: code)
                    : Material(
                        color: Colors.white,
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => requireAccount(context, ProfileScreen(code: code), title: 'Create a free account to save proposals'),
                          child: Padding(padding: const EdgeInsets.all(7), child: Icon(Icons.favorite_border_rounded, size: 19, color: const Color(0xFFC0392B), semanticLabel: tr('Save profile'))),
                        ),
                      ),
              ),
              PositionedDirectional(
                start: 2,
                bottom: 0,
                child: Tooltip(
                  message: tr(hint),
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(color: badgeColor, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2.5)),
                    child: Icon(badgeIcon, size: 13, color: type == 'paid' && !unlocked ? AppColors.dark : Colors.white, semanticLabel: tr(hint)),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Flexible(child: Text('${card['name']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Playfair', fontSize: 17, color: AppColors.navy, fontVariations: [FontVariation('wght', 600)]))),
              if (card['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 4), child: VerifiedBadge(size: 15)),
            ]),
            const SizedBox(height: 2),
            Text(
              [if (card['age'] != null) '${card['age']}', if (card['city'] != null) tr('${card['city']}')].join('  •  '),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
            ),
            if (facts.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Row(children: [
                for (var i = 0; i < facts.length; i++) ...[
                  if (i > 0) const SizedBox(width: 8),
                  Flexible(
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(facts[i].$1, size: 13, color: AppColors.navy),
                      const SizedBox(width: 4),
                      Flexible(child: Text(facts[i].$2, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Color(0xFF47566A)))),
                    ]),
                  ),
                ],
              ]),
            ],
          ]),
        ),
      ),
    );
  }
}

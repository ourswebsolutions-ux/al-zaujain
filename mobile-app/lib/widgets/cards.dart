import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../screens/auth_screens.dart';
import '../screens/payments_screen.dart';
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
            AppButton('View Payment Options', tone: Tone.gold, expand: true, onPressed: () {
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

class _Cover extends StatelessWidget {
  const _Cover({required this.card, this.tag, this.showSave = false});
  final Json card;
  final String? tag;
  final bool showSave;

  @override
  Widget build(BuildContext context) {
    final photo = card['photo'] as String?;
    final locked = photo != null && photosLocked && card['type'] != 'public';
    return AspectRatio(
      aspectRatio: 1,
      child: Stack(fit: StackFit.expand, children: [
        NetImage(photo == null ? null : '/media/photos/$photo', radius: 16),
        if (locked)
          GestureDetector(
            onTap: () => showUnlockSheet(context),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                color: const Color(0x3303223F),
                alignment: Alignment.center,
                child: Container(width: 42, height: 42, decoration: const BoxDecoration(color: Color(0x9903223F), shape: BoxShape.circle), child: const Icon(Icons.visibility_off_rounded, color: Colors.white, size: 19)),
              ),
            ),
          ),
        if (tag != null)
          Positioned(left: 10, top: 10, child: Container(padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6), decoration: BoxDecoration(color: const Color(0xEDFCFBF8), borderRadius: BorderRadius.circular(20)), child: Text(tag!, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700)))),
        if (showSave) Positioned(right: 8, top: 8, child: SaveHeart(code: '${card['code']}')),
        Positioned(left: 10, bottom: 10, child: TypeBadge(card['type'] as String?)),
        Positioned(right: 10, bottom: 10, child: Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5), decoration: BoxDecoration(color: const Color(0xD9062B4E), borderRadius: BorderRadius.circular(6)), child: Text('${card['code']}', style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w700)))),
      ]),
    );
  }
}

String placeOf(Json card) => [card['city'], card['country']].where((part) => part != null && '$part'.isNotEmpty).map((part) => tr('$part')).join(', ');

/// The website's proposal card: photo, name and age, place, education, profession and marital status.
class ProposalCard extends StatelessWidget {
  const ProposalCard({super.key, required this.card, this.tag});
  final Json card;
  final String? tag;

  @override
  Widget build(BuildContext context) {
    final score = card['score'];
    final label = tag ?? (score != null ? tr('{score}% match', {'score': score}) : (card['verified'] == true ? tr('Verified') : null));
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22), side: const BorderSide(color: AppColors.line)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => push(context, ProfileScreen(code: '${card['code']}')),
        child: Padding(
          padding: const EdgeInsets.all(9),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _Cover(card: card, tag: label, showSave: app.isMember),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 14, 8, 6),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(child: Text.rich(TextSpan(children: [
                    TextSpan(text: '${card['name']} ', style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                    TextSpan(text: '· ${card['age'] ?? ''}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.muted)),
                  ]), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  if (card['verified'] == true) const Padding(padding: EdgeInsets.only(left: 6), child: VerifiedBadge(size: 18)),
                ]),
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFFB18433)),
                  const SizedBox(width: 4),
                  Expanded(child: Tx(placeOf(card), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppColors.muted))),
                ]),
                const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1)),
                _meta('Education', card['education']),
                _meta('Profession', card['profession']),
                _meta('Marital status', card['maritalStatus']),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(color: AppColors.cream, borderRadius: BorderRadius.circular(12)),
                  child: Row(children: [Expanded(child: Text(tr('View proposal'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700))), const Icon(Icons.arrow_forward_rounded, size: 17)]),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _meta(String label, Object? value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr(label).toUpperCase(), style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, letterSpacing: app.t.isUrdu ? 0 : 0.7, color: AppColors.muted)),
          Tx(value == null || '$value'.isEmpty ? '—' : tr('$value'), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ]),
      );
}

/// The dashboard's smaller match card, for horizontal rows and two-column grids.
class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.card, this.width});
  final Json card;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE7E9EE))),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => push(context, ProfileScreen(code: '${card['code']}')),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(padding: const EdgeInsets.all(6), child: _Cover(card: card, tag: card['score'] != null ? tr('{score}% match', {'score': card['score']}) : null, showSave: app.isMember)),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 4, 10, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Flexible(child: Text('${card['name']}, ${card['age'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600))),
                  if (card['verified'] == true) const Padding(padding: EdgeInsets.only(left: 4), child: VerifiedBadge(size: 14)),
                ]),
                Tx(placeOf(card), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                Tx([card['education'], card['profession'] == null ? null : tr('${card['profession']}')].where((part) => part != null && '$part'.isNotEmpty).join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// Cards in one column on phones and two or three on tablets.
class CardGrid extends StatelessWidget {
  const CardGrid({super.key, required this.cards, this.compact = false});
  final List<Json> cards;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, size) {
      final columns = compact ? (size.maxWidth > 700 ? 4 : 2) : (size.maxWidth > 900 ? 3 : size.maxWidth > 560 ? 2 : 1);
      final gap = compact ? 12.0 : 16.0;
      final width = (size.maxWidth - gap * (columns - 1)) / columns;
      return Wrap(spacing: gap, runSpacing: gap, children: [
        for (final card in cards) SizedBox(width: width, child: compact ? MatchCard(card: card) : ProposalCard(card: card)),
      ]);
    });
  }
}

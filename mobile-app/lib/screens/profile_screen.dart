import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/export.dart';
import 'auth_screens.dart';
import 'chat_screen.dart';
import 'credits_screen.dart';

/// One proposal, as on the website's /profile/<code> page. The server decides what this viewer may see.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        centerTitle: true,
        title: const Text('AL ZAUJAIN', style: TextStyle(fontFamily: 'Cinzel', fontSize: 19, letterSpacing: 2, color: Colors.white, fontVariations: [FontVariation('wght', 600)])),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            onSelected: (value) => copyText(context, code, 'Profile ID copied.'),
            itemBuilder: (_) => [PopupMenuItem(value: 'copy', child: Text(tr('Copy profile ID {code}', {'code': code})))],
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: app,
        builder: (context, _) => Loader(
          key: ValueKey('${app.api.token}'),
          padding: EdgeInsets.zero,
          load: () => app.api.get('profiles/$code'),
          builder: (context, data, reload) => _ProfileBody(data: data, reload: reload),
        ),
      ),
    );
  }
}

class _ProfileBody extends StatefulWidget {
  const _ProfileBody({required this.data, required this.reload});
  final Json data;
  final Future<void> Function() reload;

  @override
  State<_ProfileBody> createState() => _ProfileBodyState();
}

class _ProfileBodyState extends State<_ProfileBody> {
  bool chatting = false;

  Json get data => widget.data;
  Json get profile => (data['profile'] as Map).cast<String, dynamic>();
  Json get biodata => (data['biodata'] as Map).cast<String, dynamic>();
  Json get locks => ((data['locks'] as Map?) ?? const {}).cast<String, dynamic>();

  Future<void> _chat() async {
    if (!app.signedIn) {
      await push(context, LoginScreen(then: ProfileScreen(code: '${profile['code']}'), replace: true));
      return;
    }
    setState(() => chatting = true);
    try {
      final result = await app.api.post('chat/start', {'code': profile['code']});
      if (mounted) push(context, ChatScreen(id: (result['conversationId'] as num).toInt()));
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.upgrade) {
        showUnlockSheet(context);
      } else {
        showMessage(context, error.message, error: true);
      }
    } finally {
      if (mounted) setState(() => chatting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = ((data['photos'] as List?) ?? []).cast<Map>();
    final locked = data['photoLocked'] == true;
    final premium = locks['premium'] == true;
    final lockedContact = ((data['lockedContact'] as List?) ?? []).map((item) => '$item').toList();
    final compatible = rowsOf(data['compatible']);
    final similar = rowsOf(data['similar']);
    final place = [profile['city'], profile['country']].where((part) => part != null).map((part) => tr('$part')).join(', ');
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (data['live'] != true) Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 0), child: const Notice('This profile is not public yet. Only you and the Al Zaujain team can see this page.', warning: true)),
      Padding(
        padding: const EdgeInsets.all(14),
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.line), boxShadow: const [BoxShadow(color: Color(0x1403223F), blurRadius: 40, offset: Offset(0, 18))]),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            _Hero(
              photos: photos,
              locked: locked,
              type: '${profile['type']}',
              photoPublic: profile['photoPublic'] != false,
              biodata: biodata,
              code: '${profile['code']}',
              canSave: data['canSave'] == true,
            ),
            Container(
              color: AppColors.paper,
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                if (data['yourScore'] != null) Padding(padding: const EdgeInsets.only(top: 8), child: Pill(tr('{score}% match with your profile', {'score': data['yourScore']}))),
                const SizedBox(height: 14),
                if (!premium)
                  locks['whatsapp'] == true
                      ? AppButton('Contact Al Zaujain', icon: Icons.chat_rounded, trailing: Icons.lock_rounded, expand: true, onPressed: () => showUnlockSheet(context))
                      : AppButton('Contact Al Zaujain', icon: Icons.chat_rounded, expand: true, onPressed: () => openLink(context, '${data['whatsapp']}')),
                if (data['canChat'] == true) ...[
                  const SizedBox(height: 10),
                  AppButton(app.signedIn ? 'Chat now' : 'Sign in to chat', tone: Tone.gold, icon: Icons.forum_rounded, expand: true, busy: chatting, onPressed: _chat),
                ],
                if (data['credits'] != null) ...[const SizedBox(height: 12), _UnlockPanel(code: '${profile['code']}', credits: (data['credits'] as Map).cast<String, dynamic>(), onUnlocked: widget.reload)],
              ]),
            ),
            BiodataHeader(data: biodata),
            Padding(
              padding: const EdgeInsets.all(16),
              child: CandidateSection(
                data: biodata,
                after: premium ? _PremiumContact(href: '${data['premiumWhatsapp']}') : (lockedContact.isEmpty ? null : _LockedContact(labels: lockedContact)),
              ),
            ),
            PartnerSection(data: biodata),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.softLine))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('Share this biodata with your family.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
                const SizedBox(height: 10),
                BiodataActions(data: biodata, subtitle: [place], photo: locked || photos.isEmpty ? null : '${photos.first['file']}'),
              ]),
            ),
          ]),
        ),
      ),
      if (compatible.isNotEmpty) _Row(tag: 'SUGGESTED FOR THIS PROFILE', title: 'Compatible proposals', cards: compatible),
      if (similar.isNotEmpty) _Row(tag: 'YOU MAY ALSO LIKE', title: 'Similar proposals', cards: similar),
      const SizedBox(height: 30),
    ]);
  }
}

/// Premium profiles: spend credits once and the photo and contact details stay open for this member.
/// The server checks the balance and charges once; the app only shows the result.
class _UnlockPanel extends StatefulWidget {
  const _UnlockPanel({required this.code, required this.credits, required this.onUnlocked});
  final String code;
  final Json credits;
  final Future<void> Function() onUnlocked;
  @override
  State<_UnlockPanel> createState() => _UnlockPanelState();
}

class _UnlockPanelState extends State<_UnlockPanel> {
  bool busy = false;
  String? error;
  bool insufficient = false;

  Future<void> _unlock() async {
    setState(() { busy = true; error = null; });
    try {
      final result = await app.api.post('profiles/${widget.code}/unlock');
      await app.refreshAccount();
      if (mounted) showMessage(context, tr('${result['message']}', {'charged': result['charged'], 'balance': result['balance']}));
      await widget.onUnlocked();
    } on ApiException catch (caught) {
      setState(() { error = caught.message; insufficient = caught.body['insufficient'] == true; });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final credits = widget.credits;
    final cost = (credits['cost'] as num?)?.toInt() ?? 1;
    if (credits['unlocked'] == true) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.greenBg, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 18), const SizedBox(width: 8), Expanded(child: Tx(tr('Unlocked with your credits. The photo and contact details are open for you.'), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.green)))]),
      );
    }
    if (credits['canUnlock'] != true) return const SizedBox.shrink();
    final balance = (credits['balance'] as num?)?.toInt();
    final short = app.signedIn && balance != null && balance < cost;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFFCF4E1), Color(0xFFF8F4EB)]), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.sandLine)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [const Icon(Icons.workspace_premium_rounded, color: AppColors.gold, size: 18), const SizedBox(width: 6), Text(tr('Premium profile'), style: const TextStyle(fontWeight: FontWeight.w700))]),
        const SizedBox(height: 4),
        Tx(cost == 1 ? tr('Unlock the real photo and contact details for 1 credit. Once unlocked, it stays open for you.') : tr('Unlock the real photo and contact details for {cost} credits. Once unlocked, it stays open for you.', {'cost': cost}), style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5)),
        if (balance != null) Padding(padding: const EdgeInsets.only(top: 6), child: Row(children: [const Icon(Icons.toll_rounded, size: 15, color: AppColors.goldText), const SizedBox(width: 5), Text(tr('You have {count} credits', {'count': balance}), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.goldText))])),
        const SizedBox(height: 10),
        if (!app.signedIn)
          AppButton('Sign in to unlock', tone: Tone.gold, icon: Icons.lock_open_rounded, expand: true, onPressed: () => push(context, LoginScreen(then: ProfileScreen(code: widget.code), replace: true)))
        else if (short || insufficient) ...[
          Notice('You do not have enough credits. Buy a package to unlock this profile.'),
          const SizedBox(height: 8),
          AppButton('Buy Premium Credits', tone: Tone.gold, icon: Icons.shopping_cart_rounded, expand: true, onPressed: () async {
            await push(context, const BuyCreditsScreen());
            await widget.onUnlocked();
          }),
        ] else
          AppButton(busy ? 'Unlocking…' : (cost == 1 ? 'Unlock profile · 1 credit' : tr('Unlock profile · {cost} credits', {'cost': cost})), tone: Tone.gold, icon: Icons.lock_open_rounded, expand: true, busy: busy, onPressed: _unlock),
        if (error != null && !insufficient) ...[const SizedBox(height: 8), Notice(error!)],
      ]),
    );
  }
}

class _LockedContact extends StatelessWidget {
  const _LockedContact({required this.labels});
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 22),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.sandLine)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [const Icon(Icons.lock_rounded, size: 15, color: Color(0xFFA67B2E)), const SizedBox(width: 6), Text(tr('Contact details'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))]),
        const SizedBox(height: 8),
        for (final label in labels)
          InkWell(
            onTap: () => showUnlockSheet(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(children: [
                Expanded(child: Text(tr(label), style: const TextStyle(color: AppColors.muted))),
                const Icon(Icons.lock_rounded, size: 12, color: Color(0xFF946C13)),
                const SizedBox(width: 4),
                Text(tr('Locked'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF946C13))),
              ]),
            ),
          ),
        const SizedBox(height: 10),
        AppButton('Unlock Full Profile Access', small: true, onPressed: () => showUnlockSheet(context)),
      ]),
    );
  }
}

/// Premium proposals are introduced personally, so their own details are never shown.
class _PremiumContact extends StatelessWidget {
  const _PremiumContact({required this.href});
  final String href;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 22),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), gradient: const LinearGradient(colors: [Color(0xFF062B4E), Color(0xFF03223F)])),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [const Icon(Icons.workspace_premium_rounded, size: 15, color: AppColors.champagne), const SizedBox(width: 6), Text(tr('Exclusive premium proposal').toUpperCase(), style: const TextStyle(color: AppColors.champagne, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2))]),
        const SizedBox(height: 8),
        Tx(tr('Interested in this exclusive matrimonial proposal? Contact our Al Zaujain Marriage Consultant for further details and assistance.'), style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.6)),
        const SizedBox(height: 14),
        AppButton('Contact for Premium Proposal', tone: Tone.gold, icon: Icons.chat_rounded, onPressed: () => openLink(context, href)),
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.tag, required this.title, required this.cards});
  final String tag;
  final String title;
  final List<Json> cards;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: SectionTag(tag)),
        Padding(padding: const EdgeInsets.fromLTRB(16, 2, 16, 12), child: Text(tr(title), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800))),
        SizedBox(
          height: 400,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: cards.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) => MatchCard(card: cards[index], width: 200),
          ),
        ),
      ]),
    );
  }
}

/// Full-screen photos with pinch to zoom.
class PhotoViewer extends StatelessWidget {
  const PhotoViewer({super.key, required this.paths, this.start = 0});
  final List<String> paths;
  final int start;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black),
      body: PageView(
        controller: PageController(initialPage: start),
        children: [for (final path in paths) InteractiveViewer(maxScale: 4, child: Center(child: NetImage(path, fit: BoxFit.contain)))],
      ),
    );
  }
}

/// The top of a proposal from the app design: the round portrait framed by gold laurels, the heart,
/// the name in serif, three facts, a few lines about them, their values as tags, and ✕ / ♥.
class _Hero extends StatefulWidget {
  const _Hero({required this.photos, required this.locked, required this.type, required this.photoPublic, required this.biodata, required this.code, required this.canSave});
  final List<Map> photos;
  final bool locked;
  final String type;
  final bool photoPublic;
  final Json biodata;
  final String code;
  final bool canSave;

  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  bool busy = false;

  String? _row(String label) {
    final rows = ((widget.biodata['candidate'] as List?) ?? const []).cast<Map>();
    final row = rows.where((item) => item['label'] == label);
    final value = row.isEmpty ? null : '${row.first['value'] ?? ''}'.trim();
    return value == null || value.isEmpty ? null : value;
  }

  String? _place() {
    final rows = ((widget.biodata['residence'] as List?) ?? const []).cast<Map>();
    final row = rows.where((item) => item['label'] == 'City');
    return row.isEmpty ? null : '${row.first['value']}'.split(' (').first;
  }

  Future<void> _save() async {
    if (!widget.canSave) {
      if (!app.signedIn) {
        await push(context, LoginScreen(then: ProfileScreen(code: widget.code), replace: true));
      } else {
        showMessage(context, 'Only members can save proposals.');
      }
      return;
    }
    final saved = app.saved.contains(widget.code);
    setState(() => busy = true);
    try {
      await app.toggleSaved(widget.code, !saved);
      if (mounted) showMessage(context, saved ? 'Removed from your saved profiles.' : 'Saved to your shortlist.');
    } on ApiException catch (error) {
      if (mounted) showMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = widget.photos;
    final saved = app.saved.contains(widget.code);
    final age = _row('Age');
    final facts = <(IconData, String)>[
      if (_row('Education') case final education?) (Icons.school_rounded, tr(education)),
      if (_row('Work details') case final work?) (Icons.work_rounded, tr(work)),
      if (_place() case final city?) (Icons.location_on_rounded, tr(city)),
    ];
    final tags = [for (final label in ['Religion', 'Maslak', 'Marital status', 'Caste', 'Mother language', 'Family status']) _row(label)].whereType<String>().take(6).toList();
    final about = '${widget.biodata['about'] ?? ''}'.trim();
    final size = (MediaQuery.of(context).size.width * 0.5).clamp(150.0, 230.0);
    return Container(
      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFBF4E6), Color(0xFFFFFCF6)])),
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 20),
      child: Column(children: [
        SizedBox(
          width: size + 56,
          height: size + 16,
          child: Stack(alignment: Alignment.center, clipBehavior: Clip.none, children: [
            Positioned.fill(child: CustomPaint(painter: _LaurelPainter(radius: size / 2 + 14))),
            GestureDetector(
              onTap: photos.isEmpty ? null : (widget.locked ? () => showUnlockSheet(context) : () => push(context, PhotoViewer(paths: photos.map((item) => '${item['file']}').toList()))),
              child: Container(
                width: size,
                height: size,
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFE9C77B), Color(0xFFB8893A)]), boxShadow: [BoxShadow(color: Color(0x3303223F), blurRadius: 24, offset: Offset(0, 10))]),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Color(0xFFF5EBDA), shape: BoxShape.circle),
                  child: ClipOval(
                    child: Stack(fit: StackFit.expand, children: [
                      photos.isEmpty ? Container(color: const Color(0xFFEFE3CC), padding: EdgeInsets.all(size * 0.2), child: Opacity(opacity: 0.55, child: Image.asset('assets/images/logo.png'))) : NetImage('${photos.first['file']}'),
                      if (widget.locked) Container(color: const Color(0x3303223F), alignment: Alignment.center, child: const Icon(Icons.visibility_off_rounded, color: Colors.white, size: 30)),
                    ]),
                  ),
                ),
              ),
            ),
            PositionedDirectional(
              end: 30,
              bottom: size * 0.06,
              child: Material(
                color: Colors.white,
                shape: const CircleBorder(side: BorderSide(color: Color(0xFFEDE3CF))),
                elevation: 3,
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: busy ? null : _save,
                  child: Padding(padding: const EdgeInsets.all(9), child: Icon(saved ? Icons.favorite_rounded : Icons.favorite_border_rounded, color: const Color(0xFFC0392B), size: 22, semanticLabel: tr(saved ? 'Remove from saved' : 'Save profile'))),
                ),
              ),
            ),
            PositionedDirectional(start: 26, top: 4, child: TypeBadge(widget.type)),
          ]),
        ),
        if (photos.length > 1 && !widget.locked)
          TextButton.icon(onPressed: () => push(context, PhotoViewer(paths: photos.map((item) => '${item['file']}').toList())), icon: const Icon(Icons.photo_library_rounded, size: 16), label: Text(tr('{count} photos', {'count': photos.length}))),
        if (widget.locked) TextButton.icon(onPressed: () => showUnlockSheet(context), icon: const Icon(Icons.lock_open_rounded, size: 16), label: Text(tr('Unlock Full Profile Photograph'))),
        if (photos.isEmpty && !widget.photoPublic)
          Padding(padding: const EdgeInsets.only(top: 8), child: Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.lock_rounded, size: 13, color: AppColors.muted), const SizedBox(width: 5), Text(tr('Photo shared through the consultancy'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted))])),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Flexible(child: Tx('${widget.biodata['name']}', textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'Playfair', fontSize: 27, color: AppColors.navy, fontVariations: [FontVariation('wght', 600)]))),
          if (widget.biodata['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 8), child: VerifiedBadge(size: 20)),
        ]),
        Text([?age, if (_place() case final city?) tr(city)].join('  •  '), style: const TextStyle(fontSize: 13.5, color: AppColors.muted)),
        if (facts.isNotEmpty) ...[
          const SizedBox(height: 14),
          Wrap(alignment: WrapAlignment.center, spacing: 18, runSpacing: 8, children: [
            for (final (icon, text) in facts)
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 170),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(icon, size: 16, color: AppColors.navy),
                  const SizedBox(width: 5),
                  Flexible(child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5, color: Color(0xFF47566A)))),
                ]),
              ),
          ]),
        ],
        if (about.isNotEmpty) ...[
          const SizedBox(height: 14),
          Tx(about, textAlign: TextAlign.center, maxLines: 5, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, height: 1.6, color: Color(0xFF3D4B5C))),
        ],
        if (tags.isNotEmpty) ...[
          const SizedBox(height: 14),
          Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: [
            for (final tag in tags)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFFF3E9D6), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE6D6B5))),
                child: Text(tr(tag), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF6B5427))),
              ),
          ]),
        ],
        const SizedBox(height: 20),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _RoundAction(icon: Icons.close_rounded, label: 'Back to proposals', background: Colors.white, foreground: AppColors.muted, size: 58, onTap: () => Navigator.of(context).maybePop()),
          const SizedBox(width: 28),
          _RoundAction(icon: saved ? Icons.favorite_rounded : Icons.favorite_border_rounded, label: saved ? 'Remove from saved' : 'Save profile', background: AppColors.gold, foreground: Colors.white, size: 68, onTap: busy ? null : _save),
        ]),
      ]),
    );
  }
}

class _RoundAction extends StatelessWidget {
  const _RoundAction({required this.icon, required this.label, required this.background, required this.foreground, required this.size, required this.onTap});
  final IconData icon;
  final String label;
  final Color background;
  final Color foreground;
  final double size;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Tooltip(
        message: tr(label),
        child: Material(
          color: background,
          shape: CircleBorder(side: BorderSide(color: background == Colors.white ? AppColors.line : background)),
          elevation: 4,
          shadowColor: const Color(0x4003223F),
          child: InkWell(customBorder: const CircleBorder(), onTap: onTap, child: SizedBox(width: size, height: size, child: Icon(icon, color: foreground, size: size * 0.42, semanticLabel: tr(label)))),
        ),
      );
}

/// Two gold laurel branches curving up either side of the portrait.
class _LaurelPainter extends CustomPainter {
  _LaurelPainter({required this.radius});
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final leaf = Paint()..color = const Color(0xFFC9A55A).withValues(alpha: 0.75);
    final stem = Paint()
      ..color = const Color(0xFFC9A55A).withValues(alpha: 0.75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    for (final side in [-1.0, 1.0]) {
      // From the bottom of the portrait up its side, about a third of the way round.
      const start = 0.62;
      const end = 0.08;
      final path = Path();
      for (var i = 0; i <= 20; i++) {
        final t = start + (end - start) * i / 20;
        final angle = math.pi / 2 + side * t * math.pi;
        final point = center + Offset(math.cos(angle), math.sin(angle)) * radius;
        i == 0 ? path.moveTo(point.dx, point.dy) : path.lineTo(point.dx, point.dy);
      }
      canvas.drawPath(path, stem);
      for (var i = 0; i < 7; i++) {
        final t = start + (end - start) * (i + 0.5) / 7;
        final angle = math.pi / 2 + side * t * math.pi;
        final point = center + Offset(math.cos(angle), math.sin(angle)) * radius;
        for (final outward in [true, false]) {
          canvas.save();
          canvas.translate(point.dx, point.dy);
          final tangent = angle + side * math.pi / 2;
          canvas.rotate(tangent + (outward ? -0.65 : 0.65) * side + math.pi);
          canvas.drawOval(Rect.fromCenter(center: Offset(0, outward ? -7 : 7), width: 6, height: 14 - i * 0.6), leaf);
          canvas.restore();
        }
      }
    }
  }

  @override
  bool shouldRepaint(_LaurelPainter oldDelegate) => oldDelegate.radius != radius;
}

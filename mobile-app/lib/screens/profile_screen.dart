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

/// One proposal, as on the website's /profile/<code> page. The server decides what this viewer may see.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: Text(code)),
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
  int photo = 0;
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
            BiodataHeader(data: biodata),
            Container(
              color: AppColors.paper,
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                _gallery(photos, locked),
                const SizedBox(height: 14),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Flexible(child: Tx('${biodata['name']}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w600))),
                  if (biodata['verified'] == true) const Padding(padding: EdgeInsets.only(left: 8), child: VerifiedBadge(size: 21)),
                ]),
                Text(place, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
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
                if (data['canSave'] == true) ...[const SizedBox(height: 10), _SaveButton(code: '${profile['code']}')],
              ]),
            ),
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

  Widget _gallery(List<Map> photos, bool locked) {
    if (photos.isEmpty) {
      return AspectRatio(
        aspectRatio: 1,
        child: Container(
          decoration: BoxDecoration(color: const Color(0xFFE9E1D1), borderRadius: BorderRadius.circular(18)),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Opacity(opacity: 0.6, child: Image.asset('assets/images/logo.png', width: 110)),
            if (profile['photoPublic'] == false) Padding(padding: const EdgeInsets.only(top: 10), child: Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.lock_rounded, size: 13, color: AppColors.muted), const SizedBox(width: 5), Text(tr('Photo shared through the consultancy'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.muted))])),
          ]),
        ),
      );
    }
    return Column(children: [
      AspectRatio(
        aspectRatio: 1,
        child: Stack(fit: StackFit.expand, children: [
          PageView.builder(
            itemCount: photos.length,
            onPageChanged: (index) => setState(() => photo = index),
            itemBuilder: (context, index) => GestureDetector(
              onTap: locked ? () => showUnlockSheet(context) : () => push(context, PhotoViewer(paths: photos.map((item) => '${item['file']}').toList(), start: index)),
              child: NetImage('${photos[index]['file']}', radius: 18),
            ),
          ),
          if (locked)
            IgnorePointer(
              child: Center(child: Container(width: 58, height: 58, decoration: const BoxDecoration(color: Color(0x9903223F), shape: BoxShape.circle), child: const Icon(Icons.visibility_off_rounded, color: Colors.white, size: 26))),
            ),
          Positioned(left: 12, top: 12, child: TypeBadge('${profile['type']}')),
          if (photos.length > 1)
            Positioned(right: 12, bottom: 12, child: Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4), decoration: BoxDecoration(color: const Color(0xB3062B4E), borderRadius: BorderRadius.circular(12)), child: Text('${photo + 1}/${photos.length}', style: const TextStyle(color: Colors.white, fontSize: 12)))),
        ]),
      ),
      if (locked) Padding(padding: const EdgeInsets.only(top: 8), child: TextButton.icon(onPressed: () => showUnlockSheet(context), icon: const Icon(Icons.lock_open_rounded, size: 16), label: Text(tr('Unlock Full Profile Photograph')))),
    ]);
  }
}

class _SaveButton extends StatefulWidget {
  const _SaveButton({required this.code});
  final String code;
  @override
  State<_SaveButton> createState() => _SaveButtonState();
}

class _SaveButtonState extends State<_SaveButton> {
  bool busy = false;
  @override
  Widget build(BuildContext context) {
    final saved = app.saved.contains(widget.code);
    return AppButton(saved ? 'Saved' : 'Save profile', tone: Tone.outline, icon: saved ? Icons.favorite_rounded : Icons.favorite_border_rounded, expand: true, busy: busy, onPressed: () async {
      setState(() => busy = true);
      try {
        await app.toggleSaved(widget.code, !saved);
      } on ApiException catch (error) {
        if (context.mounted) showMessage(context, error.message, error: true);
      } finally {
        if (mounted) setState(() => busy = false);
      }
    });
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
          height: 300,
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

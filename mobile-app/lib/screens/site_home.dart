import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/site.dart';
import 'auth_screens.dart';
import 'consultants_screen.dart';
import 'home_header.dart';
import 'home_screen.dart';
import 'info_screens.dart';
import 'packages_screen.dart';
import 'shell.dart';

/// Opens a website listing link ("/proposals/pakistan/multan?gender=female") in the Search tab.
void openListing(String href) {
  final uri = Uri.parse(href.startsWith('http') ? href : 'https://x$href');
  final parts = uri.pathSegments.where((part) => part.isNotEmpty).toList();
  final path = parts.isNotEmpty && parts.first == 'proposals' ? parts.skip(1).join('/') : '';
  shellKey.currentState?.showProposals(filters: uri.queryParameters, path: path);
}

final homeKeys = {'why-choose': GlobalKey(), 'registration': GlobalKey(), 'consultants': GlobalKey()};

/// Scrolls the home screen to one of its sections (the website's "#why-choose", "#registration"...).
void scrollHomeTo(String id) {
  shellKey.currentState?.select(Tabs.home);
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final target = homeKeys[id]?.currentContext;
    if (target != null) Scrollable.ensureVisible(target, duration: const Duration(milliseconds: 500), curve: Curves.easeOut);
  });
}

/// The website's homepage on a phone, section by section, from the same data.
class SiteHomeScreen extends StatefulWidget {
  const SiteHomeScreen({super.key});

  @override
  State<SiteHomeScreen> createState() => _SiteHomeScreenState();
}

class _SiteHomeScreenState extends State<SiteHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _channelWelcome());
  }

  // The website's WhatsApp Channel welcome: shown every time the app opens, until the member taps Join.
  Future<void> _channelWelcome() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString('channel_welcome') == 'joined') return;
    await Future<void>.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    final joined = await showDialog<bool>(context: context, builder: (_) => const _ChannelDialog());
    await prefs.setString('channel_welcome', joined == true ? 'joined' : 'later');
    await prefs.setInt('channel_welcome_at', DateTime.now().millisecondsSinceEpoch);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBF7F0),
      drawer: const HomeDrawer(),
      floatingActionButton: FloatingActionButton(
        heroTag: 'whatsapp',
        backgroundColor: AppColors.whatsapp,
        foregroundColor: Colors.white,
        tooltip: tr('Chat with Al Zaujain on WhatsApp'),
        shape: const CircleBorder(),
        onPressed: () => openLink(context, whatsappUrl()),
        child: const Icon(Icons.chat_rounded),
      ),
      body: Column(children: [
        const SiteHeader(),
        Expanded(
          child: Loader(
            padding: EdgeInsets.zero,
            load: () => app.api.get('home'),
            builder: (context, data, reload) {
              app.saved = {...app.saved, ...((data['saved'] as List?) ?? []).map((code) => '$code')};
              final sections = rowsOf(data['sections']);
              final consultants = rowsOf(data['consultants']);
              final director = ((data['director'] as Map?) ?? const {}).cast<String, dynamic>();
              return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                HeroBanners(banners: rowsOf(data['banners'])),
                for (final section in sections) ProposalSection(section: section),
                if (director.isNotEmpty) DirectorBlock(key: homeKeys['why-choose'], director: director),
                if (consultants.isNotEmpty) ConsultantsBlock(key: homeKeys['consultants'], consultants: consultants),
                GovBlock(key: homeKeys['registration'], ntn: (data['registration'] as Map?)?['ntn'] as String?),
                const SiteFooter(),
              ]);
            },
          ),
        ),
      ]),
    );
  }
}

/// The website's header on a phone: the announcement strip, then the logo, Register and the menu.
class SiteHeader extends StatelessWidget {
  const SiteHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final announcements = ((app.site['announcements'] as List?) ?? []).map((item) => tr('$item')).toList();
    final phone = '${app.site['site_phone'] ?? ''}';
    return Material(
      color: Colors.white,
      elevation: 0,
      child: Column(children: [
        Container(
          color: AppColors.navy,
          padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
          child: SizedBox(
            height: 30,
            child: Row(children: [
              Expanded(child: announcements.isEmpty ? const SizedBox.shrink() : Directionality(textDirection: TextDirection.ltr, child: Marquee(messages: announcements))),
              if (phone.isNotEmpty)
                InkWell(
                  onTap: () => openLink(context, 'tel:${app.site['site_phone_intl'] ?? phone}'),
                  child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('${tr('Need help?')} $phone', textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 10.5, color: AppColors.champagne))),
                ),
            ]),
          ),
        ),
        Container(
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE9E9E5)))),
          padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 6, 10),
          child: Row(children: [
            Image.asset('assets/images/logo.png', width: 44, height: 44),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                const Text('AL ZAUJAIN', maxLines: 1, style: TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.navy, letterSpacing: 0.5)),
                Text(tr('Marriage Bureau Multan Pakistan'), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Poppins', fontSize: 8.5, fontWeight: FontWeight.w600, color: Color(0xFF876623))),
              ]),
            ),
            ListenableBuilder(
              listenable: app,
              builder: (context, _) => FilledButton(
                onPressed: () => app.signedIn ? shellKey.currentState?.select(Tabs.account) : push(context, const RegisterScreen()),
                style: FilledButton.styleFrom(backgroundColor: AppColors.navy, foregroundColor: Colors.white, minimumSize: const Size(0, 36), padding: const EdgeInsets.symmetric(horizontal: 14), shape: const StadiumBorder()),
                child: Text(tr(app.signedIn ? (app.isMember ? 'Dashboard' : 'Admin') : 'Register'), style: TextStyle(fontFamily: headFont, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ),
            Builder(
              builder: (context) => IconButton(
                tooltip: tr('Open navigation'),
                onPressed: () => Scaffold.of(context).openDrawer(),
                icon: const Icon(Icons.menu_rounded, color: AppColors.navy, size: 26),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

/// The banner: the administrator's banners (rotating when there are several) with the search bar
/// along the bottom, over the picture.
class HeroBanners extends StatefulWidget {
  const HeroBanners({super.key, required this.banners});
  final List<Json> banners;

  @override
  State<HeroBanners> createState() => _HeroBannersState();
}

class _HeroBannersState extends State<HeroBanners> {
  final controller = PageController();
  final query = TextEditingController();
  Timer? timer;
  int page = 0;

  @override
  void initState() {
    super.initState();
    if (widget.banners.length > 1) {
      timer = Timer.periodic(const Duration(seconds: 6), (_) {
        if (!mounted || !controller.hasClients) return;
        controller.animateToPage((page + 1) % widget.banners.length, duration: const Duration(milliseconds: 700), curve: Curves.easeInOut);
      });
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    controller.dispose();
    query.dispose();
    super.dispose();
  }

  void _search() {
    FocusScope.of(context).unfocus();
    shellKey.currentState?.showProposals(filters: {'q': query.text.trim()});
  }

  Widget _image(Json banner) {
    // The same wide image as on computers, like the reference site: no separate phone crop.
    final src = '${banner['src'] ?? ''}';
    if (src.startsWith('/images/')) return Image.asset('assets/images/banner-default.jpg', fit: BoxFit.cover, alignment: const Alignment(0.2, -0.36));
    return NetImage(src);
  }

  @override
  Widget build(BuildContext context) {
    final banners = widget.banners.isEmpty ? [<String, dynamic>{'src': '/images/default'}] : widget.banners;
    // A 3:1 rectangle (1500 × 500) on every screen, like the reference site, with the search bar just below.
    return Column(children: [
      AspectRatio(
        aspectRatio: 3,
        child: Stack(fit: StackFit.expand, children: [
          PageView.builder(
            controller: controller,
            itemCount: banners.length,
            onPageChanged: (value) => setState(() => page = value),
            itemBuilder: (context, index) {
              // A phone's 3:1 strip is too short for words: the picture alone, and it is the link.
              final href = '${banners[index]['href'] ?? ''}';
              return GestureDetector(
                onTap: href.isEmpty ? null : () => href.startsWith('/proposals') ? openListing(href) : openLink(context, href.startsWith('/') ? app.api.absolute(href) : href),
                child: _image(banners[index]),
              );
            },
          ),
          if (banners.length > 1)
            Positioned(
              left: 0,
              right: 0,
              bottom: 8,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (var i = 0; i < banners.length; i++)
                  AnimatedContainer(duration: const Duration(milliseconds: 300), margin: const EdgeInsets.symmetric(horizontal: 3), width: i == page ? 22 : 7, height: 7, decoration: BoxDecoration(color: i == page ? AppColors.gold : Colors.white70, borderRadius: BorderRadius.circular(4))),
              ]),
            ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Container(
          height: 56,
          padding: const EdgeInsetsDirectional.only(start: 16, end: 5),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0xFFE9CFA0)), boxShadow: const [BoxShadow(color: Color(0x2603223F), blurRadius: 24, offset: Offset(0, 8))]),
          child: Row(children: [
            const Icon(Icons.search_rounded, color: Color(0xFFA17A33)),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: query,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _search(),
                style: const TextStyle(fontSize: 14.5, color: AppColors.navy),
                decoration: InputDecoration(hintText: tr('Search name, ID, city or caste'), filled: false, border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero),
              ),
            ),
            Material(
              shape: const CircleBorder(),
              color: AppColors.navy,
              child: InkWell(customBorder: const CircleBorder(), onTap: _search, child: Tooltip(message: tr('Search'), child: const SizedBox(width: 46, height: 46, child: Icon(Icons.search_rounded, color: Colors.white)))),
            ),
          ]),
        ),
      ),
    ]);
  }
}

/// One proposals section: the heading, "Tap To Switch" tabs, the newest cards and the list buttons.
class ProposalSection extends StatefulWidget {
  const ProposalSection({super.key, required this.section});
  final Json section;

  @override
  State<ProposalSection> createState() => _ProposalSectionState();
}

class _ProposalSectionState extends State<ProposalSection> {
  int active = 0;

  String _tabName(Json tab) => tab['tabLabel'] != null ? titleCase(tr('${tab['tabLabel']}')) : titleCase(tr('{place} Proposals', {'place': tr('${tab['label']}')}));

  @override
  Widget build(BuildContext context) {
    final tabs = rowsOf(widget.section['tabs']);
    final tab = tabs[active.clamp(0, tabs.length - 1)];
    final profiles = rowsOf(tab['profiles']);
    final name = tr('${tab['label']}');
    final href = '${tab['href']}';
    final links = tab['links'] != null
        ? rowsOf(tab['links'])
        : [
            {'label': 'View Female Proposals', 'href': '$href${href.contains('?') ? '&' : '?'}gender=female'},
            {'label': 'View Male Proposals', 'href': '$href${href.contains('?') ? '&' : '?'}gender=male'},
          ];
    final intro = '${tab['intro'] ?? widget.section['intro'] ?? ''}';
    return Container(
      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFDF8F0), Color(0xFFF8F1E4)])),
      padding: const EdgeInsets.fromLTRB(14, 44, 14, 44),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SectionHeading(title: '${widget.section['title']}', highlight: '${widget.section['highlight']}'),
        const SizedBox(height: 20),
        if (tabs.length > 1)
          Container(
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Color(0x12062B4E), blurRadius: 24, offset: Offset(0, 8))]),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text(titleCase(tr('Tap to switch')), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFFA17A33))),
              const SizedBox(height: 8),
              for (var i = 0; i < tabs.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () => setState(() => active = i),
                      child: Ink(
                        height: 46,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          gradient: i == active ? const LinearGradient(colors: [AppColors.navy, Color(0xFF0D3D6B)]) : null,
                          color: i == active ? null : const Color(0xFFFDFAF4),
                          borderRadius: BorderRadius.circular(10),
                          border: i == active ? null : Border.all(color: const Color(0xFFE9DCC0)),
                          boxShadow: i == active ? const [BoxShadow(color: Color(0x40062B4E), blurRadius: 14, offset: Offset(0, 6))] : null,
                        ),
                        child: Row(children: [
                          Expanded(child: Text(_tabName(tabs[i]), style: TextStyle(fontFamily: headFont, fontSize: 14, fontWeight: FontWeight.w600, color: i == active ? Colors.white : AppColors.navy))),
                          Icon(i == active ? Icons.check_rounded : Icons.chevron_right_rounded, size: 18, color: i == active ? Colors.white : AppColors.navy),
                        ]),
                      ),
                    ),
                  ),
                ),
            ]),
          ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 28, 12, 28),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Color(0x12062B4E), blurRadius: 40, offset: Offset(0, 15))]),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            tab['tabLabel'] != null ? SectionHeading(title: '${tab['tabLabel']}', size: 22) : SectionHeading(title: name, highlight: 'Proposals', size: 22),
            if (intro.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(tr(intro, {'place': name}), textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF343434), height: 1.5))),
            const SizedBox(height: 22),
            if (profiles.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: const Color(0xFFFDFAF4), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2D3B3))),
                child: Column(children: [
                  Text(tab['tabLabel'] != null ? tr('New proposals will appear here soon.') : tr('New {place} proposals will appear here soon.', {'place': name}), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 12),
                  AppButton('Submit a profile', small: true, trailing: Icons.arrow_forward_rounded, onPressed: () => openProfileForm(context)),
                ]),
              )
            else
              for (final profile in profiles) Padding(padding: const EdgeInsets.only(bottom: 18), child: SiteProfileCard(card: profile)),
            const SizedBox(height: 10),
            Wrap(alignment: WrapAlignment.center, spacing: 12, runSpacing: 14, children: [
              for (final link in links) GlowButton('${link['label']}', trailing: Icons.arrow_forward_rounded, onPressed: () => openListing('${link['href']}')),
            ]),
          ]),
        ),
      ]),
    );
  }
}

/// "Director & CEO, Al Zaujain Marriage Bureau": the framed portrait, name, summary, story and contact.
class DirectorBlock extends StatelessWidget {
  const DirectorBlock({super.key, required this.director});
  final Json director;

  @override
  Widget build(BuildContext context) {
    final bio = '${director['bio'] ?? ''}'.split(RegExp(r'\n\s*\n')).map((part) => part.trim()).where((part) => part.isNotEmpty);
    final href = '${director['href'] ?? ''}';
    return Container(
      decoration: const BoxDecoration(color: Color(0xFFFCF9F6), border: Border(top: BorderSide(color: Color(0xFFEEEEEE)), bottom: BorderSide(color: Color(0xFFEEEEEE)))),
      padding: const EdgeInsets.fromLTRB(16, 44, 16, 44),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SiteLabel('${director['title'] ?? ''}'),
        const SizedBox(height: 12),
        const Ornament(),
        const SizedBox(height: 28),
        Padding(
          padding: const EdgeInsetsDirectional.only(end: 16, bottom: 16),
          child: Stack(clipBehavior: Clip.none, children: [
            PositionedDirectional(start: 16, top: 16, end: -16, bottom: -16, child: Container(decoration: BoxDecoration(color: const Color(0xFFEFE3CF), borderRadius: BorderRadius.circular(20)))),
            AspectRatio(
              aspectRatio: 1,
              child: Container(
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFF3E9D6), width: 6), color: const Color(0xFFEFE4CF), boxShadow: const [BoxShadow(color: Color(0x1F062B4E), blurRadius: 30, offset: Offset(0, 12))]),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: director['photo'] != null ? NetImage('${director['photo']}') : Padding(padding: const EdgeInsets.all(40), child: Image.asset('assets/images/logo.png')),
                ),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 28),
        Text('${director['name'] ?? ''}', style: TextStyle(fontFamily: headFont, fontSize: 30, fontWeight: FontWeight.w700, color: AppColors.navy, height: 1.2)),
        if ('${director['summary'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 14), child: Text(tr('${director['summary']}'), style: const TextStyle(fontSize: 15, height: 1.6, color: Color(0xFF2F3B4A)))),
        for (final paragraph in bio) Padding(padding: const EdgeInsets.only(top: 14), child: Text(tr(paragraph), style: const TextStyle(fontSize: 15, height: 1.65, color: Color(0xFF2F3B4A)))),
        if ('${director['cta'] ?? ''}'.isNotEmpty) ...[
          const SizedBox(height: 22),
          Align(alignment: AlignmentDirectional.centerStart, child: GlowButton('${director['cta']}', icon: Icons.badge_rounded, onPressed: () => openLink(context, href.isEmpty ? whatsappUrl() : (href.startsWith('/') ? app.api.absolute(href) : href)))),
        ],
      ]),
    );
  }
}

/// "Hire Personal Matchmaking Consultant": the consultant cards to swipe through.
class ConsultantsBlock extends StatelessWidget {
  const ConsultantsBlock({super.key, required this.consultants});
  final List<Json> consultants;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8F1E6),
      padding: const EdgeInsets.fromLTRB(0, 40, 0, 44),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: SectionHeading(label: 'Expert Team', title: 'Hire Personal Matchmaking Consultant')),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Text(tr('Our consultants work with you personally: they understand your family’s requirements, suggest suitable proposals and stay with you until the rishta is settled.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, height: 1.6, color: Color(0xFF3D4A5A))),
        ),
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 16),
          child: SwipeCards(height: 470, children: [for (final consultant in consultants) ConsultantTile(consultant: consultant)]),
        ),
        const SizedBox(height: 22),
        Center(child: GlowButton('See All Consultants', icon: Icons.groups_rounded, onPressed: () => push(context, const ConsultantsScreen()))),
      ]),
    );
  }
}

/// "Government Registered Marriage Bureau": Government Registered and FBR Registered only.
class GovBlock extends StatelessWidget {
  const GovBlock({super.key, this.ntn});
  final String? ntn;

  @override
  Widget build(BuildContext context) {
    final tiles = [
      ('assets/images/pakistan-emblem.png', 'Government Registered', 'Registered matrimonial service, Government of Pakistan'),
      ('assets/images/fbr-logo.png', 'FBR Registered', ntn == null ? '' : tr('NTN {ntn}', {'ntn': ntn})),
    ];
    return Container(
      color: const Color(0xFFFBF6EE),
      padding: const EdgeInsets.fromLTRB(16, 44, 16, 44),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SectionHeading(label: tr('Welcome to {company}', {'company': 'Al Zaujain Marriage Bureau'}), title: 'Government Registered Marriage Bureau', size: 26),
        const SizedBox(height: 12),
        Text(tr('Government Registered · FBR Registered'), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFFA17A33))),
        const SizedBox(height: 26),
        Text(tr('{company} is a registered matrimonial service based in {city}, serving Pakistani families at home and overseas.', {'company': 'Al Zaujain Marriage Bureau', 'city': tr('Multan, Pakistan')}), style: const TextStyle(fontSize: 15, height: 1.65, color: Color(0xFF2F3B4A))),
        const SizedBox(height: 12),
        Text(tr('We work with honesty, privacy and care, and we guide every family as we would our own. Our business is registered with the Government of Pakistan and FBR.'), style: const TextStyle(fontSize: 15, height: 1.65, color: Color(0xFF2F3B4A))),
        const SizedBox(height: 14),
        for (final item in [tr('Government Registered'), ntn == null ? tr('FBR Registered') : tr('FBR Registered · NTN {ntn}', {'ntn': ntn})])
          Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [const Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF1F8A3A)), const SizedBox(width: 10), Expanded(child: Text(item, style: TextStyle(fontFamily: headFont, fontSize: 14.5, fontWeight: FontWeight.w600, color: AppColors.navy)))])),
        const SizedBox(height: 16),
        Align(alignment: AlignmentDirectional.centerStart, child: GlowButton('View Registration Details', icon: Icons.description_rounded, onPressed: () => push(context, const PackagesScreen()))),
        const SizedBox(height: 26),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Color(0x14062B4E), blurRadius: 40, offset: Offset(0, 15))]),
          child: LayoutBuilder(builder: (context, size) {
            final columns = size.maxWidth > 360 ? 2 : 1;
            return Wrap(children: [
              for (final (image, title, text) in tiles)
                Container(
                  width: size.maxWidth / columns,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 26),
                  decoration: BoxDecoration(border: Border.all(color: const Color(0xFFEFE6D5), width: 0.5)),
                  child: Column(children: [
                    SizedBox(height: 76, child: Image.asset(image, fit: BoxFit.contain)),
                    const SizedBox(height: 12),
                    Text(tr(title), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 15.5, fontWeight: FontWeight.w700, color: AppColors.navy)),
                    if (text.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(tr(text), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.4))),
                  ]),
                ),
            ]);
          }),
        ),
      ]),
    );
  }
}

/// The website's footer: tagline, brand, links, contact details, helpline and the declaration.
class SiteFooter extends StatelessWidget {
  const SiteFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final site = app.site;
    final phone = '${site['site_phone'] ?? ''}';
    final email = '${((app.config['fees'] as Map?)?['email']) ?? ''}';
    Widget heading(String text) => Padding(padding: const EdgeInsets.only(bottom: 12, top: 26), child: Text(titleCase(tr(text)), style: TextStyle(fontFamily: headFont, fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.navy)));
    Widget link(String text, VoidCallback onTap) => InkWell(onTap: onTap, child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Text(titleCase(tr(text)), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Color(0xFF525252)))));
    Widget social(IconData icon, String label, VoidCallback onTap) => Tooltip(
          message: tr(label),
          child: Material(color: AppColors.navy, shape: const CircleBorder(), child: InkWell(customBorder: const CircleBorder(), onTap: onTap, child: SizedBox(width: 42, height: 42, child: Icon(icon, size: 19, color: Colors.white)))),
        );
    return Container(
      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFBF7EF), Color(0xFFF6EFE2)]), border: Border(top: BorderSide(color: Color(0x14062B4E)))),
      padding: const EdgeInsets.fromLTRB(16, 36, 16, 96),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: GradientText(tr('Rishtay built on love, decisions made with family.'), size: 21, weight: FontWeight.w600)),
        const Center(child: UrduLine('رشتے محبت کے، فیصلے اپنوں کے', size: 17)),
        const SizedBox(height: 22),
        Row(children: [
          Image.asset('assets/images/logo.png', width: 56, height: 56),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('AL ZAUJAIN', style: TextStyle(fontFamily: 'Poppins', fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.navy)),
            Text(tr('International Marriage Consultancy'), style: const TextStyle(fontFamily: 'Poppins', fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF876623))),
          ]),
        ]),
        const SizedBox(height: 14),
        Text(tr('${site['footer_about'] ?? ''}'), style: const TextStyle(fontSize: 15, height: 1.7, color: Color(0xFF525252))),
        const SizedBox(height: 16),
        Wrap(spacing: 10, children: [
          social(Icons.chat_rounded, 'Chat on WhatsApp', () => openLink(context, whatsappUrl())),
          social(Icons.campaign_rounded, 'Official WhatsApp Channel', () => openLink(context, '${site['whatsapp_channel']}')),
          if (phone.isNotEmpty) social(Icons.call_rounded, 'Call us', () => openLink(context, 'tel:${site['site_phone_intl'] ?? phone}')),
          if (email.isNotEmpty) social(Icons.mail_rounded, 'Email us', () => openLink(context, 'mailto:$email')),
        ]),
        heading('Company'),
        link('Browse proposals', () => shellKey.currentState?.showProposals()),
        link('Packages', () => push(context, const PackagesScreen())),
        link('Marriage consultants', () => push(context, const ConsultantsScreen())),
        link('Submit a profile', () => openProfileForm(context)),
        link('Registration information', () => scrollHomeTo('registration')),
        heading('Policies'),
        link('Privacy policy', () => push(context, const LegalScreen(kind: 'privacy'))),
        link('Terms of use', () => push(context, const LegalScreen(kind: 'terms'))),
        if (!app.signedIn) link('Member login', () => push(context, const LoginScreen())),
        if (!app.signedIn) link('Register', () => push(context, const RegisterScreen())),
        heading('Contact us'),
        Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.location_on_rounded, size: 18, color: Color(0xFFA17A33)), const SizedBox(width: 8), Expanded(child: Text('${tr('Head office')}: ${tr('${site['site_location'] ?? ''}')}', style: const TextStyle(fontSize: 15, color: Color(0xFF525252))))])),
        if (phone.isNotEmpty) InkWell(onTap: () => openLink(context, 'tel:${site['site_phone_intl'] ?? phone}'), child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(children: [const Icon(Icons.call_rounded, size: 18, color: Color(0xFFA17A33)), const SizedBox(width: 8), Text(phone, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.navy))]))),
        InkWell(onTap: () => openLink(context, whatsappUrl()), child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(children: [const Icon(Icons.chat_rounded, size: 18, color: Color(0xFF14703A)), const SizedBox(width: 8), Text(tr('Chat on WhatsApp'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Color(0xFF14703A)))]))),
        if (email.isNotEmpty) InkWell(onTap: () => openLink(context, 'mailto:$email'), child: Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(children: [const Icon(Icons.mail_rounded, size: 18, color: Color(0xFFA17A33)), const SizedBox(width: 8), Flexible(child: Text(email, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppColors.navy)))]))),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: const BoxDecoration(border: Border.symmetric(horizontal: BorderSide(color: Color(0x1F062B4E)))),
          child: Column(children: [
            Text(tr('Helpline'), style: TextStyle(fontFamily: headFont, fontSize: 17, fontWeight: FontWeight.w600, color: AppColors.navy)),
            if (phone.isNotEmpty) Text(phone, textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Color(0xFFA17A33))),
          ]),
        ),
        const SizedBox(height: 16),
        Text(tr('We declare that Al Zaujain is not a dating website. It is strictly for matrimonial purposes only.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13.5, height: 1.6, color: Color(0xFF525252))),
        const SizedBox(height: 8),
        Center(child: Text('© ${DateTime.now().year} ${tr('Al Zaujain International Marriage Consultancy')} · ${tr('All rights reserved.')}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Color(0xFF525252)))),
      ]),
    );
  }
}

/// The website's WhatsApp Channel welcome.
class _ChannelDialog extends StatelessWidget {
  const _ChannelDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(24, 30, 24, 40),
          decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF075E54), Color(0xFF128C7E), Color(0xFF25D366)])),
          child: Column(children: [
            Container(width: 70, height: 70, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.chat_rounded, color: Color(0xFF25D366), size: 38)),
            const SizedBox(height: 12),
            Text(titleCase(tr('Official WhatsApp Channel')), style: const TextStyle(color: Colors.white70, fontSize: 12.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(tr('Join Al Zaujain on WhatsApp'), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, color: Colors.white, fontSize: 21, fontWeight: FontWeight.w700)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(tr('Get new proposals, rishta tips and bureau announcements first, straight on WhatsApp.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 14.5, height: 1.5, color: Color(0xFF47566A))),
            const SizedBox(height: 12),
            for (final item in ['New proposals every week', 'Announcements and events', 'Free to join, leave any time'])
              Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(children: [const Icon(Icons.check_rounded, size: 18, color: Color(0xFF25D366)), const SizedBox(width: 10), Expanded(child: Text(tr(item), style: const TextStyle(fontSize: 14)))])),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: () {
                openLink(context, '${app.site['whatsapp_channel']}');
                Navigator.pop(context, true);
              },
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white, minimumSize: const Size(0, 50), shape: const StadiumBorder()),
              icon: const Icon(Icons.notifications_active_rounded),
              label: Text(tr('Join WhatsApp Channel'), style: TextStyle(fontFamily: headFont, fontWeight: FontWeight.w700, fontSize: 15.5)),
            ),
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(tr('Maybe later'), style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600))),
          ]),
        ),
      ]),
    );
  }
}

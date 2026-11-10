import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';
import 'auth_screens.dart';
import 'consultants_screen.dart';
import 'credits_screen.dart';
import 'home_screen.dart';
import 'info_screens.dart';
import 'member_screens.dart';
import 'packages_screen.dart';
import 'shell.dart';
import 'site_home.dart';

const _serif = 'Playfair';
const _caps = 'Cinzel';

/// The top of the home screen from the app design: the crest, the arched tagline, the search bar
/// and the four quick searches, on navy with a faint lattice.
class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final announcements = ((app.site['announcements'] as List?) ?? []).map((item) => tr('$item')).toList();
    return CustomPaint(
      painter: _LatticePainter(),
      child: Padding(
        padding: EdgeInsets.only(top: top),
        child: Column(children: [
          if (announcements.isNotEmpty)
            Container(
              height: 28,
              color: Colors.black.withValues(alpha: 0.18),
              child: Directionality(textDirection: TextDirection.ltr, child: Marquee(messages: announcements)),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Row(children: [
              IconButton(tooltip: tr('Menu'), icon: const Icon(Icons.menu_rounded, color: AppColors.goldSoft, size: 28), onPressed: () => Scaffold.of(context).openDrawer()),
              const Spacer(),
              ListenableBuilder(
                listenable: app,
                builder: (context, _) => IconButton(
                  tooltip: tr('Notifications'),
                  onPressed: () => push(context, app.signedIn ? const NotificationsScreen() : const LoginScreen(then: NotificationsScreen())),
                  icon: Badge(
                    isLabelVisible: app.unreadNotifications > 0,
                    label: Text('${app.unreadNotifications}'),
                    backgroundColor: AppColors.gold,
                    textColor: AppColors.dark,
                    child: const Icon(Icons.notifications_none_rounded, color: AppColors.goldSoft, size: 27),
                  ),
                ),
              ),
            ]),
          ),
          const _Crest(),
          const SizedBox(height: 10),
          const _ArchTagline(),
          const SizedBox(height: 16),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 18), child: _SearchBar()),
          const SizedBox(height: 18),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 14), child: _QuickSearches()),
          const SizedBox(height: 20),
        ]),
      ),
    );
  }
}

/// The emblem under a small gold arch, the name in capitals and the line beneath it.
class _Crest extends StatelessWidget {
  const _Crest();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      SizedBox(
        width: 80,
        height: 54,
        child: CustomPaint(
          painter: _ArchPainter(color: AppColors.goldSoft, stroke: 2, ornament: true),
          child: Padding(padding: const EdgeInsets.fromLTRB(20, 15, 20, 2), child: Image.asset('assets/images/logo.png', fit: BoxFit.contain)),
        ),
      ),
      const SizedBox(height: 4),
      FittedBox(
        child: Text(
          'AL ZAUJAIN',
          style: TextStyle(fontFamily: _caps, fontSize: 32, color: Colors.white, letterSpacing: 3, fontVariations: const [FontVariation('wght', 500)], shadows: [Shadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 8)]),
        ),
      ),
      Text(
        app.t.isUrdu ? tr('Pakistani Marriage Bureau') : 'PAKISTANI MARRIAGE BUREAU',
        style: const TextStyle(fontFamily: _caps, fontSize: 11, color: AppColors.champagne, letterSpacing: 2.2, fontVariations: [FontVariation('wght', 600)]),
      ),
    ]);
  }
}

/// "Meaningful Connections for a Blessed Tomorrow" inside a pointed Mughal arch.
class _ArchTagline extends StatelessWidget {
  const _ArchTagline();

  @override
  Widget build(BuildContext context) {
    final width = (MediaQuery.of(context).size.width * 0.72).clamp(230.0, 400.0);
    return SizedBox(
      width: width,
      height: width * 0.42,
      child: CustomPaint(
        painter: _ArchPainter(color: AppColors.gold, stroke: 2.2, ornament: true, inner: true),
        child: Padding(
          padding: EdgeInsets.fromLTRB(width * 0.12, width * 0.13, width * 0.12, width * 0.035),
          child: Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                tr('Meaningful\nConnections\nfor a Blessed Tomorrow'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: _serif, fontSize: 19, height: 1.22, color: Colors.white, fontVariations: [FontVariation('wght', 450)]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// "Find your life partner" with the filter button, as in the design.
class _SearchBar extends StatefulWidget {
  const _SearchBar();

  @override
  State<_SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends State<_SearchBar> {
  final query = TextEditingController();

  void _search() {
    FocusScope.of(context).unfocus();
    shellKey.currentState?.showProposals(filters: {'q': query.text.trim()});
  }

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      padding: const EdgeInsetsDirectional.only(start: 16, end: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFBF7EE),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 18, offset: Offset(0, 8))],
      ),
      child: Row(children: [
        const Icon(Icons.search_rounded, color: AppColors.muted),
        const SizedBox(width: 10),
        Expanded(
          child: TextField(
            controller: query,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _search(),
            style: const TextStyle(fontSize: 15, color: AppColors.navy),
            decoration: InputDecoration(
              hintText: tr('Find your life partner'),
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        Container(width: 1, height: 26, color: AppColors.line),
        IconButton(
          tooltip: tr('Advanced search'),
          icon: const Icon(Icons.tune_rounded, color: AppColors.navy),
          onPressed: () => shellKey.currentState?.showProposals(filters: {'q': query.text.trim(), '_open': '1'}),
        ),
      ]),
    );
  }
}

/// Bride, Groom, By City and Values: one tap to a ready search.
class _QuickSearches extends StatelessWidget {
  const _QuickSearches();

  @override
  Widget build(BuildContext context) {
    Future<void> byCity() async {
      final featured = ((app.config['featuredCities'] as List?) ?? []).map((city) => '$city').toList();
      final all = ((app.config['cities'] as List?) ?? []).cast<Map>().map((city) => '${city['name']}').where((city) => !featured.contains(city));
      final city = await showPicker(context, title: tr('Choose a city'), options: [for (final city in [...featured, ...all]) Option(city), Option('overseas', tr('Overseas'))]);
      if (city != null && city.isNotEmpty) shellKey.currentState?.showProposals(filters: {'city': city});
    }

    Future<void> byValues() async {
      final form = ((app.config['form'] as List?) ?? []).cast<Map>();
      final field = form.expand((section) => ((section['fields'] as List?) ?? []).cast<Map>()).where((field) => field['name'] == 'sect');
      final options = field.isEmpty ? const <Option>[] : optionsFrom(field.first['options']).where((option) => option.value != 'Prefer not to say').toList();
      final sect = await showPicker(context, title: tr('Maslak / Sect'), options: options, searchable: false);
      if (sect != null && sect.isNotEmpty) shellKey.currentState?.showProposals(filters: {'sect': sect});
    }

    final items = <(IconData, String, VoidCallback)>[
      (Icons.face_3_rounded, 'Bride', () => shellKey.currentState?.showProposals(filters: const {'gender': 'female'})),
      (Icons.face_6_rounded, 'Groom', () => shellKey.currentState?.showProposals(filters: const {'gender': 'male'})),
      (Icons.location_city_rounded, 'By City', byCity),
      (Icons.auto_stories_rounded, 'Values', byValues),
    ];
    return Row(children: [
      for (final (icon, label, onTap) in items)
        Expanded(
          child: InkWell(
            borderRadius: BorderRadius.circular(40),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(children: [
                Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const RadialGradient(colors: [Color(0xFFFFFBF2), Color(0xFFF1E4C8)]),
                    border: Border.all(color: AppColors.goldSoft, width: 2),
                    boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 10, offset: Offset(0, 4))],
                  ),
                  child: Icon(icon, size: 28, color: AppColors.bronze),
                ),
                const SizedBox(height: 8),
                Text(app.t.isUrdu ? tr(label) : tr(label).toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
              ]),
            ),
          ),
        ),
    ]);
  }
}

/// A pointed Mughal arch in gold. With [inner], a second arch is drawn just inside the first,
/// and [ornament] adds the small diamonds of the design.
class _ArchPainter extends CustomPainter {
  _ArchPainter({required this.color, this.stroke = 2, this.ornament = false, this.inner = false});
  final Color color;
  final double stroke;
  final bool ornament;
  final bool inner;

  Path _arch(Rect box) {
    final w = box.width;
    final h = box.height;
    final shoulder = box.top + h * 0.42;
    return Path()
      ..moveTo(box.left, box.bottom)
      ..lineTo(box.left, shoulder)
      ..cubicTo(box.left, box.top + h * 0.18, box.left + w * 0.3, box.top + h * 0.2, box.left + w * 0.42, box.top + h * 0.1)
      ..quadraticBezierTo(box.left + w * 0.48, box.top + h * 0.05, box.left + w * 0.5, box.top)
      ..quadraticBezierTo(box.left + w * 0.52, box.top + h * 0.05, box.left + w * 0.58, box.top + h * 0.1)
      ..cubicTo(box.left + w * 0.7, box.top + h * 0.2, box.right, box.top + h * 0.18, box.right, shoulder)
      ..lineTo(box.right, box.bottom);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    final outer = Rect.fromLTWH(stroke, stroke, size.width - stroke * 2, size.height - stroke);
    canvas.drawPath(_arch(outer), paint);
    if (inner) {
      final gap = size.width * 0.035;
      canvas.drawPath(_arch(Rect.fromLTRB(outer.left + gap, outer.top + gap * 1.6, outer.right - gap, outer.bottom)), paint..strokeWidth = stroke * 0.5..color = color.withValues(alpha: 0.6));
    }
    if (ornament) {
      final fill = Paint()..color = color;
      void diamond(Offset c, double r) => canvas.drawPath(Path()..moveTo(c.dx, c.dy - r)..lineTo(c.dx + r, c.dy)..lineTo(c.dx, c.dy + r)..lineTo(c.dx - r, c.dy)..close(), fill);
      diamond(Offset(size.width / 2, outer.top - stroke * 0.2), stroke * 1.8);
      if (inner) {
        final y = size.height - stroke * 2;
        canvas.drawLine(Offset(size.width * 0.4, y), Offset(size.width * 0.6, y), Paint()..color = color.withValues(alpha: 0.7)..strokeWidth = 1);
        diamond(Offset(size.width / 2, y), stroke * 1.6);
      }
    }
  }

  @override
  bool shouldRepaint(_ArchPainter oldDelegate) => oldDelegate.color != color || oldDelegate.stroke != stroke;
}

/// The navy background with a faint geometric lattice, as behind the crest in the design.
class _LatticePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF0A3358), AppColors.navy, AppColors.dark]).createShader(Offset.zero & size));
    final line = Paint()
      ..color = Colors.white.withValues(alpha: 0.035)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    const step = 46.0;
    for (var y = -step; y < size.height + step; y += step) {
      for (var x = -step; x < size.width + step; x += step) {
        final c = Offset(x + (y ~/ step).isOdd.toInt() * step / 2, y);
        canvas.drawPath(Path()..moveTo(c.dx, c.dy - step / 2)..lineTo(c.dx + step / 2, c.dy)..lineTo(c.dx, c.dy + step / 2)..lineTo(c.dx - step / 2, c.dy)..close(), line);
        canvas.drawCircle(c, step * 0.18, line);
      }
    }
  }

  @override
  bool shouldRepaint(_LatticePainter oldDelegate) => false;
}

extension on bool {
  int toInt() => this ? 1 : 0;
}

/// The menu behind the ☰ button: the website's main menu, language and help.
class HomeDrawer extends StatelessWidget {
  const HomeDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    void go(VoidCallback action) {
      Navigator.of(context).pop();
      action();
    }

    // The website's menu, then the app's own extras.
    final items = <(IconData, String, VoidCallback)>[
      (Icons.home_rounded, 'Home', () => shellKey.currentState?.select(Tabs.home)),
      (Icons.travel_explore_rounded, 'Proposals', () => shellKey.currentState?.showProposals()),
      (Icons.inventory_2_rounded, 'Packages', () => push(context, const PackagesScreen())),
      (Icons.workspace_premium_rounded, 'Why Al Zaujain', () => scrollHomeTo('why-choose')),
      (Icons.verified_rounded, 'Registration', () => scrollHomeTo('registration')),
      (Icons.support_agent_rounded, 'Marriage consultants', () => push(context, const ConsultantsScreen())),
      (Icons.headset_mic_rounded, 'Contact us', () => push(context, const ContactScreen())),
      (Icons.person_add_alt_1_rounded, 'Submit a profile', () => openProfileForm(context)),
      (Icons.toll_rounded, 'Premium Credits', () => push(context, app.signedIn ? const CreditsScreen() : const LoginScreen(then: CreditsScreen()))),
      (Icons.smart_toy_rounded, 'Al Zaujain AI', () => showAssistant(context)),
      (Icons.translate_rounded, app.lang == 'ur' ? 'English' : 'اردو', () => app.setLanguage(app.lang == 'ur' ? 'en' : 'ur')),
      (Icons.settings_rounded, 'Settings', () => push(context, const AppSettingsScreen())),
    ];
    return Drawer(
      backgroundColor: AppColors.paper,
      child: ListView(padding: EdgeInsets.zero, children: [
        Container(
          padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 20, 20, 20),
          color: AppColors.navy,
          child: Row(children: [
            Image.asset('assets/images/logo.png', width: 48, height: 48),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('AL ZAUJAIN', style: TextStyle(fontFamily: _caps, color: Colors.white, fontSize: 20, letterSpacing: 1.5)),
                Text('PAKISTANI MARRIAGE BUREAU', style: TextStyle(fontFamily: _caps, color: AppColors.champagne, fontSize: 8.5, letterSpacing: 1.2)),
              ]),
            ),
          ]),
        ),
        for (final (icon, label, action) in items)
          ListTile(
            leading: Icon(icon, color: AppColors.gold),
            title: Text(label == 'اردو' || label == 'English' ? label : titleCase(tr(label)), style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500, fontFamily: label == 'اردو' ? 'NotoNaskhArabic' : null)),
            onTap: () => go(action),
          ),
      ]),
    );
  }
}

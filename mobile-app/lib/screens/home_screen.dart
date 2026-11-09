import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/enquiry_form.dart';
import '../widgets/pickers.dart';
import 'consultants_screen.dart';
import 'credits_screen.dart';
import 'info_screens.dart';
import 'shell.dart';

/// The website's homepage, section by section, arranged for a phone.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      floatingActionButton: FloatingActionButton(
        heroTag: 'whatsapp',
        backgroundColor: AppColors.whatsapp,
        foregroundColor: Colors.white,
        tooltip: tr('Chat with Al Zaujain on WhatsApp'),
        shape: const CircleBorder(),
        onPressed: () => openLink(context, whatsappUrl()),
        child: const Icon(Icons.chat_rounded),
      ),
      body: Loader(
        padding: EdgeInsets.zero,
        load: () => app.api.get('home'),
        builder: (context, data, reload) {
          app.saved = {...app.saved, ...((data['saved'] as List?) ?? []).map((code) => '$code')};
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _TopBar(),
              const _Hero(),
              const _Benefits(),
              const _Locations(),
              _Featured(profiles: ((data['profiles'] as List?) ?? []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList()),
              const _Journey(),
              const Padding(padding: EdgeInsets.fromLTRB(16, 0, 16, 28), child: WhatsAppChannelCard()),
              const _Reasons(),
              const _Registration(),
              _Faqs(faqs: ((data['faqs'] as List?) ?? []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList()),
              const _Contact(),
              const _Footer(),
            ],
          );
        },
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context) {
    final announcements = ((app.site['announcements'] as List?) ?? []).map((item) => tr('$item')).toList();
    return Container(
      color: AppColors.navy,
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
      child: Column(
        children: [
          if (announcements.isNotEmpty) SizedBox(height: 30, child: Directionality(textDirection: TextDirection.ltr, child: Marquee(messages: announcements))),
          Container(
            color: Colors.white,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 8, 10),
            child: Row(
              children: [
                Image.asset('assets/images/logo.png', width: 42, height: 42),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr('AL ZAUJAIN'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 1)),
                      Text(
                        tr('INTERNATIONAL MARRIAGE CONSULTANCY'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 8.5, letterSpacing: 0.8, color: AppColors.bronze),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => app.setLanguage(app.lang == 'ur' ? 'en' : 'ur'),
                  child: Text(
                    app.lang == 'ur' ? 'English' : 'اردو',
                    style: TextStyle(fontFamily: app.lang == 'ur' ? null : 'NotoNaskhArabic', fontWeight: FontWeight.w700, color: AppColors.navy),
                  ),
                ),
                IconButton(
                  tooltip: tr('Al Zaujain AI'),
                  onPressed: () => showAssistant(context),
                  icon: const Icon(Icons.support_agent_rounded, color: AppColors.gold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The announcement ticker from the top of the website: the messages scroll past, separated by gold diamonds.
class Marquee extends StatefulWidget {
  const Marquee({super.key, required this.messages});
  final List<String> messages;

  @override
  State<Marquee> createState() => _MarqueeState();
}

class _MarqueeState extends State<Marquee> with SingleTickerProviderStateMixin {
  static const style = TextStyle(fontFamily: 'Poppins', fontFamilyFallback: ['NotoNaskhArabic'], color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 0.4);
  static const gap = 40.0;
  late final AnimationController controller = AnimationController(vsync: this, duration: Duration(seconds: (widget.messages.join().length / 4).clamp(12, 60).round()))..repeat();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  // One full set of messages, each followed by a diamond, measured in the same font it is drawn in.
  double _width(TextScaler scaler) {
    var total = 0.0;
    for (final message in widget.messages) {
      final painter = TextPainter(text: TextSpan(text: message, style: style), textDirection: TextDirection.ltr, textScaler: scaler, maxLines: 1)..layout();
      total += painter.width + gap;
    }
    return total;
  }

  Widget _set() => Row(mainAxisSize: MainAxisSize.min, children: [
        for (final message in widget.messages) ...[
          Text(message, maxLines: 1, softWrap: false, style: style),
          SizedBox(width: gap, child: Center(child: Transform.rotate(angle: 0.785, child: Container(width: 5, height: 5, color: AppColors.goldSoft)))),
        ],
      ]);

  @override
  Widget build(BuildContext context) {
    final text = widget.messages.join(' · ');
    if (MediaQuery.of(context).disableAnimations) return Center(child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: style));
    final width = _width(MediaQuery.textScalerOf(context));
    final copies = (MediaQuery.of(context).size.width / width).ceil() + 1;
    return Semantics(
      label: text,
      child: ExcludeSemantics(
        child: ClipRect(
          child: AnimatedBuilder(
            animation: controller,
            builder: (context, _) => OverflowBox(
              maxWidth: double.infinity,
              alignment: AlignmentDirectional.centerStart,
              child: Transform.translate(offset: Offset(-controller.value * width, 0), child: Row(mainAxisSize: MainAxisSize.min, children: [for (var i = 0; i < copies; i++) _set()])),
            ),
          ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    final site = app.site;
    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset('assets/images/hero.jpg', fit: BoxFit.cover, alignment: const Alignment(0.5, -1)),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [const Color(0xED03223F), const Color(0xCC03223F), AppColors.dark.withValues(alpha: 0.97)]),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tr('${site['hero_eyebrow']}'),
                style: const TextStyle(color: AppColors.champagne, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2),
              ),
              const SizedBox(height: 10),
              Tx(
                '${tr('${site['hero_line1']}')}\n${tr('${site['hero_line2']}')}',
                style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w600, height: 1.25, letterSpacing: -0.8),
              ),
              Tx(
                tr('${site['hero_highlight']}'),
                style: const TextStyle(color: AppColors.goldSoft, fontSize: 32, fontWeight: FontWeight.w600, height: 1.3, letterSpacing: -0.8),
              ),
              const SizedBox(height: 10),
              Tx('${tr('${site['hero_sub1']}')} ${tr('${site['hero_sub2']}')}', style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.7)),
              if ('${site['hero_urdu']}'.isNotEmpty) UrduLine('${site['hero_urdu']}', size: 21, color: AppColors.champagne),
              const SizedBox(height: 8),
              AppButton('Speak to our team', tone: Tone.gold, trailing: Icons.arrow_forward_rounded, onPressed: () => push(context, const ContactScreen())),
              const SizedBox(height: 24),
              const _SearchBox(),
            ],
          ),
        ),
      ],
    );
  }
}

/// "Find your life partner": the website's quick search.
class _SearchBox extends StatefulWidget {
  const _SearchBox();

  @override
  State<_SearchBox> createState() => _SearchBoxState();
}

class _SearchBoxState extends State<_SearchBox> {
  static const ages = [('', 'Any adult age'), ('18-25', '18–25'), ('26-30', '26–30'), ('31-35', '31–35'), ('36-45', '36–45'), ('46-99', '46 and above')];
  final query = TextEditingController();
  String gender = 'female';
  String age = '';
  String city = '';

  @override
  Widget build(BuildContext context) {
    final cities = [...((app.config['featuredCities'] as List?) ?? []).map((city) => Option('$city')), Option('overseas', tr('Overseas'))];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Color(0x31001528), blurRadius: 40, offset: Offset(0, 12))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            tr('BISMILLAH. LET’S BEGIN.'),
            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 1, color: Color(0xFF916B29)),
          ),
          const SizedBox(height: 6),
          Text(tr('Find your life partner'), style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w600, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Row(
            children: [
              Flexible(
                child: Text(tr('A few preferences. A thoughtful start.'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
              ),
              TextButton(
                onPressed: () => shellKey.currentState?.showProposals(filters: const {'_open': '1'}),
                child: Text(
                  tr('Advanced search'),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF916B29), decoration: TextDecoration.underline),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          TextInput(label: 'Name, caste or profession', controller: query, placeholder: 'e.g. Jutt, Doctor, Ayesha', maxLength: 80),
          Row(
            children: [
              Expanded(
                child: PickerField(label: 'Looking for', options: [Option('female', tr('Bride')), Option('male', tr('Groom'))], value: gender, onChanged: (value) => setState(() => gender = value.isEmpty ? 'female' : value)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PickerField(label: 'Age range', options: [for (final (value, label) in ages) Option(value, tr(label))], value: age, onChanged: (value) => setState(() => age = value)),
              ),
            ],
          ),
          PickerField(label: 'Preferred city', options: cities, value: city, anyLabel: 'Any city', onChanged: (value) => setState(() => city = value)),
          AppButton(
            'Search rishtay',
            tone: Tone.gold,
            expand: true,
            trailing: Icons.arrow_forward_rounded,
            onPressed: () {
              shellKey.currentState?.showProposals(filters: {'q': query.text.trim(), 'gender': gender, 'age': age, 'city': city});
            },
          ),
        ],
      ),
    );
  }
}

class _Benefits extends StatelessWidget {
  const _Benefits();
  @override
  Widget build(BuildContext context) {
    const items = ['Share your preferences', 'Involve your family', 'Begin a conversation'];
    return Container(
      color: AppColors.cream,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(color: Color(0xFFEADBB8), shape: BoxShape.circle),
                    child: Text('0${i + 1}', style: const TextStyle(fontSize: 10, color: Color(0xFF7C5919))),
                  ),
                  const SizedBox(width: 10),
                  Text(tr(items[i]), style: const TextStyle(fontSize: 13)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Proposals by region: the website's Proposals menu.
class _Locations extends StatelessWidget {
  const _Locations();
  @override
  Widget build(BuildContext context) {
    final categories = ((app.config['categories'] as List?) ?? []).cast<Map>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 26, 16, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionTag('INTERNATIONAL RISHTA SEARCH'),
          const SizedBox(height: 4),
          Text(tr('Browse proposals'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final category in categories)
                ActionChip(
                  avatar: const Icon(Icons.public_rounded, size: 16, color: AppColors.gold),
                  label: Text(tr('${category['name']}')),
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: AppColors.line),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onPressed: () => shellKey.currentState?.showProposals(path: '${category['slug']}'),
                ),
              ActionChip(
                avatar: const Icon(Icons.travel_explore_rounded, size: 16, color: Colors.white),
                label: Text(tr('All proposals'), style: const TextStyle(color: Colors.white)),
                backgroundColor: AppColors.navy,
                side: const BorderSide(color: AppColors.navy),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                onPressed: () => shellKey.currentState?.showProposals(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Featured extends StatelessWidget {
  const _Featured({required this.profiles});
  final List<Json> profiles;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.cream,
      margin: const EdgeInsets.only(top: 22),
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionTag('A GLIMPSE OF YOUR NEXT CHAPTER'),
                const SizedBox(height: 4),
                Text(tr('Featured proposals'), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                const UrduLine('ایک بامعنی رشتے کی طرف پہلا قدم', size: 15),
                Tx(tr('Pakistan and overseas proposals, with the details that matter: education, work, family, and shared expectations.'), style: const TextStyle(fontSize: 14, height: 1.6)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (profiles.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Panel(
                child: Text(
                  tr('New proposals will appear here soon.'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.muted),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: CardGrid(cards: [for (final profile in profiles) {...profile, if (profile['featured'] == true) 'tag': 'Featured'}]),
            ),
          const SizedBox(height: 14),
          Center(
            child: AppButton('Browse proposals', tone: Tone.outline, trailing: Icons.arrow_forward_rounded, onPressed: () => shellKey.currentState?.showProposals()),
          ),
        ],
      ),
    );
  }
}

class _Journey extends StatelessWidget {
  const _Journey();
  @override
  Widget build(BuildContext context) {
    const steps = [
      (Icons.assignment_rounded, 'Share your preferences', 'اپنی ترجیحات بتائیں', 'Tell us about yourself or your family member, and what matters in a life partner.'),
      (Icons.forum_rounded, 'Discuss suitable proposals', 'مناسب رشتوں پر بات کریں', 'Explore potential matches with our team and discuss your family’s expectations.'),
      (Icons.family_restroom_rounded, 'Connect with the family', 'خاندان سے رابطہ کریں', 'When both sides are interested, take the next step with a family conversation.'),
    ];
    return Container(
      color: AppColors.mist,
      padding: const EdgeInsets.fromLTRB(20, 34, 20, 30),
      margin: const EdgeInsets.only(bottom: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionTag('YOUR RISHTA JOURNEY'),
          const SizedBox(height: 4),
          Tx('${tr('From a first conversation')} ${tr('to a family connection.')}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.3)),
          const SizedBox(height: 6),
          Tx(tr('Three thoughtful steps, with your family by your side.'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 20),
          for (var i = 0; i < steps.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.navy,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 6),
                    ),
                    child: Text('0${i + 1}', style: const TextStyle(color: AppColors.champagne, fontSize: 13)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Tx(tr(steps[i].$2), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                            ),
                            Icon(steps[i].$1, color: const Color(0xFFBD9343)),
                          ],
                        ),
                        UrduLine(steps[i].$3, size: 16, color: const Color(0xFF997127)),
                        Tx(tr(steps[i].$4), style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.6)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: AppColors.navy, borderRadius: BorderRadius.circular(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr('Every step, together.'),
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 12),
                AppButton('Talk to our team', tone: Tone.gold, trailing: Icons.arrow_forward_rounded, onPressed: () => push(context, const ContactScreen())),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// "Join Our Official WhatsApp Channel", also shown on the dashboard.
class WhatsAppChannelCard extends StatelessWidget {
  const WhatsAppChannelCard({super.key, this.compact = false});
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(colors: [Color(0xFF03223F), Color(0xFF062B4E), Color(0xFF0B3D33)], stops: [0, 0.55, 1]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(color: AppColors.whatsapp, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.chat_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr('Official channel').toUpperCase(),
                      style: const TextStyle(color: AppColors.champagne, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.4),
                    ),
                    Tx(
                      tr('Join Our Official WhatsApp Channel'),
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800, height: 1.25),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Tx(tr('Get the latest matrimonial proposals, announcements and advice from Al Zaujain straight on WhatsApp.'), style: const TextStyle(color: Color(0xFFD7E0E8), fontSize: 13.5, height: 1.55)),
          if (!compact) const UrduLine('تازہ ترین رشتے سب سے پہلے واٹس ایپ پر حاصل کریں', size: 16, color: AppColors.champagne),
          const SizedBox(height: 12),
          AppButton('Join Channel', tone: Tone.whatsapp, icon: Icons.open_in_new_rounded, onPressed: () => openLink(context, '${app.site['whatsapp_channel']}')),
        ],
      ),
    );
  }
}

class _Reasons extends StatelessWidget {
  const _Reasons();
  @override
  Widget build(BuildContext context) {
    const reasons = [
      (Icons.family_restroom_rounded, 'Family, at the heart', 'Bring your family into the conversation, at a pace that feels right for you.', 'اپنی سہولت کے مطابق خاندان کو گفتگو اور فیصلے میں شامل کریں۔'),
      (Icons.forum_rounded, 'A real conversation', 'Speak to our team about your expectations, questions, and next steps.', 'اپنی توقعات اور سوالات پر ہماری ٹیم سے کھل کر بات کریں۔'),
      (Icons.favorite_rounded, 'Values that matter', 'Discuss the family values and life goals you hope to share with a partner.', 'ان اقدار اور زندگی کے مقاصد کو اہمیت دیں جو آپ کے لیے معنی رکھتے ہیں۔'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionTag('WHY AL ZAUJAIN'),
          const SizedBox(height: 4),
          Tx('${tr('A personal approach.')} ${tr('A family decision.')}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1.2)),
          const UrduLine('آپ کی ترجیحات، آپ کے خاندان کا فیصلہ', size: 18),
          Tx(tr('Premium matchmaking for Pakistan and overseas families, built on understanding what matters to you.'), style: const TextStyle(fontSize: 14.5, height: 1.6)),
          const SizedBox(height: 18),
          for (var i = 0; i < reasons.length; i++)
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.navy,
                borderRadius: BorderRadiusDirectional.only(topStart: Radius.circular(8), topEnd: Radius.circular(30), bottomStart: Radius.circular(30), bottomEnd: Radius.circular(8)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: const BoxDecoration(color: AppColors.cream, shape: BoxShape.circle),
                        child: Icon(reasons[i].$1, color: const Color(0xFFA67B2E)),
                      ),
                      const Spacer(),
                      Text(
                        '0${i + 1}',
                        style: const TextStyle(color: AppColors.goldSoft, fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Tx(
                    tr(reasons[i].$2),
                    style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Tx(tr(reasons[i].$3), style: const TextStyle(color: Color(0xFFE3E8ED), fontSize: 14.5, height: 1.6)),
                  UrduLine(reasons[i].$4, size: 15, color: const Color(0xFFE3E8ED)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Registration extends StatelessWidget {
  const _Registration();
  @override
  Widget build(BuildContext context) {
    final site = app.site;
    Widget detail(IconData icon, String label, String value) => Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: const Color(0xFFA17A33)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(tr(label), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500)),
          ),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(color: AppColors.goldBg, borderRadius: BorderRadius.circular(5)),
              child: Tx(tr(value), style: const TextStyle(fontSize: 11, color: AppColors.goldText)),
            ),
          ),
        ],
      ),
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionTag('AL ZAUJAIN · BUSINESS & REGISTRATION'),
          const SizedBox(height: 4),
          Tx('${tr('A clear identity.')} ${tr('A confident beginning.')}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.25)),
          const SizedBox(height: 8),
          Tx(tr('Choosing a matrimonial consultancy is an important family decision. Get to know Al Zaujain, speak to our team, and ask about the business details before you begin.'), style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.7)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.sand,
              border: Border.all(color: AppColors.sandLine),
              borderRadius: const BorderRadiusDirectional.only(topStart: Radius.circular(24), topEnd: Radius.circular(6), bottomStart: Radius.circular(6), bottomEnd: Radius.circular(24)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Image.asset('assets/images/logo.png', width: 46, height: 46),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(tr('Al Zaujain'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                          Tx(tr('International Marriage Consultancy · Multan, Pakistan'), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(tr('Government registration'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                detail(Icons.account_balance_rounded, 'Registration authority', '${site['registration_authority']}'),
                detail(Icons.description_rounded, 'Registration number', '${site['registration_number']}'),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFFF6F7F7), borderRadius: BorderRadius.circular(7)),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_rounded, size: 15, color: Color(0xFF647E92)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Tx(tr('${site['registration_note']}'), style: const TextStyle(fontSize: 11.5, color: AppColors.muted, height: 1.5)),
                            const UrduLine('تصدیق ابھی باقی ہے۔ یہ نشان سرکاری منظوری کی تصدیق نہیں ہے۔', size: 11, color: AppColors.muted),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              AppButton('Request registration details', icon: Icons.help_center_rounded, small: true, onPressed: () => openLink(context, whatsappUrl())),
              AppButton('Speak to our team', tone: Tone.outline, small: true, icon: Icons.call_rounded, onPressed: () => openLink(context, 'tel:${app.site['site_phone_intl']}')),
            ],
          ),
        ],
      ),
    );
  }
}

class _Faqs extends StatelessWidget {
  const _Faqs({required this.faqs});
  final List<Json> faqs;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.paper,
      padding: const EdgeInsets.fromLTRB(16, 30, 16, 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.cream,
              border: BorderDirectional(start: BorderSide(color: AppColors.gold, width: 4)),
              borderRadius: BorderRadiusDirectional.only(topEnd: Radius.circular(20), bottomEnd: Radius.circular(20)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionTag('A LITTLE CLARITY, BEFORE YOU BEGIN'),
                const SizedBox(height: 4),
                Tx('${tr('Your questions.')} ${tr('Let’s talk about them.')}', style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w800, height: 1.25)),
                const SizedBox(height: 6),
                Tx(tr('Every family’s journey is different. Here’s a place to start.'), style: const TextStyle(fontSize: 14, height: 1.6)),
                TextButton.icon(
                  onPressed: () => openLink(context, whatsappUrl()),
                  icon: const Icon(Icons.chat_rounded, size: 16, color: AppColors.whatsapp),
                  label: Text(
                    tr('Have another question? Talk to us'),
                    style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.navy),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          for (final faq in faqs)
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.softLine),
                ),
                child: ExpansionTile(
                  shape: const RoundedRectangleBorder(),
                  iconColor: AppColors.gold,
                  collapsedIconColor: AppColors.navy,
                  title: Tx(tr('${faq['question']}'), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600)),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  expandedCrossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Tx(tr('${faq['answer']}'), style: const TextStyle(fontSize: 14, height: 1.65, color: Color(0xFF536471))),
                    if (faq['answer_ur'] != null && '${faq['answer_ur']}'.isNotEmpty) UrduLine('${faq['answer_ur']}', size: 15, color: AppColors.navy),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Contact extends StatelessWidget {
  const _Contact();
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.cream,
      padding: const EdgeInsets.fromLTRB(16, 30, 16, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const ContactHeader(),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFFDFD7C7)),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
            ),
            child: const Column(children: [EnquiryForm(), SizedBox(height: 20), Divider(), SizedBox(height: 16), SpeakToUs()]),
          ),
        ],
      ),
    );
  }
}

class ContactHeader extends StatelessWidget {
  const ContactHeader({super.key});
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(opacity: 0.22, child: Image.asset('assets/images/hero.jpg', fit: BoxFit.cover)),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [AppColors.navy, AppColors.navy.withValues(alpha: 0.75)]),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionTag('A RISHTA BEGINS WITH UNDERSTANDING', color: AppColors.champagne),
                const SizedBox(height: 6),
                Tx(
                  '${tr('For your family’s')} ${tr('beautiful tomorrow.')}',
                  style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700, height: 1.25),
                ),
                const UrduLine('آپ کے خاندان کے خوبصورت کل کے لیے', size: 18, color: AppColors.champagne),
                Tx(tr('Let’s talk about the person, the values, and the future you have in mind.'), style: const TextStyle(color: Color(0xFFC6D3DD), fontSize: 13, height: 1.6)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// "Prefer to speak with someone?" with the phone number and WhatsApp.
class SpeakToUs extends StatelessWidget {
  const SpeakToUs({super.key});
  @override
  Widget build(BuildContext context) {
    final site = app.site;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: const BoxDecoration(color: Color(0xFFF6EDDA), shape: BoxShape.circle),
          child: const Icon(Icons.headset_mic_rounded, color: Color(0xFFA87F30)),
        ),
        const SizedBox(height: 12),
        Tx('${tr('Prefer to speak')} ${tr('with someone?')}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        Tx(tr('We’d be happy to hear your family’s requirements.'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
        TextButton(
          style: TextButton.styleFrom(padding: EdgeInsets.zero),
          onPressed: () => openLink(context, 'tel:${site['site_phone_intl']}'),
          child: Text(
            '${site['site_phone']}',
            textDirection: TextDirection.ltr,
            style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w700, color: AppColors.navy),
          ),
        ),
        AppButton('Chat on WhatsApp', tone: Tone.gold, icon: Icons.chat_rounded, onPressed: () => openLink(context, whatsappUrl())),
        const SizedBox(height: 14),
        Row(
          children: [
            const Icon(Icons.location_on_rounded, size: 15, color: Color(0xFF667782)),
            const SizedBox(width: 6),
            Expanded(
              child: Tx(tr('${site['site_location']}'), style: const TextStyle(fontSize: 12.5, color: Color(0xFF667782))),
            ),
          ],
        ),
      ],
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer();
  @override
  Widget build(BuildContext context) {
    Widget link(String label, VoidCallback onTap) => InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Text(tr(label), style: const TextStyle(color: Color(0xFFE0E6EB), fontSize: 13)),
      ),
    );
    return Container(
      color: AppColors.dark,
      padding: const EdgeInsets.fromLTRB(20, 30, 20, 90),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionTag('YOUR FAMILY’S NEXT CHAPTER', color: AppColors.champagne),
          const SizedBox(height: 4),
          Tx(
            tr('Let’s begin with a conversation.'),
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 10),
          Tx(tr('${app.site['footer_about']}'), style: const TextStyle(color: Color(0xFFC1CDD6), fontSize: 12, height: 1.7)),
          const SizedBox(height: 16),
          Text(
            tr('Explore Al Zaujain'),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
          link('Browse proposals', () => shellKey.currentState?.showProposals()),
          link('Marriage consultants', () => push(context, const ConsultantsScreen())),
        link('Consultancy fees', () => push(context, const FeesScreen())),
          link('Submit a profile', () => openProfileForm(context)),
          link('Contact us', () => push(context, const ContactScreen())),
          link('Privacy', () => push(context, const LegalScreen(kind: 'privacy'))),
          link('Terms', () => push(context, const LegalScreen(kind: 'terms'))),
          const SizedBox(height: 14),
          const Divider(color: Color(0x22FFFFFF)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              for (final (icon, label) in [(Icons.favorite_rounded, 'Shared values'), (Icons.family_restroom_rounded, 'Family involvement'), (Icons.forum_rounded, 'Personal conversations')])
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 13, color: const Color(0xFFDAB660)),
                    const SizedBox(width: 6),
                    Text(tr(label), style: const TextStyle(color: Color(0xFFC2D0DA), fontSize: 11.5)),
                  ],
                ),
            ],
          ),
          const UrduLine('رشتے محبت کے، فیصلے اپنوں کے', size: 16, color: Color(0xFFDECA9C)),
          const SizedBox(height: 8),
          Tx('© ${tr('Al Zaujain International Marriage Consultancy')}', style: const TextStyle(color: Color(0xFFBAC8D3), fontSize: 11)),
          const SizedBox(height: 4),
          InkWell(
            onTap: () => openLink(context, 'https://softisense.com'),
            child: Text('${tr('Designed & developed by')} Softisense.com ↗', style: const TextStyle(color: AppColors.champagne, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}

/// The website's guided assistant: prepared answers only, nothing is sent anywhere.
void showAssistant(BuildContext context) {
  final site = app.site;
  final answers = [
    (tr('How do I get started?'), tr('Start by submitting your profile on this website, no account needed. You can also tell our team your city, age range, and what matters to you. Call {phone} or use WhatsApp to discuss the next steps.', {'phone': site['site_phone']})),
    (tr('Can I enquire for my family?'), tr('Yes. You can enquire for yourself, your son, daughter, or another adult family member. Involve the person concerned and share their preferences with our team.')),
    (tr('What are your charges?'), tr('Please contact our team for current service charges, what is included, and the terms before deciding. We do not publish a fixed package price here yet.')),
    (tr('When can I use the app?'), tr('The Al Zaujain Android app is available now. Download it from the Android app section on our homepage. Your login, profile, matches and messages are the same in the app and on this website.')),
    (tr('How is my information shared?'), tr('Public proposals show a first name and general details only. Your full name, contact details and CNIC stay private. Ask our team if you would like to know how consent is handled.')),
    (tr('How can I contact your team?'), tr('We are based in {location}. Call {phone} or tap “Speak with our team” below to open WhatsApp. Our team can guide you about proposals and the next steps.', {'location': tr('${site['site_location']}'), 'phone': site['site_phone']})),
  ];
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheet) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      builder: (context, scroll) => StatefulBuilder(
        builder: (context, setState) {
          return ListView(
            controller: scroll,
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(color: AppColors.navy, shape: BoxShape.circle),
                    child: const Icon(Icons.support_agent_rounded, color: AppColors.goldSoft),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(tr('Al Zaujain AI'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        Text(tr('Your guided rishta assistant'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.cream, borderRadius: BorderRadius.circular(14)),
                child: Tx(tr('Assalam-o-Alaikum! How can I help you today?')),
              ),
              const SizedBox(height: 12),
              SectionTag('CHOOSE A QUESTION'),
              const SizedBox(height: 6),
              for (final (question, answer) in answers)
                Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: Tx(question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    expandedCrossAxisAlignment: CrossAxisAlignment.start,
                    childrenPadding: const EdgeInsets.only(bottom: 12),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: AppColors.mist, borderRadius: BorderRadius.circular(12)),
                        child: Tx(answer, style: const TextStyle(fontSize: 13.5, height: 1.6)),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 10),
              AppButton('Speak with our team', tone: Tone.whatsapp, icon: Icons.chat_rounded, expand: true, onPressed: () => openLink(context, whatsappUrl())),
            ],
          );
        },
      ),
    ),
  );
}

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

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

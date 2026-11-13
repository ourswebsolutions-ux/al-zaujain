import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import 'cards.dart';
import 'common.dart';

/// The website's design pieces, drawn natively: gradient headings, the gold ornament, the small label
/// with lines, the white button with a light running round its border, the shining "View Profile"
/// button, and the proposal and consultant cards exactly as the website shows them on a phone.

const _gradient = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.navy, AppColors.navy, AppColors.gold], stops: [0, 0.3, 1]);

/// Navy fading into gold, like the website's section headings.
class GradientText extends StatelessWidget {
  const GradientText(this.text, {super.key, required this.size, this.align = TextAlign.center, this.weight = FontWeight.w700});
  final String text;
  final double size;
  final TextAlign align;
  final FontWeight weight;

  @override
  Widget build(BuildContext context) => ShaderMask(
        blendMode: BlendMode.srcIn,
        shaderCallback: (bounds) => _gradient.createShader(Offset.zero & bounds.size),
        child: Text(text, textAlign: align, style: TextStyle(fontFamily: headFont, fontSize: size, fontWeight: weight, height: app.t.isUrdu ? 1.9 : 1.2, letterSpacing: app.t.isUrdu ? 0 : 0.5)),
      );
}

/// A gold diamond between two fading lines.
class Ornament extends StatelessWidget {
  const Ornament({super.key});

  @override
  Widget build(BuildContext context) => Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(width: 60, height: 1, decoration: const BoxDecoration(gradient: LinearGradient(colors: [Colors.transparent, AppColors.gold]))),
        const SizedBox(width: 14),
        Transform.rotate(angle: math.pi / 4, child: Container(width: 8, height: 8, color: AppColors.gold)),
        const SizedBox(width: 14),
        Container(width: 60, height: 1, decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.gold, Colors.transparent]))),
      ]);
}

/// The small gold label above a heading ("Expert Team").
class SiteLabel extends StatelessWidget {
  const SiteLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Text(titleCase(tr(text)), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 13.5, fontWeight: FontWeight.w600, color: const Color(0xFFA17A33), letterSpacing: app.t.isUrdu ? 0 : 0.5));
}

/// A section heading: "Pakistan" in navy and "Proposals" in the gradient, then the ornament.
class SectionHeading extends StatelessWidget {
  const SectionHeading({super.key, required this.title, this.highlight, this.label, this.size = 27});
  final String title;
  final String? highlight;
  final String? label;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      if (label != null) ...[SiteLabel(label!), const SizedBox(height: 8)],
      if (highlight == null)
        GradientText(titleCase(tr(title)), size: size)
      else
        Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.end, spacing: 8, children: [
          Text(titleCase(tr(title)), style: TextStyle(fontFamily: headFont, fontSize: size, fontWeight: FontWeight.w700, color: AppColors.navy, height: app.t.isUrdu ? 1.9 : 1.2)),
          GradientText(tr(highlight!), size: size),
        ]),
      const SizedBox(height: 14),
      const Ornament(),
    ]);
  }
}

/// The website's call-to-action button: white and rounded, with a gold light circling its border.
class GlowButton extends StatefulWidget {
  const GlowButton(this.label, {super.key, required this.onPressed, this.icon, this.trailing});
  final String label;
  final VoidCallback onPressed;
  final IconData? icon;
  final IconData? trailing;

  @override
  State<GlowButton> createState() => _GlowButtonState();
}

class _GlowButtonState extends State<GlowButton> with SingleTickerProviderStateMixin {
  late final AnimationController spin = AnimationController(vsync: this, duration: const Duration(milliseconds: 3500))..repeat();

  @override
  void dispose() {
    spin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    return Semantics(
      button: true,
      label: tr(widget.label),
      excludeSemantics: true,
      child: GestureDetector(
        onTap: widget.onPressed,
        child: Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(40), boxShadow: const [BoxShadow(color: Color(0x40062B4E), blurRadius: 15, offset: Offset(0, 4))]),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(40),
            child: Stack(alignment: Alignment.center, children: [
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: spin,
                  builder: (context, _) => CustomPaint(painter: _GlowPainter(reduce ? 0.3 : spin.value)),
                ),
              ),
              Container(
                margin: const EdgeInsets.all(3),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  if (widget.icon != null) ...[Icon(widget.icon, size: 17, color: AppColors.gold), const SizedBox(width: 9)],
                  Flexible(child: Text(titleCase(tr(widget.label)), style: TextStyle(fontFamily: headFont, fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.navy))),
                  if (widget.trailing != null) ...[const SizedBox(width: 8), Icon(widget.trailing, size: 17, color: AppColors.gold)],
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _GlowPainter extends CustomPainter {
  _GlowPainter(this.turn);
  final double turn;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = math.max(size.width, size.height);
    final paint = Paint()
      ..shader = SweepGradient(
        transform: GradientRotation(turn * 2 * math.pi),
        colors: const [Colors.transparent, Colors.white, AppColors.gold, Colors.transparent, Colors.transparent],
        stops: const [0, 0.1, 0.4, 0.4, 1],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawRect(Offset.zero & size, Paint()..color = Colors.white);
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(_GlowPainter oldDelegate) => oldDelegate.turn != turn;
}

/// A button with a white flash sweeping across it every three seconds, like "Profile Detail" on the website.
class ShineButton extends StatefulWidget {
  const ShineButton({super.key, required this.child, required this.onPressed, this.color = AppColors.navy, this.shine = Colors.white, this.radius = 12, this.height = 50, this.gradient});
  final Widget child;
  final VoidCallback onPressed;
  final Color color;
  final Color shine;
  final double radius;
  final double height;
  final Gradient? gradient;

  @override
  State<ShineButton> createState() => _ShineButtonState();
}

class _ShineButtonState extends State<ShineButton> with SingleTickerProviderStateMixin {
  late final AnimationController loop = AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat();

  @override
  void dispose() {
    loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    return Material(
      color: widget.gradient == null ? widget.color : Colors.transparent,
      borderRadius: BorderRadius.circular(widget.radius),
      clipBehavior: Clip.antiAlias,
      child: Ink(
        decoration: BoxDecoration(gradient: widget.gradient),
        child: InkWell(
          onTap: widget.onPressed,
          child: SizedBox(
            height: widget.height,
            child: Stack(children: [
              if (!reduce)
                Positioned.fill(
                  child: AnimatedBuilder(
                    animation: loop,
                    builder: (context, _) {
                      // Quiet for most of the cycle, then a bright band sweeps across.
                      final t = loop.value < 0.78 ? -1.0 : (loop.value - 0.78) / 0.22;
                      if (t < 0) return const SizedBox.shrink();
                      return FractionalTranslation(
                        translation: Offset(-1 + t * 2.2, 0),
                        child: Transform.rotate(angle: 0.35, child: Container(decoration: BoxDecoration(gradient: LinearGradient(colors: [widget.shine.withValues(alpha: 0), widget.shine.withValues(alpha: 0.65 * (1 - t)), widget.shine.withValues(alpha: 0)])))),
                      );
                    },
                  ),
                ),
              Positioned.fill(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 15), child: widget.child)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// The proposal card the website shows on a phone: a large square photo with its type and profile ID,
/// "Name · age", the place, then Education, Profession and Marital Status as headings above their
/// values, and "View Profile" (plus "Unlock" for a locked Premium profile).
class SiteProfileCard extends StatelessWidget {
  const SiteProfileCard({super.key, required this.card});
  final Json card;

  @override
  Widget build(BuildContext context) {
    final code = '${card['code']}';
    final type = '${card['type'] ?? 'paid'}';
    final unlocked = type == 'paid' && app.unlocked.contains(code);
    final locked = type == 'paid' && !unlocked;
    final photo = card['photo'] as String?;
    final blurred = photo != null && photosLocked && type != 'public' && !unlocked;
    final (String tag, Gradient tagColour, Color tagText) = switch (type) {
      'public' => ('Free', const LinearGradient(colors: [Color(0xFF1F8A3A), Color(0xFF1F8A3A)]), Colors.white),
      'premium' => ('Exclusive', const LinearGradient(colors: [AppColors.navy, AppColors.navy]), AppColors.champagne),
      _ => ('Premium', const LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)]), AppColors.dark),
    };
    final (IconData statusIcon, Color statusBg, Color statusFg) = type == 'premium'
        ? (Icons.workspace_premium_rounded, AppColors.navy, AppColors.champagne)
        : locked
            ? (Icons.lock_rounded, AppColors.gold, AppColors.dark)
            : (Icons.lock_open_rounded, const Color(0xFF1F8A3A), Colors.white);
    final place = [card['city'], card['country']].where((part) => part != null && '$part'.isNotEmpty).map((part) => tr('$part')).join(', ');
    final rows = [('Education', card['education']), ('Profession', card['profession']), ('Marital Status', card['maritalStatus'])];
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFDDD1B8)), boxShadow: const [BoxShadow(color: Color(0x0803223F), blurRadius: 22, offset: Offset(0, 6))]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        GestureDetector(
          onTap: () => openProposal(context, code),
          child: AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(fit: StackFit.expand, children: [
                photo == null
                    ? Container(color: const Color(0xFFE9E1D1), padding: const EdgeInsets.all(60), child: Opacity(opacity: 0.6, child: Image.asset('assets/images/logo.png')))
                    : NetImage('/media/photos/$photo'),
                if (blurred) GestureDetector(onTap: () => showUnlockSheet(context), child: Container(color: const Color(0x3303223F), alignment: Alignment.center, child: Container(width: 46, height: 46, decoration: const BoxDecoration(color: Color(0x9903223F), shape: BoxShape.circle), child: const Icon(Icons.visibility_off_rounded, color: Colors.white)))),
                PositionedDirectional(
                  start: 12,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(gradient: tagColour, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Color(0x2E03223F), blurRadius: 8, offset: Offset(0, 3))]),
                    child: Text(tr(tag), style: TextStyle(fontFamily: headFont, fontSize: 11.5, fontWeight: FontWeight.w700, color: tagText)),
                  ),
                ),
                if (app.isMember) PositionedDirectional(end: 10, top: 10, child: SaveHeart(code: code)),
                PositionedDirectional(
                  start: 12,
                  bottom: 12,
                  child: Container(width: 38, height: 38, decoration: BoxDecoration(color: statusBg, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)), child: Icon(statusIcon, size: 15, color: statusFg)),
                ),
                PositionedDirectional(
                  end: 12,
                  bottom: 12,
                  child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: const Color(0xD9062B4E), borderRadius: BorderRadius.circular(6)), child: Text(code, textDirection: TextDirection.ltr, style: const TextStyle(fontFamily: 'Poppins', fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 0.6, color: Colors.white))),
                ),
              ]),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 22, 12, 4),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Flexible(child: Text(titleCase('${card['name']}'), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: headFont, fontSize: 23, fontWeight: FontWeight.w800, color: AppColors.navy))),
              if (card['age'] != null) Text(' · ${card['age']}', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600, color: AppColors.muted)),
              if (card['verified'] == true) const Padding(padding: EdgeInsetsDirectional.only(start: 6), child: VerifiedBadge(size: 17)),
            ]),
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.location_on_rounded, size: 15, color: Color(0xFFB18433)),
              const SizedBox(width: 5),
              Expanded(child: Text(place.isEmpty ? '—' : titleCase(place), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, color: AppColors.muted))),
            ]),
            const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(height: 1, color: Color(0xFFEFE7D6))),
            for (final (label, value) in rows)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(titleCase(tr(label)), style: TextStyle(fontFamily: headFont, fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF8A6A2C))),
                  const SizedBox(height: 2),
                  Text(value == null || '$value'.isEmpty ? '—' : titleCase(tr('$value')), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.navy, height: 1.3)),
                ]),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            ShineButton(
              color: AppColors.cream,
              shine: const Color(0xFFE4B653),
              onPressed: () => openProposal(context, code),
              child: Row(children: [
                Expanded(child: Text(tr('View Profile'), style: TextStyle(fontFamily: headFont, fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.navy))),
                const Icon(Icons.arrow_forward_rounded, size: 18, color: AppColors.navy),
              ]),
            ),
            if (locked) ...[
              const SizedBox(height: 8),
              ShineButton(
                gradient: const LinearGradient(colors: [Color(0xFFF4D889), Color(0xFFC99432)]),
                onPressed: () => openProposal(context, code),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.lock_rounded, size: 15, color: AppColors.dark),
                  const SizedBox(width: 6),
                  Text(app.unlockCost == 1 ? tr('Unlock · 1 credit') : tr('Unlock · {cost} credits', {'cost': app.unlockCost}), style: TextStyle(fontFamily: headFont, fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.dark)),
                ]),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}

/// One consultant card, as on the website: Online/Offline from their working hours, photo, name,
/// experience, rating, specialities, hours and Connect Now on WhatsApp with a ready message.
class ConsultantTile extends StatelessWidget {
  const ConsultantTile({super.key, required this.consultant});
  final Json consultant;

  static const message = 'Hello, I would like to consult with you regarding marriage services.';

  @override
  Widget build(BuildContext context) {
    final online = consultant['online'] as bool?;
    final rating = (consultant['rating'] as num?)?.toDouble();
    final tags = ((consultant['specialties'] as List?) ?? const []).map((item) => '$item').toList();
    final number = '${consultant['whatsapp'] ?? ''}'.replaceAll(RegExp(r'\D'), '');
    final years = (consultant['experience_years'] as num?)?.toInt() ?? 0;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 56, 16, 22),
      decoration: BoxDecoration(color: const Color(0xFFFDF9F3), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE9CFA0)), boxShadow: const [BoxShadow(color: Color(0x0A062B4E), blurRadius: 10, offset: Offset(0, 2))]),
      // The content spans the whole card and is centred, like the website's card.
      child: Stack(clipBehavior: Clip.none, children: [
        SizedBox(width: double.infinity, child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Container(
            width: 104,
            height: 104,
            padding: EdgeInsets.all(rating != null && rating >= 4.8 ? 4 : 0),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: rating != null && rating >= 4.8 ? const LinearGradient(colors: [Color(0xFFFFE08A), Color(0xFFE4A92A)]) : null,
              boxShadow: rating != null && rating >= 4.8 ? const [BoxShadow(color: Color(0x99F5C24A), blurRadius: 18)] : null,
            ),
            child: ClipOval(
              child: Container(
                color: AppColors.navy,
                child: consultant['photo'] != null ? NetImage('${consultant['photo']}') : const Icon(Icons.person_rounded, color: AppColors.champagne, size: 46),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(titleCase('${consultant['display_name']}'), textAlign: TextAlign.center, style: TextStyle(fontFamily: headFont, fontSize: 17, fontWeight: FontWeight.w700, color: const Color(0xFF1A1A1A))),
          if (years > 0) Text(tr('{count} Years Exp.', {'count': years}), style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF1A1A1A))),
          if (rating != null)
            Row(mainAxisSize: MainAxisSize.min, children: [
              Text(rating.toStringAsFixed(1), style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
              const SizedBox(width: 4),
              for (var n = 1; n <= 5; n++) Icon(rating >= n ? Icons.star_rounded : rating >= n - 0.5 ? Icons.star_half_rounded : Icons.star_outline_rounded, size: 16, color: const Color(0xFFF5B301)),
            ]),
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(alignment: WrapAlignment.center, spacing: 6, runSpacing: 6, children: [
              for (final tag in tags) Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: const Color(0xFFE6C9CD)), borderRadius: BorderRadius.circular(3)), child: Text(titleCase(tr(tag)), style: const TextStyle(fontSize: 12, color: Color(0xFF333333)))),
            ]),
          ],
          const SizedBox(height: 16),
          if (consultant['hours'] != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF222222)),
                const SizedBox(width: 5),
                Flexible(child: Text('${consultant['hours']}', textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 13, color: Color(0xFF222222)))),
              ]),
            ),
          if (number.isNotEmpty || '${app.site['site_whatsapp']}'.isNotEmpty)
            FilledButton.icon(
              onPressed: () {
                final to = number.isNotEmpty ? number : '${app.site['site_whatsapp']}'.replaceAll(RegExp(r'\D'), '');
                openLink(context, 'https://wa.me/$to?text=${Uri.encodeComponent(tr(message))}');
              },
              style: FilledButton.styleFrom(backgroundColor: AppColors.navy, foregroundColor: Colors.white, minimumSize: const Size(0, 40), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6))),
              icon: const Icon(Icons.forum_rounded, size: 16),
              label: Text(tr('Connect Now'), style: TextStyle(fontFamily: headFont, fontWeight: FontWeight.w600, fontSize: 14)),
            ),
        ])),
        if (online != null)
          PositionedDirectional(
            end: -4,
            top: -44,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: online ? const Color(0xFF22A35A) : const Color(0xFF7C7C7C), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white, width: 2)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.history_rounded, size: 12, color: Colors.white),
                const SizedBox(width: 3),
                Text(tr(online ? 'Online' : 'Offline'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
              ]),
            ),
          ),
      ]),
    );
  }
}

/// Horizontal cards that swipe one at a time, with a peek of the next and dots beneath. Every card
/// takes the height of the tallest, so nothing is ever cut off.
class SwipeCards extends StatefulWidget {
  const SwipeCards({super.key, required this.children, this.height});
  final List<Widget> children;
  final double? height; // Kept for older callers; the cards size themselves.

  @override
  State<SwipeCards> createState() => _SwipeCardsState();
}

class _SwipeCardsState extends State<SwipeCards> {
  final controller = ScrollController();
  int page = 0;
  double step = 1;

  @override
  void initState() {
    super.initState();
    controller.addListener(() {
      final next = (controller.offset / step).round().clamp(0, widget.children.length - 1);
      if (next != page) setState(() => page = next);
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.children.length == 1) return Padding(padding: const EdgeInsetsDirectional.only(end: 16), child: widget.children.first);
    return LayoutBuilder(builder: (context, size) {
      final width = size.maxWidth * 0.86;
      step = width + 14;
      return Column(children: [
        SingleChildScrollView(
          controller: controller,
          scrollDirection: Axis.horizontal,
          physics: _SnapPhysics(step),
          child: IntrinsicHeight(
            child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              for (final child in widget.children) Padding(padding: const EdgeInsetsDirectional.only(end: 14), child: SizedBox(width: width, child: child)),
            ]),
          ),
        ),
        const SizedBox(height: 14),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          for (var i = 0; i < widget.children.length; i++)
            GestureDetector(
              onTap: () => controller.animateTo((i * step).clamp(0, controller.position.maxScrollExtent), duration: const Duration(milliseconds: 350), curve: Curves.easeOut),
              child: AnimatedContainer(duration: const Duration(milliseconds: 250), margin: const EdgeInsets.symmetric(horizontal: 4), width: i == page ? 22 : 8, height: 8, decoration: BoxDecoration(color: i == page ? AppColors.gold : const Color(0xFFD9CDB4), borderRadius: BorderRadius.circular(4))),
            ),
        ]),
      ]);
    });
  }
}

/// Scroll physics that settle on whole cards, like the website's scroll snapping.
class _SnapPhysics extends ScrollPhysics {
  const _SnapPhysics(this.step, {super.parent});
  final double step;

  @override
  _SnapPhysics applyTo(ScrollPhysics? ancestor) => _SnapPhysics(step, parent: buildParent(ancestor));

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    if ((velocity <= 0 && position.pixels <= position.minScrollExtent) || (velocity >= 0 && position.pixels >= position.maxScrollExtent)) {
      return super.createBallisticSimulation(position, velocity);
    }
    final tol = toleranceFor(position);
    var page = position.pixels / step;
    if (velocity < -tol.velocity) {
      page -= 0.5;
    } else if (velocity > tol.velocity) {
      page += 0.5;
    }
    final target = (page.roundToDouble() * step).clamp(position.minScrollExtent, position.maxScrollExtent);
    if ((target - position.pixels).abs() < tol.distance) return null;
    return ScrollSpringSimulation(spring, position.pixels, target, velocity, tolerance: tol);
  }

  @override
  bool get allowImplicitScrolling => false;
}

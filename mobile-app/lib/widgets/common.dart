import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';

final _rtlStart = RegExp(r'^[^A-Za-z؀-ۿ]*[؀-ۿ]');

/// Text that orders itself by its own first letters (Urdu right-to-left, English left-to-right),
/// aligned to the start of the page: the right in Urdu, the left in English, as on the website.
class Tx extends StatelessWidget {
  const Tx(this.text, {super.key, this.style, this.maxLines, this.overflow, this.textAlign, this.softWrap});
  final String text;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;
  final TextAlign? textAlign;
  final bool? softWrap;

  @override
  Widget build(BuildContext context) {
    final rtl = _rtlStart.hasMatch(text);
    return Text(
      text,
      style: style,
      maxLines: maxLines,
      overflow: overflow,
      softWrap: softWrap,
      textDirection: rtl ? TextDirection.rtl : TextDirection.ltr,
      textAlign: textAlign ?? (Directionality.of(context) == TextDirection.rtl ? TextAlign.right : TextAlign.left),
    );
  }
}

/// An Urdu calligraphy line in the website's Nastaliq style.
class UrduLine extends StatelessWidget {
  const UrduLine(this.text, {super.key, this.size = 17, this.color = AppColors.deepGold, this.align});
  final String text;
  final double size;
  final Color color;
  final TextAlign? align;

  @override
  Widget build(BuildContext context) => Text(text, textDirection: TextDirection.rtl, textAlign: align ?? (Directionality.of(context) == TextDirection.rtl ? TextAlign.right : TextAlign.left), style: urduStyle.copyWith(fontSize: size, color: color));
}

class SectionTag extends StatelessWidget {
  const SectionTag(this.text, {super.key, this.color = AppColors.bronze});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(tr(text), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: app.t.isUrdu ? 0 : 1.4, color: color));
}

/// The website's heading font: Poppins, or Noto Nastaliq Urdu in Urdu.
String get headFont => app.t.isUrdu ? 'NotoNastaliqUrdu' : 'Poppins';

/// "marital status" → "Marital Status", as the website shows labels and profile details.
/// Emails, links and numbers are left exactly as they are.
String titleCase(String text) {
  if (app.t.isUrdu || text.contains('@') || text.contains('://')) return text;
  return text.split(' ').map((word) => word.isEmpty ? word : word[0].toUpperCase() + word.substring(1)).join(' ');
}

enum Tone { navy, gold, outline, danger, whatsapp, light }

class AppButton extends StatelessWidget {
  const AppButton(this.label, {super.key, this.onPressed, this.icon, this.tone = Tone.navy, this.busy = false, this.expand = false, this.small = false, this.trailing});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final IconData? trailing;
  final Tone tone;
  final bool busy;
  final bool expand;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final (background, foreground, border) = switch (tone) {
      Tone.navy => (AppColors.navy, Colors.white, AppColors.navy),
      Tone.gold => (AppColors.gold, AppColors.dark, AppColors.gold),
      Tone.outline => (Colors.white, AppColors.navy, AppColors.line),
      Tone.danger => (AppColors.red, Colors.white, AppColors.red),
      Tone.whatsapp => (AppColors.whatsapp, Colors.white, AppColors.whatsapp),
      Tone.light => (AppColors.cream, AppColors.navy, AppColors.cream),
    };
    final child = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (busy)
          SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: foreground))
        else if (icon != null)
          Icon(icon, size: small ? 15 : 18),
        if (busy || icon != null) const SizedBox(width: 8),
        Flexible(child: Text(titleCase(tr(label)), overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: headFont, fontWeight: FontWeight.w600, fontSize: small ? 12.5 : 14))),
        if (trailing != null) ...[const SizedBox(width: 8), Icon(trailing, size: small ? 14 : 16)],
      ],
    );
    final button = FilledButton(
      onPressed: busy ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: background,
        foregroundColor: foreground,
        disabledBackgroundColor: background.withValues(alpha: 0.55),
        disabledForegroundColor: foreground.withValues(alpha: 0.8),
        padding: EdgeInsets.symmetric(horizontal: small ? 14 : 20, vertical: small ? 10 : 15),
        minimumSize: Size(0, small ? 38 : 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: border)),
        elevation: 0,
      ),
      child: child,
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}

/// A white card with the website's soft border and shadow.
class Panel extends StatelessWidget {
  const Panel({super.key, required this.child, this.title, this.padding = const EdgeInsets.all(18), this.color = Colors.white, this.borderColor = const Color(0xFFE7E9EE), this.trailing});
  final Widget child;
  final String? title;
  final Widget? trailing;
  final EdgeInsets padding;
  final Color color;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
        boxShadow: const [BoxShadow(color: Color(0x0803223F), blurRadius: 28, offset: Offset(0, 10))],
      ),
      child: title == null
          ? child
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Expanded(child: Text(titleCase(tr(title)), style: TextStyle(fontFamily: headFont, fontSize: 15, fontWeight: FontWeight.w600))), ?trailing]),
              const SizedBox(height: 12),
              child,
            ]),
    );
  }
}

class Notice extends StatelessWidget {
  const Notice(this.message, {super.key, this.ok = false, this.warning = false});
  final String message;
  final bool ok;
  final bool warning;

  @override
  Widget build(BuildContext context) {
    final (border, background, text) = ok
        ? (const Color(0xFF588465), AppColors.greenBg, AppColors.green)
        : warning
            ? (AppColors.gold, AppColors.goldBg, AppColors.goldText)
            : (AppColors.red, AppColors.redBg, AppColors.red);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: background, border: BorderDirectional(start: BorderSide(color: border, width: 3))),
      child: Tx(tr(message), style: TextStyle(fontSize: 13, color: text, height: 1.45)),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.text, this.action});
  final IconData icon;
  final String title;
  final String? text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 34),
      child: Column(children: [
        Container(width: 56, height: 56, decoration: const BoxDecoration(color: AppColors.cream, shape: BoxShape.circle), child: Icon(icon, color: AppColors.gold, size: 24)),
        const SizedBox(height: 14),
        Tx(titleCase(tr(title)), textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        if (text != null) ...[const SizedBox(height: 6), Tx(tr(text), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5))],
        if (action != null) ...[const SizedBox(height: 18), action!],
      ]),
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()));
}

class ErrorView extends StatelessWidget {
  const ErrorView(this.error, {super.key, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final message = error is ApiException ? (error as ApiException).message : 'Something went wrong. Please try again.';
    final offline = error is ApiException && (error as ApiException).offline;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(offline ? Icons.wifi_off_rounded : Icons.error_outline_rounded, size: 42, color: AppColors.gold),
          const SizedBox(height: 12),
          Tx(tr(message), textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppColors.muted, height: 1.5)),
          if (onRetry != null) ...[const SizedBox(height: 18), AppButton('Try again', icon: Icons.refresh_rounded, onPressed: onRetry, small: true)],
        ]),
      ),
    );
  }
}

/// Loads data for a screen, with pull-to-refresh and a retry button when offline.
class Loader extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder, this.scroll = true, this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 32)});
  final Future<Json> Function() load;
  final Widget Function(BuildContext context, Json data, Future<void> Function() reload) builder;
  final bool scroll;
  final EdgeInsets padding;

  @override
  State<Loader> createState() => LoaderState();
}

class LoaderState extends State<Loader> {
  Json? data;
  Object? error;

  @override
  void initState() {
    super.initState();
    reload();
  }

  Future<void> reload() async {
    try {
      final result = await widget.load();
      if (mounted) setState(() { data = result; error = null; });
    } catch (caught) {
      if (mounted) setState(() => error = caught);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (data == null && error == null) return const LoadingView();
    if (data == null) return ErrorView(error!, onRetry: () { setState(() => error = null); reload(); });
    // Each text keeps its own accessibility node, so TalkBack reads a screen item by item.
    final content = Semantics(explicitChildNodes: true, child: widget.builder(context, data!, reload));
    if (!widget.scroll) return content;
    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: reload,
      child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: widget.padding, children: [content]),
    );
  }
}

/// A photo from the website. The token goes along, so restricted photos follow the same rules as the website.
class NetImage extends StatelessWidget {
  const NetImage(this.path, {super.key, this.fit = BoxFit.cover, this.alignment = Alignment.center, this.radius = 0, this.width, this.height});
  final String? path;
  final BoxFit fit;
  final Alignment alignment;
  final double radius;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      width: width,
      height: height,
      color: const Color(0xFFE9E1D1),
      alignment: Alignment.center,
      child: Opacity(opacity: 0.6, child: Image.asset('assets/images/logo.png', width: 90, height: 90)),
    );
    if (path == null || path!.isEmpty) return ClipRRect(borderRadius: BorderRadius.circular(radius), child: placeholder);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.network(
        app.api.absolute(path!),
        headers: app.api.authHeaders,
        width: width,
        height: height,
        fit: fit,
        alignment: alignment,
        gaplessPlayback: true,
        errorBuilder: (_, _, _) => placeholder,
        loadingBuilder: (context, child, progress) => progress == null ? child : Container(width: width, height: height, color: const Color(0xFFEFE8DA)),
      ),
    );
  }
}

class TypeBadge extends StatelessWidget {
  const TypeBadge(this.type, {super.key});
  final String? type;

  @override
  Widget build(BuildContext context) {
    final (icon, label, background, foreground) = switch (type) {
      'premium' => (Icons.lock_rounded, 'Exclusive', AppColors.navy, AppColors.champagne),
      'public' => (Icons.lock_open_rounded, 'Free', const Color(0xFFEAF5EE), const Color(0xFF1F6B3A)),
      _ => (Icons.workspace_premium_rounded, 'Premium', const Color(0xFFE4B653), AppColors.dark),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(20)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 11, color: foreground),
        const SizedBox(width: 4),
        Text(tr(label).toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: foreground, letterSpacing: 0.5)),
      ]),
    );
  }
}

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, this.size = 18});
  final double size;
  @override
  Widget build(BuildContext context) => Tooltip(message: tr('Verified'), child: Icon(Icons.verified_rounded, color: AppColors.verified, size: size));
}

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.color = AppColors.goldText, this.background = AppColors.goldBg});
  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(20)),
        child: Text(tr(label), style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: color)),
      );
}

/// A label and value on one line, like the website's biodata rows.
/// One profile detail as the website shows it: the heading above its value, never side by side.
class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE9E2D4)))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Tx(titleCase(tr(label)), style: TextStyle(fontFamily: headFont, fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF8A6A2C))),
        const SizedBox(height: 3),
        Tx(titleCase(tr(value)), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.navy, height: 1.35)),
      ]),
    );
  }
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Tx(tr(message), style: const TextStyle(color: Colors.white)), backgroundColor: error ? AppColors.red : AppColors.dark));
}

Future<void> openLink(BuildContext context, String url) async {
  final uri = Uri.parse(url);
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication).catchError((_) => false);
  if (!ok && context.mounted) showMessage(context, 'This link could not be opened.', error: true);
}

String whatsappUrl([String? text]) {
  final number = '${app.site['site_whatsapp'] ?? ''}';
  return 'https://wa.me/$number${text == null ? '' : '?text=${Uri.encodeComponent(text)}'}';
}

Future<void> copyText(BuildContext context, String text, String done) async {
  await Clipboard.setData(ClipboardData(text: text));
  if (context.mounted) showMessage(context, done);
}

Future<T?> push<T>(BuildContext context, Widget screen) => Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => screen));

/// The website writes dates as "9 Nov 2026".
String formatDate(Object? value, {bool time = false}) {
  if (value == null) return '';
  final date = DateTime.tryParse('$value')?.toLocal();
  if (date == null) return '$value';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final day = '${date.day} ${tr(months[date.month - 1])}';
  if (time) return '$day, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  return '$day ${date.year}';
}

/// A screen title with the website's short description underneath.
class PageIntro extends StatelessWidget {
  const PageIntro(this.title, {super.key, this.text, this.urdu});
  final String title;
  final String? text;
  final String? urdu;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Tx(titleCase(tr(title)), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, height: 1.25)),
        if (urdu != null) UrduLine(urdu!, size: 16),
        if (text != null) ...[const SizedBox(height: 4), Tx(tr(text), style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.5))],
      ]),
    );
  }
}

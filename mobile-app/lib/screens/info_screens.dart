import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';
import '../widgets/enquiry_form.dart';
import 'home_screen.dart';
import 'my_profile_screen.dart';
import 'setup_screen.dart';

/// The website's privacy policy or terms of use, with the same wording.
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.kind});
  final String kind;

  @override
  Widget build(BuildContext context) {
    final title = kind == 'privacy' ? 'Privacy policy' : 'Terms of use';
    final sections = ((((app.config['legal'] as Map?) ?? const {})[kind] as List?) ?? const []).cast<List>();
    return Scaffold(
      appBar: AppBar(title: Text(tr(title))),
      body: ListView(padding: const EdgeInsets.fromLTRB(18, 18, 18, 40), children: [
        const SectionTag('AL ZAUJAIN MARRIAGE BUREAU'),
        const SizedBox(height: 4),
        Text(tr(title), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
        const SizedBox(height: 18),
        for (final section in sections) ...[
          Tx(tr('${section[0]}'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Tx(tr('${section[1]}'), style: const TextStyle(fontSize: 14.5, height: 1.8, color: Color(0xFF536471))),
          const SizedBox(height: 20),
        ],
      ]),
    );
  }
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: Text(tr('Contact us'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const ContactHeader(),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: const Color(0xFFDFD7C7)), borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18))),
          child: const Column(children: [EnquiryForm(), SizedBox(height: 20), Divider(), SizedBox(height: 16), SpeakToUs()]),
        ),
      ]),
    );
  }
}

/// Language, the connected website and the app version.
class AppSettingsScreen extends StatelessWidget {
  const AppSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: Text(tr('Settings'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Panel(
            title: 'Language',
            child: Wrap(spacing: 10, children: [
              for (final (code, label) in [('en', 'English'), ('ur', 'اردو')])
                ChoiceChip(
                  label: Text(label, style: TextStyle(fontFamily: code == 'ur' ? 'NotoNaskhArabic' : null, fontWeight: FontWeight.w600)),
                  selected: app.lang == code,
                  selectedColor: AppColors.gold,
                  onSelected: (_) => app.setLanguage(code),
                ),
            ]),
          ),
          const SizedBox(height: 14),
          Panel(
            title: 'Connected website',
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${app.domain}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Tx(tr('Changing the website signs you out of this app.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
              const SizedBox(height: 12),
              Wrap(spacing: 10, runSpacing: 10, children: [
                AppButton('Change website', icon: Icons.language_rounded, small: true, onPressed: () => push(context, const SetupScreen())),
                AppButton('Open the website', tone: Tone.outline, icon: Icons.open_in_new_rounded, small: true, onPressed: () => openLink(context, '${app.domain}')),
              ]),
            ]),
          ),
          const SizedBox(height: 14),
          Center(child: Text(tr('Version {version}', {'version': appVersion}), style: const TextStyle(fontSize: 12, color: AppColors.muted))),
          if (app.signedIn) ...[const SizedBox(height: 14), AppButton('Sign out', tone: Tone.outline, icon: Icons.logout_rounded, expand: true, onPressed: () async {
            await app.signOut();
            if (context.mounted) Navigator.of(context).popUntil((route) => route.isFirst);
          })],
        ]),
      ),
    );
  }
}

/// Profiles submitted without an account are managed with the private link the bureau emails.
/// The app remembers links from this phone, and any other link can be pasted here.
class ManageLinksScreen extends StatefulWidget {
  const ManageLinksScreen({super.key});
  @override
  State<ManageLinksScreen> createState() => _ManageLinksScreenState();
}

class _ManageLinksScreenState extends State<ManageLinksScreen> {
  final link = TextEditingController();

  String? _token(String input) {
    final value = input.trim();
    final match = RegExp(r'/manage/([\w-]{20,200})').firstMatch(value);
    if (match != null) return match[1];
    return RegExp(r'^[\w-]{20,200}$').hasMatch(value) ? value : null;
  }

  @override
  Widget build(BuildContext context) {
    final links = app.manageLinks;
    return Scaffold(
      appBar: AppBar(title: Text(tr('Open the private link'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Panel(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Tx(tr('Paste the private link from your email'), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(controller: link, keyboardType: TextInputType.url, decoration: InputDecoration(hintText: '${app.domain}/manage/…')),
            const SizedBox(height: 12),
            AppButton('Open the private link', icon: Icons.link_rounded, onPressed: () {
              final token = _token(link.text);
              if (token == null) {
                showMessage(context, 'This private link is not valid. Please check it and try again.', error: true);
                return;
              }
              push(context, ManageScreen(token: token));
            }),
          ]),
        ),
        if (links.isNotEmpty) ...[
          const SizedBox(height: 16),
          Panel(
            title: 'Profiles submitted from this phone',
            child: Column(children: [
              for (final item in links)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.badge_rounded, color: AppColors.gold),
                  title: Text('${item['name']} · ${item['code']}'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => push(context, ManageScreen(token: '${item['token']}')).then((_) => setState(() {})),
                ),
            ]),
          ),
        ],
      ]),
    );
  }
}

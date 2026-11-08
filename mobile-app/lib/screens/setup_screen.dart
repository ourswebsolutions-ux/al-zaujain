import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

/// The first screen: which Al Zaujain website should this app connect to?
/// The address is saved on the phone and can be changed later in Settings.
class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key, this.first = false});
  final bool first;

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  late final TextEditingController address = TextEditingController(text: app.domain ?? '');
  bool busy = false;
  String? error;

  Future<void> _connect() async {
    FocusScope.of(context).unfocus();
    setState(() { busy = true; error = null; });
    try {
      await app.connect(address.text);
      if (!mounted) return;
      if (!widget.first) Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (caught) {
      setState(() => error = caught.message);
    } catch (_) {
      setState(() => error = 'This address does not look like an Al Zaujain website.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final insecure = address.text.trim().toLowerCase().startsWith('http://');
    return Scaffold(
      backgroundColor: AppColors.navy,
      appBar: widget.first ? null : AppBar(title: Text(tr('Change website'))),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(children: [
                Container(padding: const EdgeInsets.all(6), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Image.asset('assets/images/logo.png', width: 92, height: 92)),
                const SizedBox(height: 14),
                Text(tr('AL ZAUJAIN'), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                Text(tr('INTERNATIONAL MARRIAGE CONSULTANCY'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.champagne, fontSize: 10, letterSpacing: 1.4)),
                const UrduLine('رشتوں کا نیا سفر، اب آپ کے موبائل پر', size: 18, color: AppColors.champagne, align: TextAlign.center),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(tr('Welcome to Al Zaujain'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Tx(tr('Enter the address of the Al Zaujain website to connect this app.'), style: const TextStyle(fontSize: 13.5, color: AppColors.muted, height: 1.5)),
                    const SizedBox(height: 18),
                    Text(tr('Website address'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: address,
                      keyboardType: TextInputType.url,
                      autocorrect: false,
                      textInputAction: TextInputAction.go,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _connect(),
                      decoration: const InputDecoration(hintText: 'https://example.com', prefixIcon: Icon(Icons.language_rounded)),
                    ),
                    if (insecure) ...[const SizedBox(height: 10), const Notice('This address uses http, so data is not encrypted. Use https on a live website.', warning: true)],
                    if (error != null) ...[const SizedBox(height: 12), Notice(error!)],
                    const SizedBox(height: 18),
                    AppButton(busy ? 'Connecting…' : 'Connect', tone: Tone.gold, expand: true, busy: busy, icon: Icons.link_rounded, onPressed: address.text.trim().isEmpty ? null : _connect),
                    const SizedBox(height: 12),
                    Tx(tr(app.signedIn ? 'Changing the website signs you out of this app.' : 'You can change this later in Settings.'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  ]),
                ),
                const SizedBox(height: 18),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  for (final (code, label) in [('en', 'English'), ('ur', 'اردو')])
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: ChoiceChip(
                        label: Text(label),
                        selected: app.lang == code,
                        onSelected: (_) => app.setLanguage(code).then((_) => setState(() {})),
                        selectedColor: AppColors.gold,
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(fontFamily: code == 'ur' ? 'NotoNaskhArabic' : null, color: AppColors.navy, fontWeight: FontWeight.w600),
                      ),
                    ),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

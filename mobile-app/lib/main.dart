import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';

import 'core/app_state.dart';
import 'core/theme.dart';
import 'screens/setup_screen.dart';
import 'screens/shell.dart';
import 'widgets/common.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.light));
  await app.init();
  runApp(const AlZaujainApp());
  // Test builds expose the accessibility tree, so automated browser tests can find buttons by name.
  if (const bool.fromEnvironment('AZ_SEMANTICS')) SemanticsBinding.instance.ensureSemantics();
}

class AlZaujainApp extends StatelessWidget {
  const AlZaujainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) => MaterialApp(
        title: 'Al Zaujain',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        // Urdu turns the whole app right-to-left, as on the website. Switching language redraws every screen.
        builder: (context, child) => Directionality(textDirection: app.t.isUrdu ? TextDirection.rtl : TextDirection.ltr, child: KeyedSubtree(key: ValueKey(app.lang), child: child!)),
        home: const _Start(),
      ),
    );
  }
}

/// Opens the setup screen until a website is connected, then the app itself.
class _Start extends StatefulWidget {
  const _Start();

  @override
  State<_Start> createState() => _StartState();
}

class _StartState extends State<_Start> {
  Object? error;
  bool loading = false;

  @override
  void initState() {
    super.initState();
    if (app.domain != null) _load();
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      await app.load();
    } catch (caught) {
      error = caught;
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: app, builder: (context, _) => _screen(context));

  Widget _screen(BuildContext context) {
    if (app.domain == null) return const SetupScreen(first: true);
    if (app.connected) return Shell();
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(padding: const EdgeInsets.all(6), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Image.asset('assets/images/logo.png', width: 96, height: 96)),
              const SizedBox(height: 18),
              Text(tr('AL ZAUJAIN'), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
              Text(tr('INTERNATIONAL MARRIAGE CONSULTANCY'), style: const TextStyle(color: AppColors.champagne, fontSize: 10, letterSpacing: 1.4)),
              const SizedBox(height: 30),
              if (loading || error == null)
                const CircularProgressIndicator(color: AppColors.goldSoft)
              else ...[
                Tx(tr(error.toString()), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFC7D3DD), height: 1.5)),
                const SizedBox(height: 18),
                AppButton('Try again', tone: Tone.gold, icon: Icons.refresh_rounded, onPressed: _load),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => push(context, const SetupScreen()),
                  child: Text(tr('Change website'), style: const TextStyle(color: AppColors.champagne)),
                ),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}

import 'dart:math';

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';
import 'shell.dart';

/// The website's AuthCard: a navy band with the emblem and a white form card.
class _AuthPage extends StatelessWidget {
  const _AuthPage({required this.title, required this.text, required this.children});
  final String title;
  final String text;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 30), children: [
          Center(child: Container(padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Image.asset('assets/images/logo.png', width: 70, height: 70))),
          const SizedBox(height: 12),
          Text(tr(title), textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Tx(tr(text), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13.5, color: AppColors.muted)),
          const SizedBox(height: 18),
          Panel(child: AutofillGroup(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children))),
        ]),
      ),
    );
  }
}

/// After signing in: go back to where the visitor was, or open a screen they asked for.
void _afterSignIn(BuildContext context, Widget? then, bool replace) {
  final navigator = Navigator.of(context);
  if (then != null) {
    if (replace) {
      navigator.pop();
      navigator.pushReplacement(MaterialPageRoute(builder: (_) => then));
    } else {
      navigator.pushReplacement(MaterialPageRoute(builder: (_) => then));
    }
  } else {
    navigator.popUntil((route) => route.isFirst);
    shellKey.currentState?.select(Tabs.account);
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.then, this.replace = false});
  final Widget? then;
  final bool replace;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool hidden = true;
  bool busy = false;
  String? error;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() { busy = true; error = null; });
    try {
      final result = await app.api.post('auth/login', {'email': email.text, 'password': password.text});
      await app.signedInWith(result);
      if (mounted) _afterSignIn(context, widget.then, widget.replace);
    } on ApiException catch (caught) {
      setState(() => error = caught.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthPage(title: 'Welcome back', text: 'Sign in to manage your profile, matches and messages.', children: [
      TextInput(label: 'Email', controller: email, keyboard: TextInputType.emailAddress, autofill: const [AutofillHints.email]),
      TextInput(
        label: 'Password',
        controller: password,
        obscure: hidden,
        autofill: const [AutofillHints.password],
        suffix: IconButton(icon: Icon(hidden ? Icons.visibility_rounded : Icons.visibility_off_rounded), onPressed: () => setState(() => hidden = !hidden)),
      ),
      if (error != null) ...[Notice(error!), const SizedBox(height: 12)],
      AppButton(busy ? 'Signing in…' : 'Sign in', expand: true, busy: busy, onPressed: _submit),
      const SizedBox(height: 12),
      Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
        TextButton(onPressed: () => push(context, const ForgotPasswordScreen()), child: Text(tr('Forgot password?'), style: const TextStyle(fontWeight: FontWeight.w600))),
        Text(tr('· New here?')),
        TextButton(onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => RegisterScreen(then: widget.then))), child: Text(tr('Create an account'), style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
    ]);
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.claim, this.then});
  final String? claim;
  final Widget? then;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  static const digits = '23456789';
  static const symbols = '!@#\$%&*?';
  final random = Random.secure();
  final name = TextEditingController();
  final email = TextEditingController();
  final phone = TextEditingController();
  late final password = TextEditingController(text: _generate());
  bool editing = false;
  bool visible = true;
  bool busy = false;
  String? error;

  // Made on the phone, so the password never travels in a server response.
  String _generate([int length = 16]) {
    String pick(String set) => set[random.nextInt(set.length)];
    const all = letters + digits + symbols;
    final chars = [pick(letters), pick(digits), pick(symbols), for (var i = 0; i < length - 3; i++) pick(all)]..shuffle(random);
    return chars.join();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() { busy = true; error = null; });
    try {
      final result = await app.api.post('auth/register', {'name': name.text, 'email': email.text, 'phone': phone.text, 'password': password.text, if (widget.claim != null) 'claim': widget.claim});
      await app.signedInWith(result);
      if (mounted) {
        showMessage(context, 'Your account is ready. Create your matrimonial biodata to start receiving proposals.');
        _afterSignIn(context, widget.then, false);
      }
    } on ApiException catch (caught) {
      setState(() => error = caught.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AuthPage(title: 'Join Al Zaujain', text: 'Your account is ready in seconds. We create a strong password for you.', children: [
      TextInput(label: 'Your name', controller: name, maxLength: 100, autofill: const [AutofillHints.name]),
      TextInput(label: 'Email', controller: email, keyboard: TextInputType.emailAddress, autofill: const [AutofillHints.email]),
      TextInput(label: 'Phone / WhatsApp', controller: phone, keyboard: TextInputType.phone, placeholder: '0300 1234567', autofill: const [AutofillHints.telephoneNumber]),
      Container(
        padding: const EdgeInsets.all(14),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.sandLine)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr('Your password'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
            controller: password,
            readOnly: !editing,
            obscureText: !visible,
            autofillHints: const [AutofillHints.newPassword],
            style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
            decoration: InputDecoration(
              fillColor: Colors.white,
              suffixIcon: Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(icon: Icon(visible ? Icons.visibility_off_rounded : Icons.visibility_rounded), onPressed: () => setState(() => visible = !visible)),
                IconButton(icon: const Icon(Icons.copy_rounded), tooltip: tr('Copy password'), onPressed: () => copyText(context, password.text, 'Password copied.')),
              ]),
            ),
          ),
          const SizedBox(height: 6),
          Tx(tr('We made a strong password for you. Save it somewhere safe, or choose your own.'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          Row(children: [
            TextButton.icon(onPressed: () => setState(() { password.text = _generate(); editing = false; visible = true; }), icon: const Icon(Icons.autorenew_rounded, size: 16), label: Text(tr('New password'))),
            TextButton.icon(onPressed: () => setState(() { editing = true; password.clear(); }), icon: const Icon(Icons.edit_rounded, size: 16), label: Text(tr('Use my own'))),
          ]),
        ]),
      ),
      if (error != null) ...[Notice(error!), const SizedBox(height: 12)],
      AppButton(busy ? 'Creating your account…' : 'Create my account', expand: true, busy: busy, onPressed: _submit),
      const SizedBox(height: 10),
      Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
        Text(tr('Already registered?')),
        TextButton(onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen(then: widget.then))), child: Text(tr('Sign in'), style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
    ]);
  }
}

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final email = TextEditingController();
  bool busy = false;
  String? message;
  bool ok = false;

  @override
  Widget build(BuildContext context) {
    return _AuthPage(title: 'Reset your password', text: 'Enter your email and we will send you a link to choose a new password.', children: [
      TextInput(label: 'Email', controller: email, keyboard: TextInputType.emailAddress, autofill: const [AutofillHints.email]),
      if (message != null) ...[Notice(message!, ok: ok), const SizedBox(height: 12)],
      AppButton(busy ? 'Sending…' : 'Send reset link', expand: true, busy: busy, onPressed: () async {
        setState(() { busy = true; message = null; });
        try {
          final result = await app.api.post('auth/forgot', {'email': email.text});
          ok = true;
          message = '${result['message']}';
        } on ApiException catch (error) {
          ok = false;
          message = error.message;
        } finally {
          if (mounted) setState(() => busy = false);
        }
      }),
      const SizedBox(height: 10),
      Tx(tr('The link opens on the website, where you choose the new password. Then sign in here with it.'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
    ]);
  }
}

/// Shown on screens that need an account.
class SignInPrompt extends StatelessWidget {
  const SignInPrompt({super.key, required this.icon, required this.title, required this.text});
  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      EmptyState(
        icon: icon,
        title: title,
        text: text,
        action: Column(children: [
          AppButton('Sign in', expand: true, onPressed: () => push(context, const LoginScreen())),
          const SizedBox(height: 10),
          AppButton('Create an account', tone: Tone.outline, expand: true, onPressed: () => push(context, const RegisterScreen())),
        ]),
      ),
    ]);
  }
}

/// A password field used by the account settings.
class PasswordInput extends StatefulWidget {
  const PasswordInput({super.key, required this.label, required this.controller, this.newPassword = false});
  final String label;
  final TextEditingController controller;
  final bool newPassword;
  @override
  State<PasswordInput> createState() => _PasswordInputState();
}

class _PasswordInputState extends State<PasswordInput> {
  bool hidden = true;
  @override
  Widget build(BuildContext context) => TextInput(
        label: widget.label,
        controller: widget.controller,
        obscure: hidden,
        autofill: [widget.newPassword ? AutofillHints.newPassword : AutofillHints.password],
        suffix: IconButton(icon: Icon(hidden ? Icons.visibility_rounded : Icons.visibility_off_rounded), onPressed: () => setState(() => hidden = !hidden)),
      );
}

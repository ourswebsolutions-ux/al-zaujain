import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';
import '../widgets/export.dart';
import 'auth_screens.dart';
import 'profile_form_screen.dart';
import 'profile_screen.dart';

/// "My matrimonial profile": every profile on the member's account, then the chosen one in full.
class MyProfilesScreen extends StatelessWidget {
  const MyProfilesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('My matrimonial profile'))),
      body: Loader(
        load: () => app.api.get('my/profiles'),
        builder: (context, data, reload) {
          final profiles = rowsOf(data['profiles']);
          if (profiles.isEmpty) {
            return EmptyState(
              icon: Icons.badge_rounded,
              title: 'You have not created a biodata yet',
              text: 'It takes a few minutes, and our team reviews every profile before it goes live.',
              action: AppButton('Create my biodata', tone: Tone.gold, onPressed: () async {
                await push(context, const ProfileFormScreen());
                reload();
              }),
            );
          }
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const PageIntro('My matrimonial profile', text: 'Your biodata, its review status, and your copy, image and PDF downloads.'),
            for (final profile in profiles)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Material(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE7E9EE))),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: SizedBox(width: 56, height: 56, child: NetImage(profile['photo'] as String?, radius: 28)),
                    title: Text('${profile['name']} · ${profile['code']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Padding(padding: const EdgeInsets.only(top: 6), child: Wrap(spacing: 6, runSpacing: 6, children: [statusPill('${profile['status']}'), Pill(tr('{percent}% complete', {'percent': (profile['completion'] as Map?)?['percent'] ?? 0}))])),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () async {
                      await push(context, MyProfileScreen(code: '${profile['code']}'));
                      reload();
                    },
                  ),
                ),
              ),
            const SizedBox(height: 6),
            AppButton('Add another profile', tone: Tone.outline, icon: Icons.add_rounded, onPressed: () async {
              await push(context, const ProfileFormScreen());
              reload();
            }),
          ]);
        },
      ),
    );
  }
}

Widget statusPill(String status) => switch (status) {
      'approved' => Pill('Approved and live', color: AppColors.green, background: AppColors.greenBg),
      'rejected' => Pill('Not approved', color: AppColors.red, background: AppColors.redBg),
      _ => Pill('Waiting for review'),
    };

class MyProfileScreen extends StatelessWidget {
  const MyProfileScreen({super.key, required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(title: Text(tr('My matrimonial profile'))),
      body: Loader(load: () => app.api.get('my/profiles/$code', {'lang': app.lang}), builder: (context, data, reload) => ProfilePanel(data: data, reload: reload)),
    );
  }
}

/// The page behind the private link emailed after submitting without an account.
class ManageScreen extends StatelessWidget {
  const ManageScreen({super.key, required this.token});
  final String token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(title: Text(tr('Your profile'))),
      body: Loader(load: () => app.api.get('manage/${Uri.encodeComponent(token)}', {'lang': app.lang}), builder: (context, data, reload) => ProfilePanel(data: data, reload: reload, token: token)),
    );
  }
}

/// Status, downloads, edit, delete and the full private biodata: the website's ManagePanel.
class ProfilePanel extends StatelessWidget {
  const ProfilePanel({super.key, required this.data, required this.reload, this.token});
  final Json data;
  final Future<void> Function() reload;
  final String? token;

  Json get profile => (data['profile'] as Map).cast<String, dynamic>();
  Json get biodata => (data['biodata'] as Map).cast<String, dynamic>();

  static const review = {
    'pending': ('Waiting for review', 'Our team will review this profile shortly. It is not public yet.', Icons.schedule_rounded, AppColors.goldText),
    'approved': ('Approved and live', 'This profile appears in Al Zaujain proposals.', Icons.check_circle_rounded, AppColors.green),
    'rejected': ('Not approved', 'Please update your details or contact our team.', Icons.cancel_rounded, AppColors.red),
  };
  static const verification = {
    'not_submitted': ('CNIC not submitted', 'Upload your CNIC to become eligible for the blue tick.', Icons.badge_rounded, AppColors.muted),
    'pending': ('Verification pending', 'Our team is reviewing your CNIC privately.', Icons.schedule_rounded, AppColors.goldText),
    'verified': ('Verified', 'This profile shows the blue verified tick.', Icons.check_circle_rounded, AppColors.verified),
    'rejected': ('Verification rejected', 'Please upload a clearer CNIC from the edit page.', Icons.cancel_rounded, AppColors.red),
  };

  Widget _status(String title, (String, String, IconData, Color) item, Object? note) {
    return Panel(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(tr(title), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1, color: AppColors.muted)),
        const SizedBox(height: 6),
        Row(children: [Icon(item.$3, color: item.$4, size: 18), const SizedBox(width: 6), Expanded(child: Text(tr(item.$1), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: item.$4)))]),
        const SizedBox(height: 4),
        Tx(tr(note == null || '$note'.isEmpty ? item.$2 : '$note'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5)),
      ]),
    );
  }

  Future<void> _delete(BuildContext context) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (dialog) => AlertDialog(
        title: Text(tr('Delete profile')),
        content: Text(tr('This also removes its photos and CNIC.')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialog, false), child: Text(tr('Cancel'))),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppColors.red), onPressed: () => Navigator.pop(dialog, true), child: Text(tr('Yes, delete permanently'))),
        ],
      ),
    );
    if (yes != true || !context.mounted) return;
    try {
      await app.api.delete('profiles/${profile['code']}', {if (token != null) 'token': token});
      if (token != null) await app.forgetManageLink(token!);
      if (context.mounted) {
        showMessage(context, 'The profile has been deleted.');
        Navigator.pop(context);
      }
    } on ApiException catch (error) {
      if (context.mounted) showMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = rowsOf(data['photos']);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      if (token != null)
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.cream, borderRadius: BorderRadius.circular(16)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.green),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${tr('Your profile')} ${profile['code']}', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
              Tx(tr('Keep this page’s link private: it is how you view, edit and download this profile. We have also emailed it to you.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5)),
            ])),
          ]),
        ),
      _status('PROFILE STATUS', review['${profile['status']}'] ?? review['pending']!, profile['rejectionReason']),
      const SizedBox(height: 12),
      _status('VERIFICATION', verification['${profile['verification']}'] ?? verification['not_submitted']!, profile['verificationNote']),
      const SizedBox(height: 12),
      if (token != null && profile['claimed'] != true) ...[
        Panel(
          color: AppColors.sand,
          borderColor: AppColors.sandLine,
          title: 'Manage this profile from an account',
          child: app.signedIn
              ? AppButton('Add to my account', onPressed: () async {
                  try {
                    final result = await app.api.post('manage/${Uri.encodeComponent(token!)}/claim');
                    if (context.mounted) showMessage(context, '${result['message']}');
                    reload();
                  } on ApiException catch (error) {
                    if (context.mounted) showMessage(context, error.message, error: true);
                  }
                })
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Tx(tr('Create an account from here and this profile is added to it automatically.'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                  const SizedBox(height: 10),
                  Wrap(spacing: 10, runSpacing: 10, children: [
                    AppButton('Create account', small: true, onPressed: () => push(context, RegisterScreen(claim: token, then: ManageScreen(token: token!)))),
                    AppButton('Sign in', small: true, tone: Tone.outline, onPressed: () => push(context, LoginScreen(then: ManageScreen(token: token!)))),
                  ]),
                ]),
        ),
        const SizedBox(height: 12),
      ],
      Panel(
        title: 'Copy or download your biodata',
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Tx(tr('These copies include your private details, so share them carefully.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
          const SizedBox(height: 12),
          BiodataActions(data: biodata, text: '${data['text']}', subtitle: ((data['subtitle'] as List?) ?? []).map((item) => '$item').toList(), photo: photos.isEmpty ? null : '${photos.first['file']}', private: true),
        ]),
      ),
      const SizedBox(height: 14),
      Wrap(spacing: 10, runSpacing: 10, crossAxisAlignment: WrapCrossAlignment.center, children: [
        AppButton('Edit profile', icon: Icons.edit_rounded, onPressed: () async {
          final saved = await push<bool>(context, ProfileFormScreen(
            code: '${profile['code']}',
            token: token,
            initial: ((data['values'] as Map?) ?? const {}).cast<String, dynamic>(),
            photos: photos,
            photoPublic: profile['photoPublic'] != false,
            verification: '${profile['verification']}',
          ));
          if (saved == true) reload();
        }),
        if (profile['status'] == 'approved') AppButton('View public page', tone: Tone.outline, onPressed: () => push(context, ProfileScreen(code: '${profile['code']}'))),
        TextButton.icon(onPressed: () => _delete(context), icon: const Icon(Icons.delete_outline_rounded, color: AppColors.red, size: 18), label: Text(tr('Delete profile'), style: const TextStyle(color: AppColors.red, fontWeight: FontWeight.w600))),
      ]),
      const SizedBox(height: 16),
      Tx(tr('This is your full biodata. Your private details appear only here and in your own downloads.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
      const SizedBox(height: 10),
      Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE7E9EE))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          BiodataHeader(data: biodata),
          if (photos.isNotEmpty)
            SizedBox(
              height: 110,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(12),
                itemCount: photos.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) => GestureDetector(
                  onTap: () => push(context, PhotoViewer(paths: photos.map((photo) => '${photo['file']}').toList(), start: index)),
                  child: NetImage('${photos[index]['thumb']}', width: 86, height: 86, radius: 10),
                ),
              ),
            ),
          Padding(padding: const EdgeInsets.all(16), child: CandidateSection(data: biodata)),
          PartnerSection(data: biodata),
        ]),
      ),
    ]);
  }
}

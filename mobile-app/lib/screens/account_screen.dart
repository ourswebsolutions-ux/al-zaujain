import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import 'auth_screens.dart';
import 'consultants_screen.dart';
import 'home_screen.dart';
import 'info_screens.dart';
import 'member_screens.dart';
import 'my_profile_screen.dart';
import 'payments_screen.dart';
import 'preferences_screen.dart';
import 'profile_form_screen.dart';
import 'shell.dart';

/// The Account tab: the member dashboard and every member page, or sign-in for visitors.
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: Text(tr(app.signedIn ? 'My account' : 'Account')), actions: [
          IconButton(tooltip: tr('Settings'), icon: const Icon(Icons.settings_rounded), onPressed: () => push(context, const AppSettingsScreen())),
        ]),
        body: app.signedIn ? (app.isMember ? const DashboardView() : const _StaffView()) : const _VisitorView(),
      ),
    );
  }
}

class _Menu extends StatelessWidget {
  const _Menu({required this.items});
  final List<(IconData, String, VoidCallback, int)> items;

  @override
  Widget build(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(children: [
        for (var i = 0; i < items.length; i++) ...[
          ListTile(
            leading: Icon(items[i].$1, color: const Color(0xFFA67B2E)),
            title: Text(tr(items[i].$2), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500)),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              if (items[i].$4 > 0) Badge(label: Text('${items[i].$4}'), backgroundColor: AppColors.gold, textColor: AppColors.dark),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
            ]),
            onTap: items[i].$3,
          ),
          if (i < items.length - 1) const Divider(indent: 56),
        ],
      ]),
    );
  }
}

class _VisitorView extends StatelessWidget {
  const _VisitorView();

  @override
  Widget build(BuildContext context) {
    final links = app.manageLinks;
    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(color: AppColors.navy, borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const UrduLine('السلام علیکم', size: 15, color: AppColors.champagne),
          Text(tr('Welcome to Al Zaujain'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Tx(tr('Sign in to manage your profile, matches and messages.'), style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 13, height: 1.5)),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: AppButton('Sign in', tone: Tone.gold, onPressed: () => push(context, const LoginScreen()))),
            const SizedBox(width: 10),
            Expanded(child: AppButton('Register now', tone: Tone.light, onPressed: () => push(context, const RegisterScreen()))),
          ]),
        ]),
      ),
      const SizedBox(height: 16),
      _Menu(items: [
        (Icons.person_add_alt_1_rounded, 'Submit a profile', () => openProfileForm(context), 0),
        (Icons.travel_explore_rounded, 'Browse proposals', () => shellKey.currentState?.showProposals(), 0),
        (Icons.support_agent_rounded, 'Marriage consultants', () => push(context, const ConsultantsScreen()), 0),
        (Icons.link_rounded, 'Open the private link', () => push(context, const ManageLinksScreen()), links.length),
        (Icons.headset_mic_rounded, 'Contact us', () => push(context, const ContactScreen()), 0),
      ]),
      const SizedBox(height: 16),
      const _InfoMenu(),
    ]);
  }
}

class _InfoMenu extends StatelessWidget {
  const _InfoMenu();
  @override
  Widget build(BuildContext context) => _Menu(items: [
        (Icons.translate_rounded, 'Language', () => push(context, const AppSettingsScreen()), 0),
        (Icons.privacy_tip_rounded, 'Privacy policy', () => push(context, const LegalScreen(kind: 'privacy')), 0),
        (Icons.gavel_rounded, 'Terms of use', () => push(context, const LegalScreen(kind: 'terms')), 0),
      ]);
}

/// Administrators and consultants run the bureau from the website's panels.
class _StaffView extends StatelessWidget {
  const _StaffView();
  @override
  Widget build(BuildContext context) {
    final role = app.user?['role'];
    return ListView(padding: const EdgeInsets.all(16), children: [
      EmptyState(
        icon: Icons.admin_panel_settings_rounded,
        title: tr('Welcome back, {name}', {'name': '${app.user?['name']}'.split(' ').first}),
        text: 'Staff panels are available on the website.',
        action: AppButton('Open the website', icon: Icons.open_in_new_rounded, onPressed: () => openLink(context, '${app.domain}${role == 'admin' ? '/admin' : '/consultant'}')),
      ),
      const SizedBox(height: 16),
      _Menu(items: [
        (Icons.chat_bubble_rounded, 'Messages', () => shellKey.currentState?.select(2), app.unreadMessages),
        (Icons.notifications_rounded, 'Notifications', () => push(context, const NotificationsScreen()), app.unreadNotifications),
        (Icons.manage_accounts_rounded, 'Account settings', () => push(context, const AccountSettingsScreen()), 0),
      ]),
      const SizedBox(height: 16),
      AppButton('Sign out', tone: Tone.outline, icon: Icons.logout_rounded, expand: true, onPressed: () => app.signOut()),
    ]);
  }
}

/// The member dashboard: greeting, completion, stats, matches, verification and every member page.
class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  static const verification = {
    'verified': (Icons.verified_rounded, AppColors.verified, 'Verified', 'Your profile shows the blue tick.'),
    'pending': (Icons.schedule_rounded, Color(0xFFA67B2E), 'Verification pending', 'Our team is reviewing your CNIC privately.'),
    'rejected': (Icons.error_rounded, AppColors.red, 'Verification needs attention', 'Please upload a clearer copy of your CNIC.'),
    'not_submitted': (Icons.badge_rounded, AppColors.muted, 'Not verified yet', 'Upload your CNIC to earn the blue tick.'),
  };
  static const review = {'approved': 'Your profile is live.', 'pending': 'Your profile is under review.', 'rejected': 'Your profile needs attention.'};

  @override
  Widget build(BuildContext context) {
    return Loader(
      key: ValueKey(app.unreadMessages + app.unreadNotifications),
      load: () async {
        app.refreshAccount();
        return app.api.get('dashboard');
      },
      builder: (context, data, reload) {
        final primary = (data['primary'] as Map?)?.cast<String, dynamic>();
        final completion = (primary?['completion'] as Map?)?.cast<String, dynamic>();
        final missing = rowsOf(completion?['missing']);
        final matches = rowsOf(data['matches']);
        final views = (data['views'] as Map?) ?? const {};
        final ver = verification['${primary?['verification'] ?? 'not_submitted'}'] ?? verification['not_submitted']!;
        final consultant = (primary?['consultant'] as Map?)?.cast<String, dynamic>();
        void open(Widget screen) => push(context, screen).then((_) => reload());
        Widget missingTarget(Json item) => item['href'] == 'preferences' ? const PreferencesScreen() : (primary == null ? const ProfileFormScreen() : MyProfileScreen(code: '${primary['code']}'));
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(color: AppColors.navy, borderRadius: BorderRadius.circular(20), boxShadow: const [BoxShadow(color: Color(0x3303223F), blurRadius: 44, offset: Offset(0, 18))]),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const UrduLine('السلام علیکم', size: 15, color: AppColors.champagne),
              Text(tr('Welcome back, {name}', {'name': '${app.user?['name'] ?? ''}'.split(' ').first}), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Tx(tr(primary == null ? 'Create your matrimonial biodata to start receiving proposals.' : review['${primary['status']}'] ?? ''), style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 13, height: 1.5)),
              if (completion != null) ...[
                const SizedBox(height: 16),
                Row(children: [
                  SizedBox(
                    width: 58,
                    height: 58,
                    child: Stack(alignment: Alignment.center, children: [
                      CircularProgressIndicator(value: ((completion['percent'] as num?) ?? 0) / 100, strokeWidth: 6, backgroundColor: Colors.white24, color: AppColors.goldSoft),
                      Text('${completion['percent']}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                  const SizedBox(width: 12),
                  Text(tr('Profile completion'), style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 12.5)),
                ]),
              ],
              const SizedBox(height: 16),
              if (primary == null)
                AppButton('Create my biodata', tone: Tone.gold, trailing: Icons.arrow_forward_rounded, onPressed: () => open(const ProfileFormScreen()))
              else if (missing.isNotEmpty)
                AppButton('Complete my profile', tone: Tone.gold, trailing: Icons.arrow_forward_rounded, onPressed: () => open(missingTarget(missing.first))),
            ]),
          ),
          const SizedBox(height: 14),
          const WhatsAppChannelCard(compact: true),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.45,
            children: [
              _Stat(icon: Icons.visibility_rounded, label: 'Profile views', value: '${views['total'] ?? 0}', note: tr('{count} in the last 7 days', {'count': views['lastWeek'] ?? 0}), onTap: () => open(const ViewsScreen())),
              _Stat(icon: Icons.favorite_rounded, label: 'Matching proposals', value: '${data['matchCount'] ?? 0}', note: tr((data['profileCount'] ?? 0) == 0 ? 'After your profile is live' : 'Ranked for your profile'), onTap: () => open(const MatchesScreen())),
              _Stat(icon: Icons.bookmark_rounded, label: 'Saved profiles', value: '${data['savedCount'] ?? 0}', note: tr('Your shortlist'), onTap: () => shellKey.currentState?.select(3)),
              _Stat(icon: Icons.chat_bubble_rounded, label: 'Unread messages', value: '${data['unreadMessages'] ?? 0}', note: tr('In your inbox'), onTap: () => shellKey.currentState?.select(2)),
            ],
          ),
          const SizedBox(height: 18),
          Row(children: [
            Expanded(child: Text(tr('Recommended matches'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
            if (matches.isNotEmpty) TextButton(onPressed: () => open(const MatchesScreen()), child: Text(tr('View all'))),
          ]),
          if (matches.isEmpty)
            const EmptyState(icon: Icons.favorite_border_rounded, title: 'Your matches will appear here', text: 'Once your profile is approved, we will rank suitable proposals for you.')
          else
            SizedBox(
              height: 290,
              child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: matches.length, separatorBuilder: (_, _) => const SizedBox(width: 10), itemBuilder: (context, index) => MatchCard(card: matches[index], width: 190)),
            ),
          const SizedBox(height: 16),
          Panel(
            title: 'Verification status',
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Icon(ver.$1, color: ver.$2, size: 18), const SizedBox(width: 6), Text(tr(ver.$3), style: TextStyle(fontWeight: FontWeight.w600, color: ver.$2))]),
              const SizedBox(height: 4),
              Tx(tr(ver.$4), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
              if (primary != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(tr('Profile ID {code}', {'code': primary['code']}), style: const TextStyle(fontSize: 11, color: AppColors.muted))),
            ]),
          ),
          if (missing.isNotEmpty) ...[
            const SizedBox(height: 12),
            Panel(
              title: 'Finish your profile',
              child: Column(children: [
                for (final item in missing.take(4))
                  ListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text(tr('${item['label']}')), trailing: const Icon(Icons.arrow_forward_rounded, size: 16), onTap: () => open(missingTarget(item))),
              ]),
            ),
          ],
          if (consultant != null) ...[
            const SizedBox(height: 12),
            Panel(
              title: 'Your consultant',
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.support_agent_rounded, color: Color(0xFFA67B2E)),
                title: Text('${consultant['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: consultant['title'] == null ? null : Text(tr('${consultant['title']}')),
                trailing: TextButton(onPressed: () => push(context, ConsultantScreen(slug: '${consultant['slug']}')), child: Text(tr('View consultant'))),
              ),
            ),
          ],
          const SizedBox(height: 16),
          _Menu(items: [
            (Icons.badge_rounded, 'My matrimonial profile', () => open(const MyProfilesScreen()), 0),
            (Icons.edit_rounded, 'Edit profile', () => open(primary == null ? const ProfileFormScreen() : MyProfileScreen(code: '${primary['code']}')), 0),
            (Icons.tune_rounded, 'Partner preferences', () => open(const PreferencesScreen()), 0),
            (Icons.favorite_rounded, 'Recommended matches', () => open(const MatchesScreen()), 0),
            (Icons.visibility_rounded, 'Profile views', () => open(const ViewsScreen()), 0),
            (Icons.notifications_rounded, 'Notifications', () => open(const NotificationsScreen()), app.unreadNotifications),
            (Icons.account_balance_wallet_rounded, 'My Payment Status', () => open(const PaymentsScreen()), 0),
            (Icons.manage_accounts_rounded, 'Account settings', () => open(const AccountSettingsScreen()), 0),
          ]),
          const SizedBox(height: 16),
          _Menu(items: [
            (Icons.support_agent_rounded, 'Marriage consultants', () => push(context, const ConsultantsScreen()), 0),
            (Icons.link_rounded, 'Open the private link', () => push(context, const ManageLinksScreen()), app.manageLinks.length),
            (Icons.headset_mic_rounded, 'Contact us', () => push(context, const ContactScreen()), 0),
          ]),
          const SizedBox(height: 16),
          const _InfoMenu(),
          const SizedBox(height: 16),
          AppButton('Sign out', tone: Tone.outline, icon: Icons.logout_rounded, expand: true, onPressed: () => app.signOut()),
        ]);
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.label, required this.value, required this.note, required this.onTap});
  final IconData icon;
  final String label;
  final String value;
  final String note;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE7E9EE))),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [Icon(icon, size: 17, color: const Color(0xFFA67B2E)), const SizedBox(width: 6), Expanded(child: Text(tr(label), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppColors.muted)))]),
            Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
            Text(note, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          ]),
        ),
      ),
    );
  }
}

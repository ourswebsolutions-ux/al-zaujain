import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';
import 'auth_screens.dart';
import 'chat_screen.dart';
import 'my_profile_screen.dart';
import 'payments_screen.dart';
import 'preferences_screen.dart';
import 'profile_form_screen.dart';
import 'profile_screen.dart';
import 'saved_screen.dart';
import 'shell.dart';

/// Opens the app screen for a website link stored on a notification, such as /messages/12.
void openHref(BuildContext context, String? href) {
  if (href == null || href.isEmpty) return;
  final path = Uri.parse(href).path;
  final chat = RegExp(r'^/messages/(\d+)').firstMatch(path);
  final profile = RegExp(r'^/profile/(AZ-\d+)', caseSensitive: false).firstMatch(path);
  if (chat != null) {
    push(context, ChatScreen(id: int.parse(chat[1]!)));
  } else if (path == '/messages') {
    Navigator.of(context).popUntil((route) => route.isFirst);
    shellKey.currentState?.select(Tabs.messages);
  } else if (profile != null) {
    openProposal(context, profile[1]!.toUpperCase());
  } else if (path.startsWith('/dashboard/payments')) {
    push(context, const PaymentsScreen());
  } else if (path.startsWith('/dashboard/matches')) {
    push(context, const MatchesScreen());
  } else if (path.startsWith('/dashboard/preferences')) {
    push(context, const PreferencesScreen());
  } else if (path.startsWith('/dashboard/views')) {
    push(context, const ViewsScreen());
  } else if (path.startsWith('/dashboard/saved')) {
    push(context, const SavedScreen());
  } else if (path.startsWith('/dashboard/edit') || path.startsWith('/dashboard/profile')) {
    push(context, const MyProfilesScreen());
  } else if (path.startsWith('/dashboard')) {
    Navigator.of(context).popUntil((route) => route.isFirst);
    shellKey.currentState?.select(Tabs.account);
  } else {
    openLink(context, app.api.absolute(href));
  }
}

/// The Matches tab: recommended matches for members, a sign-in prompt for visitors.
class MatchesTab extends StatelessWidget {
  const MatchesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) {
        if (app.isMember) return MatchesScreen(key: ValueKey(app.api.token), tab: true);
        return Scaffold(
          appBar: AppBar(title: Text(tr('Matches'))),
          body: app.signedIn
              ? EmptyState(icon: Icons.favorite_border_rounded, title: 'Matches are for members', text: 'Team accounts can open every profile from the admin panel.', action: AppButton('Search proposals', tone: Tone.gold, onPressed: () => shellKey.currentState?.select(Tabs.search)))
              : const SignInPrompt(icon: Icons.favorite_border_rounded, title: 'Your recommended matches', text: 'Sign in and add your profile to see proposals ranked for you on both sides.'),
        );
      },
    );
  }
}

class MatchesScreen extends StatelessWidget {
  const MatchesScreen({super.key, this.tab = false});
  final bool tab;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Recommended matches')), automaticallyImplyLeading: !tab),
      body: Loader(
        load: () => app.api.get('matches'),
        builder: (context, data, reload) {
          final matches = rowsOf(data['matches']);
          final hasProfile = data['hasProfile'] == true;
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            PageIntro('Recommended matches', text: hasProfile ? tr('Proposals suited to {name}, ranked by compatibility on both sides.', {'name': data['forName']}) : 'Proposals ranked for your profile.'),
            if (matches.isEmpty)
              EmptyState(
                icon: Icons.favorite_border_rounded,
                title: hasProfile ? 'No matches yet' : 'Your matches are waiting for your profile',
                text: hasProfile ? 'We will notify you when suitable proposals arrive.' : 'Recommendations begin once your profile is approved.',
                action: AppButton(hasProfile ? 'Browse proposals' : 'View my profile', tone: Tone.gold, onPressed: () {
                  if (hasProfile) {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                    shellKey.currentState?.showProposals();
                  } else {
                    push(context, const MyProfilesScreen());
                  }
                }),
              )
            else
              CardGrid(cards: matches, compact: true),
          ]);
        },
      ),
    );
  }
}

class ViewsScreen extends StatelessWidget {
  const ViewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Profile views'))),
      body: Loader(
        load: () => app.api.get('views'),
        builder: (context, data, reload) {
          const intro = PageIntro('Profile views', text: 'Each visitor is counted once a day, so these numbers reflect real interest.');
          if (data['hasProfile'] != true) {
            return Column(children: [
              intro,
              EmptyState(icon: Icons.visibility_rounded, title: 'Nothing to show yet', text: 'You will see who is viewing your profile once it is live.', action: AppButton('Create my biodata', tone: Tone.gold, onPressed: () => push(context, const ProfileFormScreen()))),
            ]);
          }
          final daily = rowsOf(data['daily']);
          final viewers = rowsOf(data['viewers']);
          final top = daily.fold<int>(1, (max, day) => ((day['count'] as num).toInt() > max ? (day['count'] as num).toInt() : max));
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            intro,
            Row(children: [
              Expanded(child: _Total(label: 'Total views', value: '${data['total']}', note: 'Since your profile went live')),
              const SizedBox(width: 10),
              Expanded(child: _Total(label: 'Last 7 days', value: '${data['lastWeek']}', note: 'Unique daily visitors')),
            ]),
            const SizedBox(height: 14),
            Panel(
              title: 'Views over the last 14 days',
              child: SizedBox(
                height: 150,
                child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  for (final day in daily)
                    Expanded(
                      child: Tooltip(
                        message: '${formatDate(day['date'])}: ${day['count']}',
                        child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                          if ((day['count'] as num) > 0) Text('${day['count']}', style: const TextStyle(fontSize: 9.5, color: AppColors.muted)),
                          Container(
                            height: 4 + 110 * ((day['count'] as num).toDouble() / top),
                            margin: const EdgeInsets.symmetric(horizontal: 2.5),
                            decoration: const BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.vertical(top: Radius.circular(4))),
                          ),
                          const SizedBox(height: 4),
                          Text('${DateTime.tryParse('${day['date']}')?.day ?? ''}', style: const TextStyle(fontSize: 9, color: AppColors.muted)),
                        ]),
                      ),
                    ),
                ]),
              ),
            ),
            const SizedBox(height: 14),
            Panel(
              title: 'Recent visitors',
              child: viewers.isEmpty
                  ? Padding(padding: const EdgeInsets.all(16), child: Text(tr('No visitors yet.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)))
                  : Column(children: [
                      for (final item in viewers)
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: SizedBox(width: 42, height: 42, child: NetImage(item['card'] == null || item['card']['photo'] == null ? null : '/media/photos/${item['card']['photo']}', radius: 21)),
                          title: Text(item['card'] != null ? '${item['card']['name']}, ${item['card']['age']}' : tr(item['member'] == true ? 'A member' : 'A visitor'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                          subtitle: Text(item['card'] != null ? placeOf((item['card'] as Map).cast<String, dynamic>()) : tr('Details are private'), style: const TextStyle(fontSize: 12)),
                          trailing: Text(formatDate(item['when'], time: true), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                          onTap: item['card'] == null ? null : () => push(context, ProfileScreen(code: '${item['card']['code']}')),
                        ),
                    ]),
            ),
          ]);
        },
      ),
    );
  }
}

class _Total extends StatelessWidget {
  const _Total({required this.label, required this.value, required this.note});
  final String label;
  final String value;
  final String note;
  @override
  Widget build(BuildContext context) => Panel(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr(label), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
          Text(tr(note), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
        ]),
      );
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  static const icons = {'message': Icons.chat_bubble_rounded, 'match': Icons.favorite_rounded, 'verification': Icons.verified_rounded, 'profile': Icons.badge_rounded, 'consultant': Icons.support_agent_rounded, 'payment': Icons.account_balance_wallet_rounded};

  @override
  Widget build(BuildContext context) {
    final loader = GlobalKey<LoaderState>();
    return Scaffold(
      appBar: AppBar(title: Text(tr('Notifications')), actions: [
        TextButton(
          onPressed: () async {
            await app.api.post('notifications/read');
            await app.refreshAccount();
            loader.currentState?.reload();
          },
          child: Text(tr('Mark all as read'), style: const TextStyle(color: AppColors.champagne)),
        ),
      ]),
      body: Loader(
        key: loader,
        load: () => app.api.get('notifications'),
        builder: (context, data, reload) {
          final items = rowsOf(data['notifications']);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const PageIntro('Notifications', text: 'Updates about your profile, matches, messages and verification.'),
            if (items.isEmpty)
              const EmptyState(icon: Icons.notifications_none_rounded, title: 'You’re all caught up', text: 'New updates will appear here.')
            else
              Panel(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Column(children: [
                  for (final item in items)
                    ListTile(
                      leading: CircleAvatar(backgroundColor: item['read_at'] == null ? AppColors.cream : const Color(0xFFF2F3F6), child: Icon(icons[item['type']] ?? Icons.notifications_rounded, size: 18, color: item['read_at'] == null ? const Color(0xFFA67B2E) : AppColors.muted)),
                      title: Tx(tr('${item['title']}'), style: TextStyle(fontSize: 14, fontWeight: item['read_at'] == null ? FontWeight.w600 : FontWeight.w400)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (item['body'] != null) Tx(tr('${item['body']}'), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5)),
                        Text(formatDate(item['created_at'], time: true), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                      ]),
                      trailing: item['read_at'] == null ? const CircleAvatar(radius: 4, backgroundColor: AppColors.gold) : null,
                      onTap: () async {
                        if (item['read_at'] == null) {
                          app.api.post('notifications/read', {'id': item['id']}).then((_) => app.refreshAccount()).catchError((_) {});
                        }
                        openHref(context, item['href'] as String?);
                        reload();
                      },
                    ),
                ]),
              ),
          ]);
        },
      ),
    );
  }
}

/// Your details, email preferences and privacy, and the password: the website's account settings.
class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});
  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  late final name = TextEditingController(text: '${app.user?['name'] ?? ''}');
  late final phone = TextEditingController(text: '${app.user?['phone'] ?? ''}');
  late String frequency = '${app.user?['matchFrequency'] ?? 'weekly'}';
  late bool showInViews = app.user?['showInViews'] != false;
  final current = TextEditingController();
  final password = TextEditingController();
  final busy = <String>{};
  final notices = <String, (String, bool)>{};

  Future<void> _run(String key, Future<Json> Function() action, [void Function(Json)? done]) async {
    setState(() { busy.add(key); notices.remove(key); });
    try {
      final result = await action();
      done?.call(result);
      notices[key] = ('${result['message']}', true);
    } on ApiException catch (error) {
      notices[key] = (error.message, false);
    } finally {
      if (mounted) setState(() => busy.remove(key));
    }
  }

  Widget _notice(String key) => notices[key] == null ? const SizedBox.shrink() : Padding(padding: const EdgeInsets.only(bottom: 12), child: Notice(notices[key]!.$1, ok: notices[key]!.$2));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Account settings'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const PageIntro('Account settings', text: 'Your details, notification preferences, privacy and password.'),
        Panel(
          title: 'Your details',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextInput(label: 'Name', controller: name, required: true, maxLength: 100),
            TextInput(label: 'Phone', controller: phone, keyboard: TextInputType.phone),
            TextInput(label: 'Email', initial: '${app.user?['email'] ?? ''}', enabled: false),
            _notice('details'),
            Align(alignment: AlignmentDirectional.centerStart, child: AppButton('Save details', busy: busy.contains('details'), onPressed: () => _run('details', () => app.api.post('me/details', {'name': name.text, 'phone': phone.text}), app.updateAccount))),
          ]),
        ),
        const SizedBox(height: 14),
        Panel(
          title: 'Notifications and privacy',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            PickerField(label: 'Email me new matches', options: [Option('daily', tr('Daily')), Option('weekly', tr('Weekly')), Option('off', tr('Never'))], value: frequency, onChanged: (value) => setState(() => frequency = value.isEmpty ? 'off' : value)),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              value: showInViews,
              onChanged: (value) => setState(() => showInViews = value ?? false),
              title: Tx(tr('Show my profile to members whose profiles I visit. Turn this off to appear only as “A member”.'), style: const TextStyle(fontSize: 13)),
            ),
            _notice('notifications'),
            Align(alignment: AlignmentDirectional.centerStart, child: AppButton('Save preferences', busy: busy.contains('notifications'), onPressed: () => _run('notifications', () => app.api.post('me/notifications', {'match_frequency': frequency, 'show_in_views': showInViews}), app.updateAccount))),
          ]),
        ),
        const SizedBox(height: 14),
        Panel(
          title: 'Change password',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            PasswordInput(label: 'Current password', controller: current),
            PasswordInput(label: 'New password', controller: password, newPassword: true),
            _notice('password'),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: AppButton('Change password', busy: busy.contains('password'), onPressed: () => _run('password', () => app.api.post('me/password', {'current': current.text, 'password': password.text}), (result) {
                app.setToken('${result['token']}');
                current.clear();
                password.clear();
              })),
            ),
          ]),
        ),
      ]),
    );
  }
}

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';
import 'auth_screens.dart';
import 'chat_screen.dart';

/// The inbox: conversations with members and the member's consultant.
class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: Text(tr('Messages'))),
        body: !app.signedIn
            ? const SignInPrompt(icon: Icons.chat_bubble_outline_rounded, title: 'Your conversations will appear here', text: 'Sign in to manage your profile, matches and messages.')
            : Loader(
                key: ValueKey(app.unreadMessages),
                load: () => app.api.get('conversations'),
                builder: (context, data, reload) {
                  final conversations = rowsOf(data['conversations']);
                  return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    const PageIntro('Messages', text: 'Your conversations with members and your consultant.'),
                    if (data['enabled'] == false) ...[const Notice('Chat is currently switched off. You can still read your message history.', warning: true), const SizedBox(height: 12)],
                    if (conversations.isEmpty)
                      const EmptyState(icon: Icons.forum_outlined, title: 'No conversations yet', text: 'Open a proposal and tap “Chat now” to send a message.')
                    else
                      Panel(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Column(children: [
                          for (final item in conversations)
                            ListTile(
                              leading: CircleAvatar(backgroundColor: AppColors.cream, child: Text('${item['other_name']}'.isEmpty ? '?' : '${item['other_name']}'[0].toUpperCase(), style: const TextStyle(color: AppColors.navy, fontWeight: FontWeight.w700))),
                              title: Row(children: [
                                Expanded(child: Text('${item['other_name']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: (item['unread'] as num) > 0 ? FontWeight.w700 : FontWeight.w500))),
                                if (item['other_role'] == 'consultant') Pill('Consultant'),
                                if (item['other_role'] == 'admin') Pill('Al Zaujain'),
                              ]),
                              subtitle: Tx('${item['preview']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                              trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                                Text(formatDate(item['last_message_at'], time: true), style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
                                if ((item['unread'] as num) > 0) Padding(padding: const EdgeInsets.only(top: 4), child: Badge(label: Text('${item['unread']}'), backgroundColor: AppColors.gold, textColor: AppColors.dark)),
                              ]),
                              onTap: () async {
                                await push(context, ChatScreen(id: (item['id'] as num).toInt()));
                                await app.refreshAccount();
                                reload();
                              },
                            ),
                        ]),
                      ),
                  ]);
                },
              ),
      ),
    );
  }
}

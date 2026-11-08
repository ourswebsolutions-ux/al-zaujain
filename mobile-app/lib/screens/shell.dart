import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import 'account_screen.dart';
import 'home_screen.dart';
import 'messages_screen.dart';
import 'proposals_screen.dart';
import 'saved_screen.dart';

final shellKey = GlobalKey<ShellState>();

/// The bottom navigation: Home, Proposals, Messages, Saved and Account.
class Shell extends StatefulWidget {
  Shell() : super(key: shellKey);

  @override
  State<Shell> createState() => ShellState();
}

class ShellState extends State<Shell> {
  int index = 0;
  final proposals = GlobalKey<ProposalsScreenState>();
  final _visited = <int>{0};

  /// Opens the Proposals tab with a search, as the website's search boxes do.
  void showProposals({Map<String, String> filters = const {}, String path = ''}) {
    setState(() { index = 1; _visited.add(1); });
    WidgetsBinding.instance.addPostFrameCallback((_) => proposals.currentState?.search(filters: filters, path: path));
  }

  void select(int value) => setState(() { index = value; _visited.add(value); });

  @override
  Widget build(BuildContext context) {
    final pages = [
      const HomeScreen(),
      ProposalsScreen(key: proposals),
      const MessagesScreen(),
      const SavedScreen(),
      const AccountScreen(),
    ];
    return PopScope(
      canPop: index == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) select(0);
      },
      child: Scaffold(
        body: IndexedStack(index: index, children: [for (var i = 0; i < pages.length; i++) _visited.contains(i) ? pages[i] : const SizedBox.shrink()]),
        bottomNavigationBar: ListenableBuilder(
          listenable: app,
          builder: (context, _) => NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: Colors.white,
              indicatorColor: AppColors.cream,
              labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(fontSize: 11.5, fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500, color: AppColors.navy)),
              iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? AppColors.gold : AppColors.navy)),
            ),
            child: NavigationBar(
              selectedIndex: index,
              onDestinationSelected: select,
              height: 66,
              destinations: [
                NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home_rounded), label: tr('Home')),
                NavigationDestination(icon: const Icon(Icons.search_rounded), selectedIcon: const Icon(Icons.manage_search_rounded), label: tr('Proposals')),
                NavigationDestination(
                  icon: Badge(isLabelVisible: app.unreadMessages > 0, label: Text('${app.unreadMessages}'), backgroundColor: AppColors.gold, textColor: AppColors.dark, child: const Icon(Icons.chat_bubble_outline_rounded)),
                  selectedIcon: const Icon(Icons.chat_bubble_rounded),
                  label: tr('Messages'),
                ),
                NavigationDestination(icon: const Icon(Icons.favorite_border_rounded), selectedIcon: const Icon(Icons.favorite_rounded), label: tr('Saved')),
                NavigationDestination(
                  icon: Badge(isLabelVisible: app.unreadNotifications > 0, label: Text('${app.unreadNotifications}'), backgroundColor: AppColors.gold, textColor: AppColors.dark, child: const Icon(Icons.person_outline_rounded)),
                  selectedIcon: const Icon(Icons.person_rounded),
                  label: tr('Account'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

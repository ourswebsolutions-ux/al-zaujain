import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/updater.dart';
import '../core/theme.dart';
import 'account_screen.dart';
import 'site_home.dart';
import 'messages_screen.dart';
import 'proposals_screen.dart';
import 'member_screens.dart';

final shellKey = GlobalKey<ShellState>();

/// The tabs of the bottom bar, in order.
abstract final class Tabs {
  static const home = 0;
  static const search = 1;
  static const matches = 2;
  static const messages = 3;
  static const account = 4;
}

/// The bottom navigation from the app design: Home, Search, Matches, Messages and Profile.
class Shell extends StatefulWidget {
  Shell() : super(key: shellKey);

  @override
  State<Shell> createState() => ShellState();
}

class ShellState extends State<Shell> {
  int index = 0;
  final proposals = GlobalKey<ProposalsScreenState>();
  final _visited = <int>{0};

  /// Opens the Search tab with a search, as the website's search boxes do.
  void showProposals({Map<String, String> filters = const {}, String path = ''}) {
    setState(() { index = Tabs.search; _visited.add(Tabs.search); });
    WidgetsBinding.instance.addPostFrameCallback((_) => proposals.currentState?.search(filters: filters, path: path));
  }

  @override
  void initState() {
    super.initState();
    // A newer APK on the website is offered once each time the app opens.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Updater.check(context);
    });
  }

  void select(int value) => setState(() { index = value; _visited.add(value); });

  @override
  Widget build(BuildContext context) {
    final pages = [
      const SiteHomeScreen(),
      ProposalsScreen(key: proposals),
      const MatchesTab(),
      const MessagesScreen(),
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
          builder: (context, _) {
            Widget badge(int count, IconData icon) => Badge(isLabelVisible: count > 0, label: Text('$count'), backgroundColor: AppColors.gold, textColor: AppColors.dark, child: Icon(icon));
            return Container(
              decoration: const BoxDecoration(
                color: AppColors.navy,
                borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
                boxShadow: [BoxShadow(color: Color(0x3303223F), blurRadius: 18, offset: Offset(0, -4))],
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
                child: NavigationBarTheme(
                  data: NavigationBarThemeData(
                    backgroundColor: AppColors.navy,
                    indicatorColor: Colors.white.withValues(alpha: 0.08),
                    labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(fontSize: 11.5, fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500, color: states.contains(WidgetState.selected) ? AppColors.goldSoft : const Color(0xFFC7D3DD))),
                    iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? AppColors.goldSoft : const Color(0xFFC7D3DD))),
                  ),
                  child: NavigationBar(
                    selectedIndex: index,
                    onDestinationSelected: select,
                    height: 68,
                    destinations: [
                      NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home_rounded), label: tr('Home')),
                      NavigationDestination(icon: const Icon(Icons.search_rounded), selectedIcon: const Icon(Icons.manage_search_rounded), label: tr('Search')),
                      NavigationDestination(icon: const Icon(Icons.favorite_border_rounded), selectedIcon: const Icon(Icons.favorite_rounded), label: tr('Matches')),
                      NavigationDestination(icon: badge(app.unreadMessages, Icons.chat_bubble_outline_rounded), selectedIcon: badge(app.unreadMessages, Icons.chat_bubble_rounded), label: tr('Messages')),
                      NavigationDestination(icon: badge(app.unreadNotifications, Icons.person_outline_rounded), selectedIcon: badge(app.unreadNotifications, Icons.person_rounded), label: tr('Profile')),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

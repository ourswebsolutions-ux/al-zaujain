import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import 'auth_screens.dart';
import 'shell.dart';

/// "Saved profiles": the member's private shortlist.
class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: app,
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: Text(tr('Saved profiles'))),
        body: !app.signedIn
            ? const SignInPrompt(icon: Icons.favorite_border_rounded, title: 'Save the proposals you like', text: 'Tap the heart on any proposal to keep it here.')
            : Loader(
                key: ValueKey(app.saved.length),
                load: () => app.api.get('saved'),
                builder: (context, data, reload) {
                  final profiles = rowsOf(data['profiles']);
                  return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    const PageIntro('Saved profiles', text: 'Your private shortlist. Nobody is told when you save them.'),
                    if (profiles.isEmpty)
                      EmptyState(icon: Icons.favorite_border_rounded, title: 'No saved profiles yet', text: 'Tap the heart on any proposal to keep it here.', action: AppButton('Browse proposals', tone: Tone.gold, onPressed: () => shellKey.currentState?.showProposals()))
                    else
                      CardGrid(cards: profiles, compact: true),
                  ]);
                },
              ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';
import '../widgets/site.dart';

/// "Professional marriage consultants", as on the website.
/// Some consultants serve one city only: they appear once the family chooses that city
/// (a member's own city is chosen for them).
class ConsultantsScreen extends StatefulWidget {
  const ConsultantsScreen({super.key});

  @override
  State<ConsultantsScreen> createState() => _ConsultantsScreenState();
}

class _ConsultantsScreenState extends State<ConsultantsScreen> {
  String? city;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Marriage consultants'))),
      body: Loader(
        key: ValueKey(city),
        load: () => app.api.get('consultants', city == null ? null : {'city': city!}),
        builder: (context, data, reload) {
          final consultants = rowsOf(data['consultants']);
          final cities = ((data['cities'] as List?) ?? []).map((item) => '$item').toList();
          final chosen = data['city'] as String?;
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Padding(padding: EdgeInsets.only(top: 18), child: SectionHeading(label: 'Expert Team', title: 'Hire Personal Matchmaking Consultant', size: 25)),
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 14, 4, 20),
              child: Text(tr('Our consultants work with you personally: they understand your family’s requirements, suggest suitable proposals and stay with you until the rishta is settled.'), textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, height: 1.6, color: Color(0xFF3D4A5A))),
            ),
            if (cities.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 18),
                child: Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  Text('${tr('Your city')}:', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.muted)),
                  ChoiceChip(label: Text(tr('All cities')), selected: chosen == null, onSelected: (_) => setState(() => city = 'all')),
                  for (final name in cities) ChoiceChip(label: Text(tr(name)), selected: chosen == name, onSelected: (_) => setState(() => city = name)),
                ]),
              ),
            if (consultants.isEmpty)
              const EmptyState(icon: Icons.support_agent_rounded, title: 'Our consultants will be listed here soon.')
            else
              LayoutBuilder(builder: (context, size) {
                final columns = size.maxWidth > 900 ? 3 : size.maxWidth > 560 ? 2 : 1;
                final width = (size.maxWidth - 16 * (columns - 1)) / columns;
                return Wrap(spacing: 16, runSpacing: 18, children: [
                  for (final consultant in consultants) SizedBox(width: width, child: ConsultantTile(consultant: consultant)),
                ]);
              }),
          ]);
        },
      ),
    );
  }
}

class ConsultantScreen extends StatelessWidget {
  const ConsultantScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Marriage consultants'))),
      body: Loader(
        load: () => app.api.get('consultants/$slug'),
        builder: (context, data, reload) {
          final consultant = (data['consultant'] as Map).cast<String, dynamic>();
          final details = [('City', consultant['city']), ('Languages', consultant['languages']), ('Experience', consultant['experience_years'] == null ? null : tr('{count} years', {'count': consultant['experience_years']}))].where((item) => item.$2 != null && '${item.$2}'.isNotEmpty);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            AspectRatio(aspectRatio: 1, child: NetImage(consultant['photo'] as String?, radius: 22)),
            const SizedBox(height: 16),
            Panel(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${consultant['display_name']}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500)),
                if (consultant['title'] != null) Text(tr('${consultant['title']}'), style: const TextStyle(fontSize: 15, color: AppColors.deepGold)),
                if (consultant['bio'] != null) Padding(padding: const EdgeInsets.only(top: 12), child: Tx('${consultant['bio']}', style: const TextStyle(fontSize: 14.5, height: 1.8, color: Color(0xFF536471)))),
                const SizedBox(height: 12),
                for (final (label, value) in details)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(tr(label).toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.muted, letterSpacing: 0.7)),
                      Text(tr('$value'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    ]),
                  ),
                const SizedBox(height: 8),
                Wrap(spacing: 10, runSpacing: 10, children: [
                  if (consultant['whatsapp'] != null) AppButton('WhatsApp', icon: Icons.chat_rounded, onPressed: () => openLink(context, 'https://wa.me/${consultant['whatsapp']}')),
                  if (consultant['phone'] != null) AppButton('${consultant['phone']}', tone: Tone.gold, icon: Icons.call_rounded, onPressed: () => openLink(context, 'tel:${'${consultant['phone']}'.replaceAll(' ', '')}')),
                  if (consultant['public_email'] != null) AppButton('Email', tone: Tone.outline, icon: Icons.email_rounded, onPressed: () => openLink(context, 'mailto:${consultant['public_email']}')),
                ]),
              ]),
            ),
          ]);
        },
      ),
    );
  }
}

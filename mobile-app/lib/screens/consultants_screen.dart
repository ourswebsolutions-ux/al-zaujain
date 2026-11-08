import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';

/// "Professional marriage consultants", as on the website.
class ConsultantsScreen extends StatelessWidget {
  const ConsultantsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Marriage consultants'))),
      body: Loader(
        load: () => app.api.get('consultants'),
        builder: (context, data, reload) {
          final consultants = rowsOf(data['consultants']);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const SectionTag('A REAL CONVERSATION'),
            const SizedBox(height: 4),
            const PageIntro('Professional marriage consultants', urdu: 'ہمارے مشیر', text: 'Work with an experienced consultant, in Pakistan or overseas, who will understand your family and guide every step.'),
            if (consultants.isEmpty)
              const EmptyState(icon: Icons.support_agent_rounded, title: 'Our consultants will be listed here soon.')
            else
              LayoutBuilder(builder: (context, size) {
                final columns = size.maxWidth > 560 ? 3 : 2;
                final width = (size.maxWidth - 12 * (columns - 1)) / columns;
                return Wrap(spacing: 12, runSpacing: 12, children: [
                  for (final consultant in consultants)
                    SizedBox(
                      width: width,
                      child: Material(
                        color: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: AppColors.line)),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => push(context, ConsultantScreen(slug: '${consultant['slug']}')),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              AspectRatio(aspectRatio: 1, child: NetImage(consultant['photo'] as String?, radius: 14)),
                              Padding(
                                padding: const EdgeInsets.fromLTRB(4, 10, 4, 4),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('${consultant['display_name']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                                  if (consultant['title'] != null) Text(tr('${consultant['title']}'), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.deepGold)),
                                  if (consultant['city'] != null) Text(tr('${consultant['city']}'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                                ]),
                              ),
                            ]),
                          ),
                        ),
                      ),
                    ),
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

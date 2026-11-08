import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';
import 'profile_form_screen.dart';

/// "Partner preferences": the partner section of the biodata on its own, as on the website.
class PreferencesScreen extends StatelessWidget {
  const PreferencesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Partner preferences'))),
      body: Loader(
        load: () => app.api.get('preferences'),
        builder: (context, data, reload) {
          const intro = PageIntro('Partner preferences', text: 'Describe who you are looking for. This is shown in its own section on your biodata and drives your recommended matches.');
          if (data['code'] == null) {
            return Column(children: [
              intro,
              EmptyState(icon: Icons.tune_rounded, title: 'Create your biodata first', text: 'Your partner requirements are part of your matrimonial profile.', action: AppButton('Create my biodata', tone: Tone.gold, onPressed: () => push(context, const ProfileFormScreen()))),
            ]);
          }
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [intro, _PreferencesForm(code: '${data['code']}', initial: ((data['values'] as Map?) ?? {}).cast<String, dynamic>())]);
        },
      ),
    );
  }
}

class _PreferencesForm extends StatefulWidget {
  const _PreferencesForm({required this.code, required this.initial});
  final String code;
  final Json initial;
  @override
  State<_PreferencesForm> createState() => _PreferencesFormState();
}

class _PreferencesFormState extends State<_PreferencesForm> {
  late final Map<String, String> values = widget.initial.map((key, value) => MapEntry(key, value == null ? '' : '$value'));
  Map<String, String> errors = {};
  bool busy = false;
  String? message;
  bool ok = false;

  List<Json> get fields {
    final section = ((app.config['form'] as List?) ?? []).cast<Map>().firstWhere((item) => item['key'] == 'partner');
    return ((section['fields'] as List?) ?? []).cast<Map>().map((field) => field.cast<String, dynamic>()).toList();
  }

  void _set(String name, String value) => setState(() { values[name] = value; errors.remove(name); });

  @override
  Widget build(BuildContext context) {
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        for (final field in fields) _field(field),
        if (message != null) ...[Notice(message!, ok: ok), const SizedBox(height: 12)],
        AppButton(busy ? 'Saving…' : 'Save partner requirements', busy: busy, expand: true, onPressed: () async {
          setState(() { busy = true; message = null; });
          try {
            final result = await app.api.post('preferences', {'code': widget.code, 'values': values});
            ok = true;
            message = '${result['message']}';
            errors = {};
            if (context.mounted) showMessage(context, message!);
          } on ApiException catch (error) {
            ok = false;
            message = error.message;
            errors = error.errors;
            if (context.mounted) showMessage(context, error.message, error: true);
          } finally {
            if (mounted) setState(() => busy = false);
          }
        }),
      ]),
    );
  }

  Widget _field(Json field) {
    final name = '${field['name']}';
    final label = '${field['label']}';
    final error = errors[name];
    switch (field['type']) {
      case 'select':
        return PickerField(label: label, options: optionsFrom(field['options']), value: values[name], error: error, anyLabel: 'Not specified', onChanged: (value) => _set(name, value));
      case 'country-name':
        return PickerField(label: label, options: ((app.config['countries'] as List?) ?? []).cast<Map>().map((country) => Option('${country['name']}', tr('${country['name']}'))).toList(), value: values[name], error: error, anyLabel: 'Not specified', allowCustom: true, onChanged: (value) => _set(name, value));
      default:
        final suggest = field['suggest'];
        if (suggest == 'castes' || suggest == 'cities') {
          final options = suggest == 'castes'
              ? optionsFrom(app.config['castes'])
              : (() {
                  final seen = <String>{};
                  return [for (final city in ((app.config['cities'] as List?) ?? []).cast<Map>()) if (seen.add('${city['name']}')) Option('${city['name']}', tr('${city['name']}'), tr('${city['country']}'))];
                })();
          return PickerField(label: label, options: options, value: values[name], error: error, allowCustom: true, anyLabel: 'Not specified', onChanged: (value) => _set(name, value));
        }
        return TextInput(
          label: label,
          required: field['required'] == true,
          hint: field['hint'] as String?,
          error: error,
          initial: values[name],
          maxLength: (field['max'] as num?)?.toInt(),
          lines: field['type'] == 'textarea' ? ((field['rows'] as num?)?.toInt() ?? 4) : 1,
          keyboard: field['type'] == 'number' ? TextInputType.number : null,
          onChanged: (value) => _set(name, value),
        );
    }
  }
}

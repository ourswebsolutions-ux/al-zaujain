import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import 'common.dart';

class Option {
  const Option(this.value, [this.label, this.alt]);
  final String value;
  final String? label;
  final String? alt;
  String get text => label ?? tr(value);
}

List<Option> optionsFrom(Object? list) => ((list as List?) ?? const []).map((item) {
      if (item is Map) return Option('${item['value'] ?? item['name']}', item['label'] == null ? null : tr('${item['label']}'), item['alt'] == null ? null : '${item['alt']}');
      return Option('$item');
    }).toList();

String _fold(String text) => text.toLowerCase().trim();

/// A searchable list in a bottom sheet, like the website's type-to-search dropdowns.
/// Returns the chosen value, '' for "any", or null when closed without choosing.
Future<String?> showPicker(
  BuildContext context, {
  required String title,
  required List<Option> options,
  String? selected,
  String? anyLabel,
  bool allowCustom = false,
  bool searchable = true,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => _PickerSheet(title: title, options: options, selected: selected, anyLabel: anyLabel, allowCustom: allowCustom, searchable: searchable || allowCustom),
  );
}

class _PickerSheet extends StatefulWidget {
  const _PickerSheet({required this.title, required this.options, this.selected, this.anyLabel, required this.allowCustom, required this.searchable});
  final String title;
  final List<Option> options;
  final String? selected;
  final String? anyLabel;
  final bool allowCustom;
  final bool searchable;

  @override
  State<_PickerSheet> createState() => _PickerSheetState();
}

class _PickerSheetState extends State<_PickerSheet> {
  String query = '';

  List<Option> get matches {
    final needle = _fold(query);
    if (needle.isEmpty) return widget.options;
    final starts = <Option>[];
    final contains = <Option>[];
    for (final option in widget.options) {
      final hay = [option.text, option.value, option.alt ?? ''].map(_fold);
      if (hay.any((text) => text.startsWith(needle))) {
        starts.add(option);
      } else if (hay.any((text) => text.contains(needle))) {
        contains.add(option);
      }
    }
    return [...starts, ...contains];
  }

  @override
  Widget build(BuildContext context) {
    final list = matches;
    final typed = query.trim();
    final exact = widget.options.any((option) => _fold(option.text) == _fold(typed) || _fold(option.value) == _fold(typed));
    final showCustom = widget.allowCustom && typed.isNotEmpty && !exact;
    final many = widget.options.length > 8;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: many || widget.allowCustom ? MediaQuery.of(context).size.height * 0.82 : null,
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 10), child: Tx(tr(widget.title), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
          if (widget.searchable && (many || widget.allowCustom))
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                autofocus: widget.allowCustom,
                onChanged: (value) => setState(() => query = value),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) {
                  if (list.isNotEmpty) {
                    Navigator.pop(context, list.first.value);
                  } else if (showCustom) {
                    Navigator.pop(context, typed);
                  }
                },
                decoration: InputDecoration(prefixIcon: const Icon(Icons.search_rounded), hintText: tr(widget.allowCustom ? 'Type or choose' : 'Search')),
              ),
            ),
          Flexible(
            child: ListView(
              shrinkWrap: !(many || widget.allowCustom),
              padding: const EdgeInsets.only(bottom: 24),
              children: [
                if (widget.anyLabel != null && typed.isEmpty) _tile(Option('', tr(widget.anyLabel!)), muted: true),
                for (final option in list.take(120)) _tile(option),
                if (list.length > 120) Padding(padding: const EdgeInsets.all(16), child: Text(tr('Keep typing to see more'), style: const TextStyle(color: AppColors.muted, fontSize: 12))),
                if (showCustom) _tile(Option(typed, tr('Use “{text}”', {'text': typed})), muted: true),
                if (list.isEmpty && !showCustom) Padding(padding: const EdgeInsets.all(20), child: Text(tr('No matches. Try another spelling.'), style: const TextStyle(color: AppColors.muted))),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _tile(Option option, {bool muted = false}) {
    final chosen = option.value == (widget.selected ?? '') && !muted;
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      title: Tx(option.text, style: TextStyle(fontSize: 15, fontWeight: chosen ? FontWeight.w700 : FontWeight.w400, color: muted ? AppColors.muted : AppColors.navy)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        if (option.alt != null) Text(option.alt!, textDirection: TextDirection.rtl, style: const TextStyle(fontFamily: 'NotoNaskhArabic', fontSize: 14, color: AppColors.muted)),
        if (chosen) const Padding(padding: EdgeInsetsDirectional.only(start: 8), child: Icon(Icons.check_rounded, color: AppColors.green, size: 20)),
      ]),
      onTap: () => Navigator.pop(context, option.value),
    );
  }
}

/// A form field that opens a picker. Shows the label above, the choice inside and any error below.
class PickerField extends StatelessWidget {
  const PickerField({
    super.key,
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
    this.placeholder,
    this.anyLabel,
    this.allowCustom = false,
    this.error,
    this.required = false,
    this.locked = false,
    this.hint,
  });

  final String label;
  final List<Option> options;
  final String? value;
  final ValueChanged<String> onChanged;
  final String? placeholder;
  final String? anyLabel;
  final bool allowCustom;
  final String? error;
  final bool required;
  final bool locked;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final current = value ?? '';
    final match = options.where((option) => option.value == current);
    final display = match.isNotEmpty ? match.first.text : (current.isEmpty ? null : tr(current));
    return FieldShell(
      label: label,
      required: required,
      locked: locked,
      error: error,
      hint: hint,
      merge: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () async {
          final picked = await showPicker(context, title: label, options: options, selected: current, anyLabel: anyLabel, allowCustom: allowCustom);
          if (picked != null) onChanged(picked);
        },
        child: InputDecorator(
          isEmpty: display == null,
          decoration: InputDecoration(
            hintText: tr(placeholder ?? anyLabel ?? 'Select'),
            errorText: error == null ? null : '',
            errorStyle: const TextStyle(height: 0, fontSize: 0),
            suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.muted),
          ),
          child: display == null ? null : Tx(display, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15)),
        ),
      ),
    );
  }
}

/// The label, lock mark, hint and error around any form control, like the website's FieldRow.
class FieldShell extends StatelessWidget {
  const FieldShell({super.key, required this.label, required this.child, this.required = false, this.locked = false, this.error, this.hint, this.merge = false});
  final String label;
  final Widget child;
  final bool required;
  final bool locked;
  final String? error;
  final String? hint;

  /// Reads the label together with the control, so screen readers say "Email, edit box".
  final bool merge;

  @override
  Widget build(BuildContext context) {
    final column = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Flexible(child: Tx('${tr(label)}${required ? ' *' : ''}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
          if (locked) Padding(padding: const EdgeInsetsDirectional.only(start: 6), child: Tooltip(message: tr('Never shown publicly'), child: const Icon(Icons.lock_rounded, size: 13, color: AppColors.bronze))),
        ]),
        const SizedBox(height: 6),
        child,
        if (error != null) Padding(padding: const EdgeInsets.only(top: 5), child: Tx(tr(error), style: const TextStyle(fontSize: 12, color: AppColors.red))),
        if (hint != null && error == null) Padding(padding: const EdgeInsets.only(top: 5), child: Tx(tr(hint), style: const TextStyle(fontSize: 12, color: AppColors.muted, height: 1.4))),
      ]);
    return Padding(padding: const EdgeInsets.only(bottom: 16), child: merge ? MergeSemantics(child: column) : column);
  }
}

/// A plain text input with the same label and error layout.
class TextInput extends StatelessWidget {
  const TextInput({
    super.key,
    required this.label,
    this.controller,
    this.initial,
    this.onChanged,
    this.error,
    this.required = false,
    this.locked = false,
    this.hint,
    this.placeholder,
    this.maxLength,
    this.lines = 1,
    this.keyboard,
    this.obscure = false,
    this.enabled = true,
    this.suffix,
    this.autofill,
  });

  final String label;
  final TextEditingController? controller;
  final String? initial;
  final ValueChanged<String>? onChanged;
  final String? error;
  final bool required;
  final bool locked;
  final String? hint;
  final String? placeholder;
  final int? maxLength;
  final int lines;
  final TextInputType? keyboard;
  final bool obscure;
  final bool enabled;
  final Widget? suffix;
  final Iterable<String>? autofill;

  @override
  Widget build(BuildContext context) {
    return FieldShell(
      label: label,
      required: required,
      locked: locked,
      error: error,
      hint: hint,
      merge: suffix == null,
      child: TextFormField(
        controller: controller,
        initialValue: controller == null ? initial : null,
        onChanged: onChanged,
        maxLength: maxLength,
        maxLines: obscure ? 1 : lines,
        minLines: lines > 1 ? lines : null,
        keyboardType: keyboard ?? (lines > 1 ? TextInputType.multiline : null),
        obscureText: obscure,
        enabled: enabled,
        autofillHints: autofill,
        style: const TextStyle(fontSize: 15, color: AppColors.navy),
        decoration: InputDecoration(hintText: placeholder == null ? null : tr(placeholder), counterText: '', errorText: error == null ? null : '', errorStyle: const TextStyle(height: 0, fontSize: 0), suffixIcon: suffix),
      ),
    );
  }
}

// Which profile questions a person sees, decided from the answers already given.
//
// The rules come from the website with the form (config['form'], each field's `when` and `optionsWhen`).
// This is the app's copy of the website's evaluator in lib/form-conditions.js; keep the two in step.
// See that file for the rule format.

bool _blank(Object? value) => value == null || '$value'.trim().isEmpty;
bool _same(Object? a, Object? b) => '${a ?? ''}'.trim().toLowerCase() == '${b ?? ''}'.trim().toLowerCase();

/// The country list from the app's config: [{id, name}].
typedef Countries = List<Map>;

String? _countryName(Object? value, Countries countries) {
  if (_blank(value)) return null;
  final text = '$value';
  if (RegExp(r'^\d+$').hasMatch(text)) {
    for (final country in countries) {
      if ('${country['id']}' == text) return '${country['name']}';
    }
    return null;
  }
  return text;
}

/// Whether a rule holds for these answers. A missing rule always holds.
bool ruleHolds(Object? rule, Map<String, Object?> values, Countries countries) {
  if (rule is! Map) return true;
  if (rule['all'] is List) return (rule['all'] as List).every((item) => ruleHolds(item, values, countries));
  if (rule['any'] is List) return (rule['any'] as List).any((item) => ruleHolds(item, values, countries));
  if (rule.containsKey('not')) return !ruleHolds(rule['not'], values, countries);
  final value = values['${rule['field']}'];
  if (rule.containsKey('filled')) return rule['filled'] == true ? !_blank(value) : _blank(value);
  if (rule.containsKey('is')) return !_blank(value) && _same(value, rule['is']);
  if (rule['in'] is List) return !_blank(value) && (rule['in'] as List).any((item) => _same(value, item));
  if (rule['notIn'] is List) return !_blank(value) && !(rule['notIn'] as List).any((item) => _same(value, item));
  if (rule.containsKey('gt')) return !_blank(value) && (num.tryParse('$value') ?? double.negativeInfinity) > (rule['gt'] as num);
  if (rule.containsKey('country')) {
    if (_blank(value)) return false;
    final name = _countryName(value, countries);
    // An id we cannot name: keep the question rather than lose an answer.
    return name == null ? true : _same(name, rule['country']);
  }
  return true;
}

/// The names of the visible questions, walking the whole form in order. Answers to hidden questions
/// count as blank for every rule after them, so conditions nest.
Set<String> visibleFieldNames(List<Map> fields, Map<String, Object?> values, Countries countries) {
  final seen = <String, Object?>{};
  final visible = <String>{};
  for (final field in fields) {
    final name = '${field['name']}';
    if (ruleHolds(field['when'], seen, countries)) {
      visible.add(name);
      seen[name] = values[name];
    }
  }
  return visible;
}

/// The options of a select that this person may choose; options are {value, label} maps.
List<Map> allowedOptions(Map field, Map<String, Object?> values, Countries countries) {
  final options = ((field['options'] as List?) ?? []).cast<Map>();
  final rules = field['optionsWhen'];
  if (rules is! Map) return options;
  return options.where((option) => ruleHolds(rules['${option['value']}'], values, countries)).toList();
}

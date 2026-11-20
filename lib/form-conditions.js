// Which profile questions a person sees, decided from the answers they have already given.
//
// Each field in lib/profile-schema.js may carry a `when` rule; a select may also carry `optionsWhen`
// ({ "<option value>": rule }) to offer an option only to some people. Rules are plain JSON, so the
// website, the server and the mobile app (which receives the schema over the API and has its own copy of
// this evaluator in lib/core/form_conditions.dart) all read the same rules. Keep the two in step.
//
// A rule is one of:
//   { field, is: value }            the answer equals value (text is compared without case)
//   { field, in: [values] }         the answer is one of these
//   { field, notIn: [values] }      the answer is given and is none of these
//   { field, filled: true|false }   the question has (or has not) been answered
//   { field, gt: number }           the answer is a number above this
//   { field, country: name }        the chosen country is this one (by id or by name)
//   { all: [rules] } / { any: [rules] } / { not: rule }
//
// Rules only look at questions asked earlier in the form. A question whose own rule fails is treated as
// unanswered by every later rule, so conditions nest: hiding "Do you have children?" also hides
// "How many children?".

const blank = (value) => value === null || value === undefined || String(value).trim() === '';
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/**
 * The name of a chosen country. `country_id` holds a list id or a name the family typed; `countries` is
 * the list ({ id, name }). Returns null when it cannot be told, and rules then keep the question visible.
 */
function countryName(value, countries) {
  if (blank(value)) return null;
  if (/^\d+$/.test(String(value))) {
    const found = countries?.find((country) => String(country.id) === String(value));
    return found ? found.name : null;
  }
  return String(value);
}

/** Whether a rule holds for these answers. `context.countries` resolves country ids. */
export function ruleHolds(rule, values, context = {}) {
  if (!rule) return true;
  if (rule.all) return rule.all.every((item) => ruleHolds(item, values, context));
  if (rule.any) return rule.any.some((item) => ruleHolds(item, values, context));
  if (rule.not) return !ruleHolds(rule.not, values, context);
  const value = values?.[rule.field];
  if ('filled' in rule) return rule.filled ? !blank(value) : blank(value);
  if ('is' in rule) return !blank(value) && same(value, rule.is);
  if ('in' in rule) return !blank(value) && rule.in.some((item) => same(value, item));
  if ('notIn' in rule) return !blank(value) && !rule.notIn.some((item) => same(value, item));
  if ('gt' in rule) return !blank(value) && Number(value) > rule.gt;
  if ('country' in rule) {
    if (blank(value)) return false;
    const name = countryName(value, context.countries);
    // An id we cannot name: keep the question rather than lose an answer.
    return name === null ? true : same(name, rule.country);
  }
  return true;
}

/**
 * Walks the fields in form order and returns the names of the visible ones. Answers to hidden questions
 * count as blank for every rule after them.
 */
export function visibleFieldNames(fields, values, context = {}) {
  const seen = {};
  const visible = new Set();
  for (const field of fields) {
    if (ruleHolds(field.when, seen, context)) {
      visible.add(field.name);
      seen[field.name] = values?.[field.name];
    }
  }
  return visible;
}

/** The answers with every hidden question emptied, so stale answers are never saved. */
export function withoutHidden(fields, values, context = {}, empty = null) {
  const visible = visibleFieldNames(fields, values, context);
  const output = { ...values };
  for (const field of fields) if (!visible.has(field.name) && field.name in output) output[field.name] = empty;
  return output;
}

const optionValue = (option) => String(Array.isArray(option) ? option[0] : option?.value ?? option);

/** The options of a select that this person may choose. */
export function allowedOptions(field, values, context = {}) {
  if (!field.options) return [];
  if (!field.optionsWhen) return field.options;
  return field.options.filter((option) => ruleHolds(field.optionsWhen[optionValue(option)], values, context));
}

/** True when the answer is an option that is not offered to this person (for example by gender). */
export function optionBlocked(field, value, values, context = {}) {
  if (!field.optionsWhen || blank(value)) return false;
  const rule = Object.entries(field.optionsWhen).find(([option]) => same(option, value))?.[1];
  return !!rule && !ruleHolds(rule, values, context);
}

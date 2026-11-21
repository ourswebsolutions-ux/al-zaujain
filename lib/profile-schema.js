// The single definition of a matrimonial profile. The multi-step form, client and server
// validation, the copy-to-clipboard text and the image/PDF export are all driven from here.
import { z } from 'zod';
import { ageFromDob, dateInput, heightLabel } from './format.js';
import { optionBlocked, visibleFieldNames, withoutHidden } from './form-conditions.js';

export const OPTIONS = {
  gender: [['female', 'Female'], ['male', 'Male']],
  marital_status: ['Never married', 'Divorced', 'Widowed', 'Separated', 'Married (seeking second marriage)'],
  mother_tongue: ['Urdu', 'Punjabi', 'Saraiki', 'Sindhi', 'Pashto', 'Balochi', 'Hindko', 'Kashmiri', 'English', 'Other'],
  profile_created_by: ['Self', 'Father', 'Mother', 'Brother', 'Sister', 'Relative', 'Friend', 'Consultant'],
  education_level: ['Below Matric', 'Matric', 'Intermediate', 'Diploma', 'Bachelors', 'Masters', 'MPhil', 'PhD', 'Professional (MBBS, CA, LLB)', 'Hafiz / Alim', 'Other'],
  residence_area: ['City', 'Town', 'Village'],
  home_ownership: ['Own', 'Rented', 'Family home', 'Government accommodation'],
  parent_status: ['Alive', 'Deceased'],
  employment_status: ['Employed', 'Business owner', 'Self-employed', 'Student', 'Not working', 'Retired', 'Homemaker'],
  religion: ['Islam', 'Christianity', 'Hinduism', 'Other'],
  sect: ['Sunni', 'Shia', 'Barelvi', 'Deobandi', 'Ahl-e-Hadith', 'Other', 'Prefer not to say'],
  religious_practices: ['Very practising', 'Practising', 'Moderately practising', 'Not very practising'],
  family_status: ['Middle class', 'Upper middle class', 'Affluent', 'Lower middle class'],
  complexion: ['Very fair', 'Fair', 'Wheatish', 'Wheatish brown', 'Dark'],
  family_type: ['Joint family', 'Nuclear family'],
  yes_no: ['Yes', 'No'],
  prayers: ['Five times a day', 'Regularly', 'Sometimes', 'Rarely'],
  smoking: ['No', 'Occasionally', 'Yes'],
  lifestyle: ['Traditional', 'Modern', 'Balanced'],
  open_choice: ['Yes', 'No', 'Can be considered'],
  marriage_intent: ['Yes', 'Considering'],
  children_living: ['With me', 'With the other parent', 'Shared', 'Grown up / independent'],
};

// Suggestions only: families may type any nationality or place.
export const NATIONALITIES = ['Pakistani', 'Pakistani (dual national)', 'British', 'American', 'Canadian', 'Australian', 'New Zealander', 'German', 'French', 'Italian', 'Spanish', 'Dutch', 'Belgian', 'Swedish', 'Norwegian', 'Danish', 'Greek', 'Irish', 'Saudi', 'Emirati', 'Qatari', 'Omani', 'Kuwaiti', 'Bahraini', 'Malaysian', 'Turkish', 'Other'];
export const MARRIAGE_LOCATIONS = ['Anywhere', 'Pakistan', 'Overseas', 'Same city', 'Same country'];

export const HEIGHTS = Array.from({ length: 33 }, (_, index) => {
  const inches = 54 + index;
  const cm = Math.round(inches * 2.54);
  return [cm, `${Math.floor(inches / 12)}'${inches % 12}" (${cm} cm)`];
});

const text = (name, label, max = 120, extra = {}) => ({ name, label, type: 'text', max, ...extra });
const area = (name, label, max = 1000, extra = {}) => ({ name, label, type: 'textarea', max, ...extra });
const select = (name, label, options, extra = {}) => ({ name, label, type: 'select', options, ...extra });
const number = (name, label, min, max, extra = {}) => ({ name, label, type: 'number', min, max, ...extra });

// Conditions (see lib/form-conditions.js). Each question is shown only when it applies.
const MARRIED = 'Married (seeking second marriage)';
const PREVIOUSLY_MARRIED = ['Divorced', 'Widowed', 'Separated'];
const NOT_WORKING = ['Student', 'Not working', 'Homemaker'];
const OWN_WORK = ['Business owner', 'Self-employed'];
const OPEN = ['Yes', 'Can be considered'];
const IS_MALE = { field: 'gender', is: 'male' };
const IS_FEMALE = { field: 'gender', is: 'female' };
const HAS_CHILDREN = { field: 'has_children', is: 'Yes' };
const MARRIED_MAN = { all: [IS_MALE, { field: 'marital_status', is: MARRIED }] };
const WORK_GIVEN = (exclude) => ({ field: 'employment_status', notIn: exclude });

// Each section has its own colour (website and app) so the long form reads as clear, separate parts.
export const SECTIONS = [
  { key: 'personal', color: '#1f5f99', title: 'Candidate personal information', ur: 'امیدوار کی ذاتی معلومات', fields: [
    text('headline_ur', 'Profile heading in Urdu', 200, { dir: 'auto', wide: true, hint: 'Optional. Shown at the top of the biodata, for example the candidate’s name in Urdu.' }),
    text('full_name', 'Full name', 100, { required: true }),
    select('gender', 'Gender', OPTIONS.gender, { required: true, strict: true }),
    { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true, private: true, hint: 'Must be 18 or older. Only your age is shown.' },
    { name: 'age', label: 'Age', type: 'derived' },
    select('height_cm', 'Height', HEIGHTS, { numeric: true }),
    text('weight', 'Weight', 20, { placeholder: 'e.g. 65 kg' }),
    select('complexion', 'Complexion', OPTIONS.complexion),
    // "Married" is offered to men only: a married man may seek another marriage.
    select('marital_status', 'Marital status', OPTIONS.marital_status, { required: true, strict: true, when: { field: 'gender', filled: true }, optionsWhen: { [MARRIED]: IS_MALE } }),
    // Married men: their present marriage.
    number('existing_wives', 'Number of present wives', 1, 3, { when: MARRIED_MAN }),
    select('second_marriage_intent', 'Looking for another marriage?', OPTIONS.marriage_intent, { when: MARRIED_MAN }),
    area('existing_family_situation', 'Present family situation', 800, { private: true, dir: 'auto', when: MARRIED_MAN, hint: 'For example: does the present wife know, where she and the children live, and how both homes will be managed.' }),
    // Divorced, widowed or separated: the previous marriage.
    text('previous_marriage_duration', 'How long did the previous marriage last?', 80, { when: { field: 'marital_status', in: PREVIOUSLY_MARRIED }, placeholder: 'e.g. 3 years' }),
    area('divorce_details', 'Reason for the divorce or separation', 500, { private: true, dir: 'auto', when: { field: 'marital_status', in: ['Divorced', 'Separated'] } }),
    area('widowed_details', 'About the late spouse', 500, { private: true, dir: 'auto', when: { field: 'marital_status', is: 'Widowed' }, hint: 'For example the year and cause of passing.' }),
    area('previous_spouse_details', 'Previous spouse’s details', 500, { private: true, dir: 'auto', when: { field: 'marital_status', in: ['Divorced', 'Separated'] }, hint: 'For example their family, profession and whether they have remarried.' }),
    // Children: never asked of someone who has never married.
    select('has_children', 'Do you have children?', OPTIONS.yes_no, { strict: true, when: { field: 'marital_status', notIn: ['Never married'] } }),
    number('children_count', 'Number of children', 1, 20, { when: HAS_CHILDREN }),
    text('children_details', 'Children’s ages and genders', 200, { when: HAS_CHILDREN, placeholder: 'e.g. Son 8 years, daughter 5 years' }),
    select('children_living', 'Children live with', OPTIONS.children_living, { when: HAS_CHILDREN }),
    select('second_wife', 'Willing to be a second wife?', ['Yes', 'No'], { strict: true, when: IS_FEMALE, hint: 'Only “Yes” lists the profile under Second Marriage Proposals.' }),
    select('mother_tongue', 'Mother language', OPTIONS.mother_tongue),
    text('other_languages', 'Other languages spoken', 120, { placeholder: 'e.g. English, Punjabi' }),
    text('caste', 'Caste / Biradari', 60, { placeholder: 'Choose, or type your own', suggest: 'castes', hint: 'Not in the list? Type your caste and choose “Use …”, or just leave the field.' }),
    text('nationality', 'Nationality', 60, { placeholder: 'e.g. Pakistani', suggest: 'nationalities' }),
    { name: 'origin_country', label: 'Country of origin', type: 'country-name' },
    text('origin_city', 'Home city', 80, { suggest: 'cities' }),
    select('profile_created_by', 'Profile created by', OPTIONS.profile_created_by),
    area('description', 'About the candidate', 1500, { dir: 'auto', hint: 'A few lines about the person, their nature and goals. Please do not include phone numbers.' }),
    text('contact_phone', 'Phone number', 20, { private: true, pattern: 'phone', placeholder: '0300 1234567' }),
    text('contact_whatsapp', 'WhatsApp number', 20, { private: true, pattern: 'phone', placeholder: '0300 1234567' }),
    { name: 'contact_email', label: 'Email address', type: 'email', max: 160, private: true },
  ] },
  { key: 'education', color: '#0f7c74', title: 'Education and professional details', ur: 'تعلیم اور پیشہ', fields: [
    select('education_level', 'Education', OPTIONS.education_level),
    text('degree', 'Field of study / specialization', 100, { placeholder: 'e.g. MSc Mathematics', when: { field: 'education_level', notIn: ['Below Matric'] } }),
    text('institution', 'Institution', 120, { when: { field: 'education_level', notIn: ['Below Matric'] } }),
    area('other_qualifications', 'Other qualifications', 500, { when: { field: 'education_level', notIn: ['Below Matric', 'Matric'] } }),
    select('employment_status', 'Employment status', OPTIONS.employment_status),
    text('current_studies', 'Currently studying', 150, { placeholder: 'e.g. BS Computer Science, 3rd year', when: { field: 'employment_status', is: 'Student' } }),
    text('occupation', 'Occupation', 100, { placeholder: 'e.g. Teacher, Own work', when: WORK_GIVEN(NOT_WORKING) }),
    text('job_title', 'Job title / designation', 100, { placeholder: 'Job title or nature of the work', when: WORK_GIVEN([...NOT_WORKING, ...OWN_WORK]) }),
    text('organization', 'Organization / company', 120, { when: WORK_GIVEN([...NOT_WORKING, ...OWN_WORK]) }),
    area('business_details', 'Business details', 500, { dir: 'auto', when: { field: 'employment_status', in: OWN_WORK }, hint: 'The nature of the business, its name and how long it has run.' }),
    text('work_location', 'Work country and city', 120, { placeholder: 'e.g. Pakistan, Lahore', when: WORK_GIVEN([...NOT_WORKING, 'Retired']) }),
    text('monthly_income', 'Monthly income', 40, { placeholder: 'e.g. 80K', hint: 'Shown on your biodata. Leave blank to keep it off.', when: WORK_GIVEN(NOT_WORKING) }),
  ] },
  { key: 'religious', color: '#2f7d3a', title: 'Religious information', ur: 'مذہبی معلومات', fields: [
    select('religion', 'Religion', OPTIONS.religion),
    select('sect', 'Maslak / Sect', OPTIONS.sect, { when: { field: 'religion', is: 'Islam' } }),
    select('religious_practices', 'Religious practices', OPTIONS.religious_practices),
    area('religious_details', 'Other relevant details', 500),
  ] },
  { key: 'residential', color: '#b4651d', title: 'Residence details', ur: 'رہائش کی تفصیلات', fields: [
    { name: 'country_id', label: 'Country', type: 'country' },
    text('state', 'State / Province', 80, { when: { field: 'country_id', filled: true } }),
    text('city', 'City', 80, { suggest: 'cities', when: { field: 'country_id', filled: true } }),
    // City, town or village is asked for Pakistan; abroad the state and city say enough.
    select('residence_area', 'Area', OPTIONS.residence_area, { when: { field: 'country_id', country: 'Pakistan' } }),
    text('current_residence', 'Current residential area and type of house', 200, { private: true, placeholder: 'e.g. DHA, 10 marla house' }),
    text('permanent_residence', 'Permanent residence', 200, { private: true }),
    select('home_ownership', 'Home', OPTIONS.home_ownership),
    select('owns_property', 'Do you own any property or other assets?', OPTIONS.yes_no, { strict: true }),
    area('property_details', 'Property and assets', 500, { dir: 'auto', when: { field: 'owns_property', is: 'Yes' } }),
    text('marriage_location', 'Preferred marriage location', 120, { suggest: 'marriage-places', placeholder: 'e.g. Pakistan, Overseas, UK', hint: 'Where the family would like the couple to live after marriage.' }),
  ] },
  { key: 'family', color: '#a63d5a', title: 'Family information', ur: 'خاندانی معلومات', fields: [
    text('father_name', 'Father’s name', 100, { private: true }),
    select('father_status', 'Father', OPTIONS.parent_status),
    text('father_occupation', 'Father’s occupation', 100),
    text('mother_name', 'Mother’s name', 100, { private: true }),
    select('mother_status', 'Mother', OPTIONS.parent_status),
    text('mother_occupation', 'Mother’s occupation', 100),
    number('brothers', 'Number of brothers', 0, 20),
    number('married_brothers', 'Number of married brothers', 0, 20, { when: { field: 'brothers', gt: 0 } }),
    number('sisters', 'Number of sisters', 0, 20),
    number('married_sisters', 'Number of married sisters', 0, 20, { when: { field: 'sisters', gt: 0 } }),
    area('siblings_details', 'Siblings’ education and professions', 800, { dir: 'auto', when: { any: [{ field: 'brothers', gt: 0 }, { field: 'sisters', gt: 0 }] } }),
    select('family_type', 'Family type', OPTIONS.family_type),
    select('family_status', 'Family financial status', OPTIONS.family_status),
    text('family_location', 'Family location', 120),
    area('family_background', 'Other family information', 1500, { hint: 'Anything else about the family.' }),
  ] },
  { key: 'lifestyle', color: '#6a4fa3', title: 'Lifestyle and personality', ur: 'طرزِ زندگی اور شخصیت', fields: [
    select('prayers', 'Offers prayers', OPTIONS.prayers),
    select('smoking', 'Smoking', OPTIONS.smoking),
    select('lifestyle', 'Lifestyle', OPTIONS.lifestyle),
    select('willing_to_relocate', 'Willing to relocate after marriage', OPTIONS.open_choice),
    text('hobbies', 'Hobbies and interests', 200),
    area('personality', 'Personality', 600, { dir: 'auto' }),
  ] },
  { key: 'partner', color: '#9b712b', title: 'Partner requirements / demand', ur: 'رشتے کی ضروریات', fields: [
    // One question each, with "from" and "to" side by side.
    number('pref_age_min', 'Preferred age', 18, 80, { pair: 'pref_age_max', pairLabels: ['From', 'To'] }),
    number('pref_age_max', 'Preferred age to', 18, 80, { paired: true }),
    select('pref_height_min', 'Preferred height', HEIGHTS, { numeric: true, pair: 'pref_height_max', pairLabels: ['Minimum', 'Maximum'] }),
    select('pref_height_max', 'Preferred height (maximum)', HEIGHTS, { numeric: true, paired: true }),
    select('pref_complexion', 'Complexion', OPTIONS.complexion),
    text('pref_education', 'Education', 100),
    text('pref_profession', 'Profession', 100),
    text('pref_caste', 'Caste / Biradari', 60, { suggest: 'castes', placeholder: 'Choose, or type your own' }),
    { name: 'pref_country', label: 'Country', type: 'country-name' },
    text('pref_city', 'City', 80, { suggest: 'cities' }),
    // A married partner can only be a man (for a woman willing to be a second wife).
    select('pref_marital_status', 'Marital status', OPTIONS.marital_status, { optionsWhen: { [MARRIED]: IS_FEMALE } }),
    select('accept_divorced', 'Would consider a divorced or widowed partner', OPTIONS.open_choice, { when: { not: { field: 'pref_marital_status', is: 'Never married' } } }),
    select('accept_children', 'Would accept a partner with children', OPTIONS.open_choice, { when: { any: [{ field: 'accept_divorced', in: OPEN }, { field: 'pref_marital_status', in: [...PREVIOUSLY_MARRIED, MARRIED] }] } }),
    select('pref_religion', 'Religion', OPTIONS.religion),
    select('pref_sect', 'Sect', OPTIONS.sect, { when: { not: { field: 'pref_religion', notIn: ['Islam'] } } }),
    select('pref_family_type', 'Family type', OPTIONS.family_type),
    select('pref_family_status', 'Family financial status', OPTIONS.family_status),
    // Overseas questions are skipped when the partner must be from Pakistan.
    select('overseas_ok', 'Overseas proposals acceptable', OPTIONS.open_choice, { when: { not: { field: 'pref_country', country: 'Pakistan' } } }),
    select('relocate_abroad', 'Willing to move to another country after marriage', OPTIONS.open_choice, { when: { field: 'overseas_ok', in: OPEN } }),
    select('has_cultural_prefs', 'Any specific religious or cultural preferences?', OPTIONS.yes_no, { strict: true }),
    area('pref_cultural', 'Religious or cultural preferences', 500, { dir: 'auto', when: { field: 'has_cultural_prefs', is: 'Yes' } }),
    area('pref_qualities', 'Qualities expected in the life partner', 800, { dir: 'auto' }),
    area('partner_demand', 'Complete rishta demand in detail', 5000, { dir: 'auto', rows: 8, wide: true, hint: 'Describe the proposal you are looking for: age, height, education, profession, caste, family, financial status, location, religious preferences and anything else, in Urdu or English.' }),
  ] },
  { key: 'documents', color: '#44566c', title: 'Profile photograph and documents', ur: 'تصویر اور دستاویزات', fields: [] },
];

export const ALL_FIELDS = SECTIONS.flatMap((section) => section.fields).filter((field) => field.type !== 'derived');
export const COLUMN_NAMES = ALL_FIELDS.map((field) => field.name);

const PHONE = /^[+0-9\s()-]{7,20}$/;

function fieldValidator(field) {
  const optional = (schema) => (field.required ? schema : schema.nullable().optional());
  // Questions ("Do you have children?") read better with a plain request than "… is required".
  const required = field.label.endsWith('?') ? 'Please answer this question' : `${field.label} is required`;
  switch (field.type) {
    case 'number':
      return optional(z.number({ error: `${field.label} must be a number` }).int().min(field.min, `${field.label} must be at least ${field.min}`).max(field.max, `${field.label} must be at most ${field.max}`));
    case 'country':
      // A country from the list (its id), or a country name the family typed themselves.
      return optional(z.union([z.number().int().positive(), z.string().trim().min(2, required).max(100, `${field.label} is too long`)], { error: required }));
    case 'date':
      return z.string({ error: required }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');
    case 'email':
      return optional(z.email({ error: 'Enter a valid email address' }).max(field.max));
    case 'select': {
      if (field.numeric) return optional(z.number({ error: required }).int().min(100).max(250));
      // Lists are suggestions: families may choose one or type their own. Gender stays one of the two.
      if (field.strict) {
        const values = field.options.map((option) => (Array.isArray(option) ? option[0] : option));
        return optional(z.enum(values, { error: field.required ? required : `Choose a valid ${field.label.toLowerCase()}` }));
      }
      let schema = z.string({ error: required }).max(80, `${field.label} is too long`);
      if (field.required) schema = schema.min(1, required);
      return optional(schema);
    }
    default: {
      let schema = z.string({ error: required }).max(field.max ?? 120, `${field.label} is too long`);
      if (field.required) schema = schema.min(1, required);
      if (field.pattern === 'phone') schema = schema.regex(PHONE, 'Enter a valid phone number');
      return optional(schema);
    }
  }
}

// Profiles the team creates from a pasted biodata often lack details a member must give,
// so administrators only need what the database and listings cannot do without.
export const ADMIN_REQUIRED = new Set(['full_name', 'gender', 'date_of_birth', 'marital_status', 'country_id', 'city']);
const isRequired = (field, admin) => (admin ? ADMIN_REQUIRED.has(field.name) : !!field.required);
const VALIDATORS = { member: new Map(), admin: new Map() };
const validatorFor = (field, admin) => {
  const cache = VALIDATORS[admin ? 'admin' : 'member'];
  if (!cache.has(field.name)) cache.set(field.name, fieldValidator({ ...field, required: isRequired(field, admin) }));
  return cache.get(field.name);
};

// These run even when other fields are still incomplete, so step 1 can reject an under-18.
function crossFieldErrors(data, context) {
  const errors = {};
  if (data.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth)) {
    const age = ageFromDob(data.date_of_birth);
    if (age === null || age > 100 || age < 0) errors.date_of_birth = 'Enter a valid date of birth';
    else if (age < 18) errors.date_of_birth = 'Al Zaujain is for adults: you must be at least 18';
  }
  if (data.pref_age_min && data.pref_age_max && data.pref_age_min > data.pref_age_max) {
    errors.pref_age_max = 'The “to” age must not be below the “from” age';
  }
  if (data.pref_height_min && data.pref_height_max && data.pref_height_min > data.pref_height_max) {
    errors.pref_height_max = 'The maximum height must not be below the minimum';
  }
  if (data.married_brothers != null && data.brothers != null && data.married_brothers > data.brothers) errors.married_brothers = 'This cannot be more than the number of brothers';
  if (data.married_sisters != null && data.sisters != null && data.married_sisters > data.sisters) errors.married_sisters = 'This cannot be more than the number of sisters';
  // An option kept for some people only (for example "Married" for men).
  for (const field of ALL_FIELDS) {
    if (!errors[field.name] && optionBlocked(field, data[field.name], data, context)) errors[field.name] = 'This option does not apply to this profile';
  }
  return errors;
}

// Form inputs arrive as strings: trim them, blank becomes null, numbers become numbers.
export function normaliseProfileInput(input) {
  const output = {};
  for (const field of ALL_FIELDS) {
    const raw = input?.[field.name];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '' || value === undefined || value === null) {
      output[field.name] = null;
    } else if (field.type === 'country') {
      output[field.name] = /^\d+$/.test(String(value)) ? Number(value) : String(value);
    } else if (field.type === 'number' || field.numeric) {
      output[field.name] = Number(value);
    } else {
      output[field.name] = value;
    }
  }
  return output;
}

// Only the editable fields, so internal columns never reach the browser.
export const profileFormValues = (profile) => Object.fromEntries(COLUMN_NAMES.map((name) => [name, name === 'date_of_birth' ? dateInput(profile[name]) : profile[name] ?? '']));

/** The questions this person is shown, from their answers. `context.countries` is the country list. */
export const visibleProfileFields = (values, context) => visibleFieldNames(ALL_FIELDS, values, context);

/**
 * Checks a whole profile. Questions that do not apply to this person are emptied first, so an answer
 * left behind in a hidden question is never saved, and only visible questions can be required.
 */
export function validateProfile(input, { admin = false, context = {} } = {}) {
  const data = withoutHidden(ALL_FIELDS, normaliseProfileInput(input), context);
  const visible = visibleProfileFields(data, context);
  const errors = {};
  const output = {};
  for (const field of ALL_FIELDS) {
    const value = data[field.name];
    if (!visible.has(field.name)) { output[field.name] = null; continue; }
    const validator = validatorFor(field, admin);
    // A required field left blank fails with its own message, not a type error.
    const parsed = validator.safeParse(value === null && !validator.safeParse(null).success ? undefined : value);
    if (parsed.success) output[field.name] = parsed.data ?? null;
    else errors[field.name] = parsed.error.issues[0]?.message ?? 'Please check this field';
  }
  for (const [key, message] of Object.entries(crossFieldErrors(output, context))) if (!errors[key]) errors[key] = message;
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: output };
}

export function validateStep(sectionKey, input, options) {
  const section = SECTIONS.find((item) => item.key === sectionKey);
  const result = validateProfile(input, options);
  if (result.ok) return {};
  const names = new Set(section.fields.map((field) => field.name));
  return Object.fromEntries(Object.entries(result.errors).filter(([key]) => names.has(key)));
}

function displayValue(field, profile) {
  if (field.name === 'age') return ageFromDob(profile.date_of_birth);
  const value = profile[field.name];
  if (value === null || value === undefined || value === '') return null;
  if (field.name === 'gender') return value === 'female' ? 'Female' : 'Male';
  if (field.name === 'height_cm' || field.name === 'pref_height_min' || field.name === 'pref_height_max') return heightLabel(value);
  if (field.type === 'country') return profile.country_name ?? null;
  if (field.type === 'date') return dateInput(value);
  return value;
}

// Sections with display values, used by the staff screens.
export function profileSections(profile, { publicOnly = false } = {}) {
  return SECTIONS.map((section) => ({
    key: section.key,
    title: section.title,
    ur: section.ur,
    rows: section.fields
      .filter((field) => !(publicOnly && field.private))
      .map((field) => ({ name: field.name, label: field.label, value: displayValue(field, profile) }))
      .filter((row) => row.value !== null),
  })).filter((section) => section.rows.length > 0);
}

const FIELD_BY_NAME = Object.fromEntries(SECTIONS.flatMap((section) => section.fields).map((field) => [field.name, field]));
const show = (profile, name) => displayValue(FIELD_BY_NAME[name], profile);
const row = (label, value) => ({ label, value });
const filled = (rows) => rows.filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
const joined = (...parts) => parts.filter(Boolean).join(', ') || null;

// The traditional biodata: candidate details and partner requirements are always two separate blocks.
export function biodata(stored, code, { publicOnly = true, fullName = false, hideOther = false } = {}) {
  // Answers to questions that no longer apply (for example children details for someone never married)
  // stay in the database but are not shown.
  const profile = { ...stored, ...withoutHidden(ALL_FIELDS, stored, { countries: stored.country_id ? [{ id: stored.country_id, name: stored.country_name }] : [] }) };
  const name = publicOnly && !fullName ? profile.display_name : profile.full_name;
  const age = ageFromDob(profile.date_of_birth);
  const height = show(profile, 'height_cm');
  const children = profile.has_children === 'Yes'
    ? [profile.children_count ? `${profile.children_count} ${profile.children_count === 1 ? 'child' : 'children'}` : 'Has children', profile.children_details].filter(Boolean).join(': ')
    : profile.has_children === 'No' ? 'No children' : profile.children_details;
  const marital = [profile.marital_status, children ? `(${children})` : ''].filter(Boolean).join(' ');
  const parent = (status, occupation) => joined(status, occupation);
  const ageRange = profile.pref_age_min || profile.pref_age_max ? `${profile.pref_age_min ?? 18} – ${profile.pref_age_max ?? 80}` : null;

  return {
    code,
    name,
    headline: profile.headline_ur || null,
    verified: profile.verification_status === 'verified',
    highlights: [
      { label: 'Age', ur: 'عمر', value: age },
      { label: 'Height', ur: 'قد', value: height },
      { label: 'Caste', ur: 'ذات', value: profile.caste },
      { label: 'Marital status', ur: 'ازدواجی حیثیت', value: profile.marital_status },
    ],
    candidate: filled([
      row('Name', name),
      ...(publicOnly ? [] : [row('Date of birth', show(profile, 'date_of_birth'))]),
      row('Age', age), row('Height', height),
      row('Weight', profile.weight), row('Complexion', profile.complexion),
      row('Education', joined(profile.education_level, profile.degree)),
      row('Institution', profile.institution),
      row('Marital status', marital),
      row('Present wives', profile.existing_wives), row('Looking for another marriage', profile.second_marriage_intent),
      row('Previous marriage lasted', profile.previous_marriage_duration),
      row('Children live with', profile.children_living),
      ...(publicOnly ? [] : [row('Present family situation', profile.existing_family_situation), row('Reason for divorce or separation', profile.divorce_details), row('About the late spouse', profile.widowed_details), row('Previous spouse', profile.previous_spouse_details)]),
      row('Willing to be a second wife', profile.gender === 'female' && profile.second_wife === 'Yes' ? 'Yes' : null),
      row('Currently studying', profile.current_studies),
      row('Work details', joined(profile.occupation, profile.job_title !== profile.occupation ? profile.job_title : null)),
      row('Organization', profile.organization), row('Business', profile.business_details), row('Works in', profile.work_location),
      row('Income', hideOther ? null : profile.monthly_income), row('Caste', profile.caste),
      row('Religion', profile.religion), row('Maslak', profile.sect),
      row('Mother language', profile.mother_tongue), row('Other languages', profile.other_languages),
      row('Family status', profile.family_status),
      row('Nationality', profile.nationality),
      row('Prayers', profile.prayers), row('Smoking', profile.smoking), row('Lifestyle', profile.lifestyle),
      row('Willing to relocate', profile.willing_to_relocate), row('Hobbies', profile.hobbies),
    ]),
    residence: filled([
      row('City', [profile.city, profile.residence_area ? `(${profile.residence_area})` : ''].filter(Boolean).join(' ')),
      row('Province', profile.state), row('Country', profile.country_name), row('Home', profile.home_ownership),
      row('Property', hideOther ? null : profile.property_details),
      row('Preferred marriage location', profile.marriage_location),
      ...(publicOnly ? [] : [row('Current residence', profile.current_residence), row('Permanent residence', profile.permanent_residence)]),
    ]),
    family: filled([
      row('Father', parent(profile.father_status, profile.father_occupation)),
      row('Mother', parent(profile.mother_status, profile.mother_occupation)),
      ...(publicOnly ? [] : [row('Father’s name', profile.father_name), row('Mother’s name', profile.mother_name)]),
      row('Brothers', profile.brothers), row('Sisters', profile.sisters),
      row('Married brothers', profile.married_brothers), row('Married sisters', profile.married_sisters),
      row('Siblings’ education and professions', profile.siblings_details),
      row('Family type', profile.family_type),
      row('Family location', hideOther ? null : profile.family_location),
    ]),
    familyBackground: hideOther ? null : profile.family_background || null,
    about: [profile.description, profile.personality ? `Personality: ${profile.personality}` : null].filter(Boolean).join('\n\n') || null,
    partner: {
      demand: profile.partner_demand || null,
      rows: filled([
        row('Age', ageRange),
        row('Height', show(profile, 'pref_height_min') && show(profile, 'pref_height_max') ? `${show(profile, 'pref_height_min')} – ${show(profile, 'pref_height_max')}` : show(profile, 'pref_height_min') ? `${show(profile, 'pref_height_min')} or taller` : show(profile, 'pref_height_max') ? `Up to ${show(profile, 'pref_height_max')}` : null),
        row('Complexion', profile.pref_complexion),
        row('Education', profile.pref_education), row('Profession', profile.pref_profession),
        row('Caste', profile.pref_caste), row('Country', profile.pref_country), row('City', profile.pref_city),
        row('Marital status', profile.pref_marital_status),
        row('Religion', profile.pref_religion), row('Sect', profile.pref_sect),
        row('Family type', profile.pref_family_type), row('Family status', profile.pref_family_status),
        row('Divorced or widowed partner', profile.accept_divorced), row('Partner with children', profile.accept_children),
        row('Overseas proposals', profile.overseas_ok), row('Move abroad after marriage', profile.relocate_abroad),
        row('Religious or cultural preferences', profile.pref_cultural), row('Qualities expected', profile.pref_qualities),
      ]),
    },
    contact: publicOnly ? [] : filled([row('Phone', profile.contact_phone), row('WhatsApp', profile.contact_whatsapp), row('Email', profile.contact_email)]),
  };
}

export function biodataToText(data, t = (text) => text) {
  const lines = [`AL ZAUJAIN | ${t('Marriage Bureau Multan Pakistan')}`, `${t('Profile')} ${data.code}`, ''];
  if (data.headline) lines.push(data.headline, '');
  const block = (title, rows) => {
    if (rows.length === 0) return;
    lines.push(t(title));
    for (const item of rows) lines.push(`${t(item.label)}: ${t(item.value)}`);
    lines.push('');
  };
  const paragraph = (title, text) => {
    if (text) lines.push(t(title), text, '');
  };
  block('CANDIDATE INFORMATION', data.candidate);
  block('RESIDENCE', data.residence);
  block('FAMILY DETAILS', data.family);
  paragraph('FAMILY BACKGROUND', data.familyBackground);
  paragraph('ABOUT THE CANDIDATE', data.about);
  paragraph('رشتے کی ضروریات / PARTNER REQUIREMENTS', data.partner.demand);
  block('PREFERRED PARTNER', data.partner.rows);
  block('CONTACT', data.contact);
  return lines.join('\n').trim();
}

const hasValue = (value) => value !== null && value !== undefined && value !== '';

// How complete a profile is, section by section, so the dashboard can point at what is missing.
export function profileCompletion(profile, { photos = 0, hasCnic = false } = {}) {
  const groups = [
    { label: 'Personal details', href: 'edit', fields: ['height_cm', 'marital_status', 'mother_tongue', 'caste', 'nationality', 'description'] },
    { label: 'Education and work', href: 'edit', fields: ['education_level', 'degree', 'occupation', 'employment_status'] },
    { label: 'Religious details', href: 'edit', fields: ['religion', 'sect'] },
    { label: 'Residence', href: 'edit', fields: ['city', 'residence_area', 'home_ownership'] },
    { label: 'Family details', href: 'edit', fields: ['father_status', 'mother_status', 'brothers', 'sisters', 'family_status'] },
    { label: 'Partner requirements', href: 'preferences', fields: ['partner_demand', 'pref_age_min', 'pref_age_max'] },
  ].map((group) => ({ label: group.label, href: group.href, done: group.fields.filter((name) => hasValue(profile[name])).length / group.fields.length }));
  groups.push({ label: 'Profile photograph', href: 'edit', done: photos > 0 ? 1 : 0 });
  groups.push({ label: 'CNIC for the blue tick', href: 'edit', done: hasCnic ? 1 : 0 });
  const percent = Math.round((groups.reduce((sum, group) => sum + group.done, 0) / groups.length) * 100);
  return { percent, groups, missing: groups.filter((group) => group.done < 1) };
}

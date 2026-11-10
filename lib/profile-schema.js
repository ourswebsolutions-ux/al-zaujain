// The single definition of a matrimonial profile. The multi-step form, client and server
// validation, the copy-to-clipboard text and the image/PDF export are all driven from here.
import { z } from 'zod';
import { ageFromDob, dateInput, heightLabel } from './format.js';

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

export const SECTIONS = [
  { key: 'personal', title: 'Candidate personal information', ur: 'امیدوار کی ذاتی معلومات', fields: [
    text('headline_ur', 'Profile heading in Urdu', 200, { dir: 'auto', wide: true, hint: 'Optional. Shown at the top of the biodata, for example the candidate’s name in Urdu.' }),
    text('full_name', 'Full name', 100, { required: true, private: true, hint: 'Only your first name is shown publicly.' }),
    select('gender', 'Gender', OPTIONS.gender, { required: true }),
    { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true, private: true, hint: 'Must be 18 or older. Only your age is shown.' },
    { name: 'age', label: 'Age', type: 'derived' },
    select('height_cm', 'Height', HEIGHTS, { required: true, numeric: true }),
    select('marital_status', 'Marital status', OPTIONS.marital_status, { required: true }),
    text('children_details', 'Children', 60, { placeholder: 'e.g. No kids', hint: 'For divorced or widowed candidates.' }),
    select('second_wife', 'Willing to be a second wife?', ['Yes', 'No'], { hint: 'For female candidates only. Leave empty if it does not apply. Only “Yes” lists the profile under Second Marriage Proposals.' }),
    select('mother_tongue', 'Mother language', OPTIONS.mother_tongue, { required: true }),
    text('caste', 'Caste / Biradari', 60, { required: true, placeholder: 'Choose, or type your own', suggest: 'castes', hint: 'Not in the list? Type your caste and choose “Use …”, or just leave the field.' }),
    text('nationality', 'Nationality', 60, { required: true, placeholder: 'e.g. Pakistani', suggest: 'nationalities' }),
    { name: 'origin_country', label: 'Country of origin', type: 'country-name', required: true },
    text('origin_city', 'Home city', 80, { required: true, suggest: 'cities' }),
    select('profile_created_by', 'Profile created by', OPTIONS.profile_created_by, { required: true }),
    area('description', 'About the candidate', 1500, { required: true, dir: 'auto', hint: 'A few lines about the person, their nature and goals. Please do not include phone numbers.' }),
    text('contact_phone', 'Phone number', 20, { required: true, private: true, pattern: 'phone', placeholder: '0300 1234567' }),
    text('contact_whatsapp', 'WhatsApp number', 20, { private: true, pattern: 'phone', placeholder: '0300 1234567' }),
    { name: 'contact_email', label: 'Email address', type: 'email', max: 160, required: true, private: true },
  ] },
  { key: 'education', title: 'Education and professional details', ur: 'تعلیم اور پیشہ', fields: [
    select('education_level', 'Education', OPTIONS.education_level, { required: true }),
    text('degree', 'Degree', 100, { placeholder: 'e.g. MSc Mathematics' }),
    text('institution', 'Institution', 120),
    area('other_qualifications', 'Other qualifications', 500),
    text('occupation', 'Occupation', 100, { required: true, placeholder: 'e.g. Teacher, Own work' }),
    text('job_title', 'Work details', 100, { placeholder: 'Job title or nature of the work' }),
    select('employment_status', 'Employment status', OPTIONS.employment_status, { required: true }),
    text('monthly_income', 'Monthly income', 40, { placeholder: 'e.g. 80K', hint: 'Shown on your biodata. Leave blank to keep it off.' }),
    area('business_details', 'Business details', 500),
  ] },
  { key: 'religious', title: 'Religious information', ur: 'مذہبی معلومات', fields: [
    select('religion', 'Religion', OPTIONS.religion, { required: true }),
    select('sect', 'Maslak / Sect', OPTIONS.sect),
    select('religious_practices', 'Religious practices', OPTIONS.religious_practices),
    area('religious_details', 'Other relevant details', 500),
  ] },
  { key: 'residential', title: 'Residence details', ur: 'رہائش کی تفصیلات', fields: [
    { name: 'country_id', label: 'Country', type: 'country', required: true },
    text('state', 'State / Province', 80),
    text('city', 'City', 80, { required: true, suggest: 'cities' }),
    text('marriage_location', 'Preferred marriage location', 120, { suggest: 'marriage-places', placeholder: 'e.g. Pakistan, Overseas, UK', hint: 'Where the family would like the couple to live after marriage.' }),
    select('residence_area', 'Area', OPTIONS.residence_area),
    select('home_ownership', 'Home', OPTIONS.home_ownership),
    text('current_residence', 'Current residence', 200, { private: true, placeholder: 'Area and type of house' }),
    text('permanent_residence', 'Permanent residence', 200, { private: true }),
  ] },
  { key: 'family', title: 'Family information', ur: 'خاندانی معلومات', fields: [
    select('father_status', 'Father', OPTIONS.parent_status),
    select('mother_status', 'Mother', OPTIONS.parent_status),
    text('father_occupation', 'Father’s occupation', 100),
    text('mother_occupation', 'Mother’s occupation', 100),
    number('brothers', 'Number of brothers', 0, 20),
    number('sisters', 'Number of sisters', 0, 20),
    select('family_status', 'Family status', OPTIONS.family_status),
    text('family_location', 'Family location', 120),
    area('family_background', 'Family background', 800),
  ] },
  { key: 'partner', title: 'Partner requirements / demand', ur: 'رشتے کی ضروریات', fields: [
    area('partner_demand', 'Partner requirements', 5000, { required: true, dir: 'auto', rows: 8, hint: 'Describe the proposal and what you are looking for, in Urdu or English, in as much detail as you like.' }),
    number('pref_age_min', 'Preferred age from', 18, 80),
    number('pref_age_max', 'Preferred age to', 18, 80),
    select('pref_height_min', 'Preferred height (minimum)', HEIGHTS, { numeric: true }),
    text('pref_education', 'Education', 100),
    text('pref_profession', 'Profession', 100),
    text('pref_caste', 'Caste / Biradari', 60, { suggest: 'castes', placeholder: 'Choose, or type your own' }),
    { name: 'pref_country', label: 'Country', type: 'country-name' },
    text('pref_city', 'City', 80, { suggest: 'cities' }),
    select('pref_marital_status', 'Marital status', OPTIONS.marital_status),
  ] },
  { key: 'documents', title: 'Profile photograph and documents', ur: 'تصویر اور دستاویزات', fields: [] },
];

export const ALL_FIELDS = SECTIONS.flatMap((section) => section.fields).filter((field) => field.type !== 'derived');
export const COLUMN_NAMES = ALL_FIELDS.map((field) => field.name);

const PHONE = /^[+0-9\s()-]{7,20}$/;

function fieldValidator(field) {
  const optional = (schema) => (field.required ? schema : schema.nullable().optional());
  const required = `${field.label} is required`;
  switch (field.type) {
    case 'number':
      return optional(z.number({ error: `${field.label} must be a number` }).int().min(field.min, `${field.label} must be at least ${field.min}`).max(field.max, `${field.label} must be at most ${field.max}`));
    case 'country':
      return z.number({ error: required }).int().positive(required);
    case 'date':
      return z.string({ error: required }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');
    case 'email':
      return optional(z.email({ error: 'Enter a valid email address' }).max(field.max));
    case 'select': {
      if (field.numeric) return optional(z.number({ error: required }).int().min(100).max(250));
      const values = field.options.map((option) => (Array.isArray(option) ? option[0] : option));
      return optional(z.enum(values, { error: field.required ? required : `Choose a valid ${field.label.toLowerCase()}` }));
    }
    default: {
      let schema = z.string({ error: required }).max(field.max ?? 120, `${field.label} is too long`);
      if (field.required) schema = schema.min(1, required);
      if (field.pattern === 'phone') schema = schema.regex(PHONE, 'Enter a valid phone number');
      return optional(schema);
    }
  }
}

const SHAPE = Object.fromEntries(ALL_FIELDS.map((field) => [field.name, fieldValidator(field)]));

// Profiles the team creates from a pasted biodata often lack details a member must give,
// so administrators only need what the database and listings cannot do without.
export const ADMIN_REQUIRED = new Set(['full_name', 'gender', 'date_of_birth', 'marital_status', 'country_id', 'city']);
const ADMIN_SHAPE = Object.fromEntries(ALL_FIELDS.map((field) => [field.name, fieldValidator({ ...field, required: ADMIN_REQUIRED.has(field.name) })]));

// These run even when other fields are still incomplete, so step 1 can reject an under-18.
function crossFieldErrors(data) {
  const errors = {};
  if (data.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth)) {
    const age = ageFromDob(data.date_of_birth);
    if (age === null || age > 100 || age < 0) errors.date_of_birth = 'Enter a valid date of birth';
    else if (age < 18) errors.date_of_birth = 'Al Zaujain is for adults: you must be at least 18';
  }
  if (data.pref_age_min && data.pref_age_max && data.pref_age_min > data.pref_age_max) {
    errors.pref_age_max = 'The “to” age must not be below the “from” age';
  }
  return errors;
}

export const profileValidator = z.object(SHAPE);
const adminValidator = z.object(ADMIN_SHAPE);

// Form inputs arrive as strings: trim them, blank becomes null, numbers become numbers.
export function normaliseProfileInput(input) {
  const output = {};
  for (const field of ALL_FIELDS) {
    const raw = input?.[field.name];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '' || value === undefined || value === null) {
      output[field.name] = null;
    } else if (field.type === 'number' || field.type === 'country' || field.numeric) {
      output[field.name] = Number(value);
    } else {
      output[field.name] = value;
    }
  }
  return output;
}

// Only the editable fields, so internal columns never reach the browser.
export const profileFormValues = (profile) => Object.fromEntries(COLUMN_NAMES.map((name) => [name, name === 'date_of_birth' ? dateInput(profile[name]) : profile[name] ?? '']));

export function validateProfile(input, { admin = false } = {}) {
  const data = normaliseProfileInput(input);
  const [shape, validator] = admin ? [ADMIN_SHAPE, adminValidator] : [SHAPE, profileValidator];
  // Required fields that are blank must fail with their own message, not a type error.
  const parsed = validator.safeParse(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === null && shape[key].safeParse(null).success === false ? undefined : value])));
  const errors = {};
  for (const issue of parsed.success ? [] : parsed.error.issues) {
    const key = issue.path[0];
    if (key && !errors[key]) errors[key] = issue.message;
  }
  Object.assign(errors, crossFieldErrors(data));
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: parsed.data };
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
  if (field.name === 'height_cm' || field.name === 'pref_height_min') return heightLabel(value);
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
export function biodata(profile, code, { publicOnly = true, fullName = false, hideOther = false } = {}) {
  const name = publicOnly && !fullName ? profile.display_name : profile.full_name;
  const age = ageFromDob(profile.date_of_birth);
  const height = show(profile, 'height_cm');
  const marital = [profile.marital_status, profile.children_details ? `(${profile.children_details})` : ''].filter(Boolean).join(' ');
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
      row('Name', `${name} (${code})`),
      ...(publicOnly ? [] : [row('Date of birth', show(profile, 'date_of_birth'))]),
      row('Age', age), row('Height', height),
      row('Education', joined(profile.education_level, profile.degree)),
      row('Marital status', marital),
      row('Willing to be a second wife', profile.gender === 'female' && profile.second_wife === 'Yes' ? 'Yes' : null),
      row('Work details', joined(profile.occupation, profile.job_title !== profile.occupation ? profile.job_title : null)),
      row('Income', hideOther ? null : profile.monthly_income), row('Caste', profile.caste),
      row('Religion', profile.religion), row('Maslak', profile.sect),
      row('Mother language', profile.mother_tongue), row('Family status', profile.family_status),
      row('Nationality', profile.nationality),
    ]),
    residence: filled([
      row('City', [profile.city, profile.residence_area ? `(${profile.residence_area})` : ''].filter(Boolean).join(' ')),
      row('Province', profile.state), row('Country', profile.country_name), row('Home', profile.home_ownership),
      row('Preferred marriage location', profile.marriage_location),
      ...(publicOnly ? [] : [row('Current residence', profile.current_residence), row('Permanent residence', profile.permanent_residence)]),
    ]),
    family: filled([
      row('Father', parent(profile.father_status, profile.father_occupation)),
      row('Mother', parent(profile.mother_status, profile.mother_occupation)),
      row('Brothers', profile.brothers), row('Sisters', profile.sisters),
      row('Family location', hideOther ? null : profile.family_location),
    ]),
    familyBackground: hideOther ? null : profile.family_background || null,
    about: profile.description || null,
    partner: {
      demand: profile.partner_demand || null,
      rows: filled([
        row('Age', ageRange), row('Height', show(profile, 'pref_height_min') ? `${show(profile, 'pref_height_min')} or taller` : null),
        row('Education', profile.pref_education), row('Profession', profile.pref_profession),
        row('Caste', profile.pref_caste), row('Country', profile.pref_country), row('City', profile.pref_city),
        row('Marital status', profile.pref_marital_status),
      ]),
    },
    contact: publicOnly ? [] : filled([row('Phone', profile.contact_phone), row('WhatsApp', profile.contact_whatsapp), row('Email', profile.contact_email)]),
  };
}

export function biodataToText(data, t = (text) => text) {
  const lines = [`AL ZAUJAIN | ${t('International Marriage Consultancy')}`, `${t('Profile')} ${data.code}`, ''];
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

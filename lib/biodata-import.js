// Reads a pasted biodata (WhatsApp, Word, PDF text or our own export) into profile form values.
// Nothing is thrown away: every line is either placed in a field or kept in `unassigned`.
import { HEIGHTS, OPTIONS } from './profile-schema.js';

// Section headings, in English and Urdu. The key decides how lines underneath are read.
const SECTIONS = [
  ['candidate', /^(candidate|personal)\s*(information|info|details|profile)?$|^امیدوار|^ذاتی\s*معلومات/i],
  ['education', /^(education|educational|professional)\s*(and\s*professional)?\s*(details|information|info)?$|^تعلیم/i],
  ['religion', /^religio(n|us)\s*(information|details)?$|^مذہبی/i],
  ['residence', /^(residence|residential|address|location)\s*(details|information)?$|^رہائش/i],
  ['family', /^family\s*(details|information|info)$|^خاندانی\s*معلومات|^خاندان$/i],
  ['background', /^family\s*background$|^خاندانی\s*پس\s*منظر/i],
  ['about', /^(about|about\s*(the|me|candidate|the\s*candidate)|description)$|^امیدوار\s*کے\s*بارے/i],
  ['demand', /partner\s*requirements?|requirements?$|^demand$|رشتے\s*کی\s*ضروریات|^مطلوبہ\s*رشتہ|^ڈیمانڈ/i],
  ['preferred', /^(preferred|desired|expected)\s*(partner|match)|^partner\s*preferences?$|^looking\s*for$/i],
  ['contact', /^contact(\s*(details|information|info))?$|^رابطہ$/i],
];
const PARAGRAPHS = new Set(['background', 'about', 'demand']);

// Label synonyms. A label's meaning can depend on the section it appears in.
const LABELS = [
  ['full_name', /^(full\s*)?name|^candidate(\s*name)?$|^نام$/i],
  ['gender', /^gender|^sex$|^جنس$/i],
  ['date_of_birth', /^(date\s*of\s*birth|dob|d\.o\.b|birth\s*date|born)$|^تاریخ\s*پیدائش/i],
  ['age', /^age$|^عمر$/i],
  ['height_cm', /^height$|^قد$/i],
  ['education', /^(education|qualification|qualifications)$|^تعلیم$/i],
  ['degree', /^degree$/i],
  ['institution', /^(institution|university|college|school)$/i],
  ['marital_status', /^(marital\s*status|status|marital)$|^ازدواجی\s*حیثیت/i],
  ['children_details', /^(children|kids)$|^بچے$/i],
  ['work', /^(work(\s*details)?|occupation|profession|job|employment|working\s*as)$|^پیشہ$|^نوکری$|^کاروبار$/i],
  ['monthly_income', /^(income|monthly\s*income|salary)$|^آمدن/i],
  ['employment_status', /^employment\s*status$/i],
  ['caste', /^(caste|cast|biradari|caste\s*\/\s*biradari)$|^ذات|^برادری$/i],
  ['religion', /^religion$|^مذہب$/i],
  ['sect', /^(maslak|sect|firqa)$|^مسلک$|^فرقہ$/i],
  ['religious_practices', /^(religious\s*practices?|practising)$/i],
  ['mother_tongue', /^(mother\s*(language|tongue)|language)$|^مادری\s*زبان|^زبان$/i],
  ['family_status', /^(family\s*status|class)$/i],
  ['nationality', /^nationality$|^قومیت$/i],
  ['profile_created_by', /^profile\s*created\s*by$/i],
  ['city', /^city$|^شہر$/i],
  ['state', /^(province|state)$|^صوبہ$/i],
  ['country', /^(country|country\s*of\s*residence)$|^ملک$/i],
  ['home_ownership', /^(home|house)$|^گھر$|^مکان$/i],
  ['current_residence', /^(current\s*residence|current\s*address|address)$|^موجودہ\s*رہائش/i],
  ['permanent_residence', /^(permanent\s*residence|permanent\s*address)$|^مستقل\s*رہائش/i],
  ['marriage_location', /^(preferred\s*(marriage\s*)?location|marriage\s*location|settle(ment)?(\s*after\s*marriage)?|after\s*marriage|preferred\s*place|willing\s*to\s*(settle|relocate)(\s*in)?)$|^شادی\s*کے\s*بعد|^رہائش\s*بعد\s*از\s*شادی/i],
  ['origin_city', /^(home\s*city|native\s*city|hometown|origin\s*city)$|^آبائی\s*شہر/i],
  ['origin_country', /^(country\s*of\s*origin|origin)$/i],
  ['father', /^father$|^والد$/i],
  ['mother', /^mother$|^والدہ$/i],
  ['brothers', /^(brothers?|no\.?\s*of\s*brothers)$|^بھائی$/i],
  ['sisters', /^(sisters?|no\.?\s*of\s*sisters)$|^بہنیں$|^بہن$/i],
  ['family_location', /^family\s*location$/i],
  ['contact_phone', /^(phone|mobile|cell|contact|contact\s*no\.?|phone\s*number|mobile\s*number)$|^فون$|^موبائل$|^رابطہ\s*نمبر/i],
  ['contact_whatsapp', /^(whatsapp|whats\s*app|wa)$|^واٹس\s*ایپ$/i],
  ['contact_email', /^(email|e-mail|email\s*address)$|^ای\s*میل$/i],
  ['profession', /^profession$/i],
  ['demand', /^(requirements?|demand|partner\s*requirements?|looking\s*for|required)$|^ضرورت$|^ڈیمانڈ$|^مطلوب/i],
];

const PREFERRED = { age: 'pref_age', height_cm: 'pref_height_min', education: 'pref_education', work: 'pref_profession', profession: 'pref_profession', caste: 'pref_caste', country: 'pref_country', city: 'pref_city', marital_status: 'pref_marital_status' };

// Our own export starts with these lines; they carry no profile information.
const BRANDING = /^al\s*zaujain\b.*(consultancy|bureau)|^international\s*marriage\s*consultancy$/i;
const OLD_CODE = /^profile\s*(id|code|no\.?)?\s*[:#-]?\s*([a-z]{1,4}-?\d{1,6})$/i;

const URDU = /[؀-ۿ]/;
const clean = (line) => line.replace(/[*_~`]+/g, '').replace(/^[\s\-–—•▪️▫️◾◽●○■□➤➢►▶✓✔☑️👉🔹🔸⭐🌹💐✨📌📍:]+/u, '').replace(/\s+/g, ' ').trim();
const normal = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Picks the option that best matches free text, or null.
function pick(options, text) {
  if (!text) return null;
  const values = options.map((option) => (Array.isArray(option) ? option[0] : option));
  const wanted = normal(text);
  // Urdu (or symbols only) normalises to nothing: that must not match the first option of the list.
  if (!wanted) return null;
  const exact = values.find((value) => normal(value) === wanted);
  if (exact) return exact;
  return values.find((value) => wanted.startsWith(normal(value)) || normal(value).startsWith(wanted)) ?? null;
}

const MARITAL = [[/never|single|unmarried|کنوار|غیر\s*شادی/i, 'Never married'], [/divorc|طلاق/i, 'Divorced'], [/widow|بیوہ|رنڈوا/i, 'Widowed'], [/separat|علیحدگی/i, 'Separated'], [/second\s*marriage|married/i, 'Married (seeking second marriage)']];
const marital = (text) => MARITAL.find(([pattern]) => pattern.test(text))?.[1] ?? null;

const EDUCATION = [[/پی\s*ایچ\s*ڈی/, 'PhD'], [/ایم\s*فل/, 'MPhil'], [/ایم\s*بی\s*بی\s*ایس|ڈاکٹر|انجینئر|ایل\s*ایل\s*بی/, 'Professional (MBBS, CA, LLB)'], [/ایم\s*(اے|ایس|بی\s*اے|کام|ایڈ)|ماسٹر/, 'Masters'], [/بی\s*(اے|ایس|کام|ایڈ|بی\s*اے)|بیچلر|گریجویٹ/, 'Bachelors'], [/ڈپلومہ/, 'Diploma'], [/ایف\s*(اے|ایس)|انٹر/, 'Intermediate'], [/میٹرک/, 'Matric'], [/حافظ|عالم|درس/, 'Hafiz / Alim'], [/ph\.?\s*d|doctorate/i, 'PhD'], [/m\.?\s*phil/i, 'MPhil'], [/mbbs|bds|\bca\b|acca|llb|pharm\s*d|doctor|engineer/i, 'Professional (MBBS, CA, LLB)'], [/master|\bm\.?\s*(sc|a|com|ba|cs|ed|s)\b|\bms\b/i, 'Masters'], [/bachelor|graduat|\bb\.?\s*(sc|a|com|ba|cs|ed|s|e)\b|\bbs\b/i, 'Bachelors'], [/diploma|dae/i, 'Diploma'], [/inter|f\.?\s*(sc|a)\b|i\.?\s*com|a[\s-]?level/i, 'Intermediate'], [/matric|o[\s-]?level|ssc/i, 'Matric'], [/hafiz|alim|aalim|dars/i, 'Hafiz / Alim']];

function education(text) {
  const [first, ...rest] = text.split(/\s*,\s*/);
  const level = pick(OPTIONS.education_level, first) ?? EDUCATION.find(([pattern]) => pattern.test(text))?.[1] ?? null;
  const exactFirst = pick(OPTIONS.education_level, first);
  return { education_level: level, degree: (exactFirst ? rest.join(', ') : text) || null };
}

// 5'4", 5.4, 5 ft 4 in, 165 cm → the nearest height option in centimetres.
function height(text) {
  let inches = null;
  const cm = /(\d{3})\s*cm/i.exec(text);
  const feet = /(\d)\s*(?:'|’|ft|feet|foot|فٹ|\.|-)\s*(\d{1,2})?/i.exec(text);
  if (cm) inches = Number(cm[1]) / 2.54;
  else if (feet) inches = Number(feet[1]) * 12 + (Number(feet[2]) || 0);
  if (!inches) return null;
  let best = null;
  for (const [value] of HEIGHTS) if (!best || Math.abs(value / 2.54 - inches) < Math.abs(best / 2.54 - inches)) best = value;
  return Math.abs(best / 2.54 - inches) <= 1 ? best : null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (value) => String(value).padStart(2, '0');

// 1999-01-01, 01-01-1999, 1/1/1999, 1 Jan 1999 or January 1, 1999 → yyyy-mm-dd.
export function parseDate(text) {
  let match = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(text);
  if (match) return valid(match[1], match[2], match[3]);
  match = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(text);
  if (match) return valid(match[3], match[2], match[1]);
  match = /(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,})\.?,?\s+(\d{4})/i.exec(text);
  if (match && MONTHS.includes(match[2].slice(0, 3).toLowerCase())) return valid(match[3], MONTHS.indexOf(match[2].slice(0, 3).toLowerCase()) + 1, match[1]);
  match = /([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i.exec(text);
  if (match && MONTHS.includes(match[1].slice(0, 3).toLowerCase())) return valid(match[3], MONTHS.indexOf(match[1].slice(0, 3).toLowerCase()) + 1, match[2]);
  return null;
}

function valid(year, month, day) {
  const value = `${year}-${pad(month)}-${pad(day)}`;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.getUTCMonth() + 1 === Number(month) ? value : null;
}

// Only an age is known: choose a birth date that gives exactly that age today.
function dateFromAge(age, now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - 182);
  return date.toISOString().slice(0, 10);
}

function parent(text) {
  const status = /late|deceas|expired|died|passed|مرحوم|وفات/i.test(text) ? 'Deceased' : /alive|living|حیات|زندہ/i.test(text) ? 'Alive' : null;
  const occupation = text.replace(/^(alive|living|late|deceased|expired|died|passed away|حیات|مرحوم|زندہ)\s*[,،-]?\s*/i, '').trim();
  return { status, occupation: occupation && occupation !== text.trim() ? occupation : status ? null : text.trim() };
}

const firstNumber = (text) => { const match = /\d+/.exec(text); return match ? Number(match[0]) : null; };
const phone = (text) => (/[+0-9][0-9\s()-]{6,19}/.exec(text)?.[0] ?? '').trim() || null;

const FEMALE = /\b(she|her|daughter|bride|girl|female)\b|لڑکی|بیٹی|دلہن/gi;
const MALE = /\b(he|his|him|son|groom|boy|male)\b|لڑکا|لڑکے|بیٹا|بیٹے|دولہا/gi;
// "لڑکے کا رشتہ" / "Rishta for boy" at the top says outright whose biodata it is.
const FOR_MALE = /لڑکے\s*کا\s*رشتہ|رشتہ\s*(برائے|for)\s*(لڑکا|boy)|\b(groom|boy)'?s?\s*(rishta|proposal|biodata)\b|\brishta\s*for\s*(boy|son|groom)\b/i;
const FOR_FEMALE = /لڑکی\s*کا\s*رشتہ|رشتہ\s*(برائے|for)\s*(لڑکی|girl)|\b(bride|girl)'?s?\s*(rishta|proposal|biodata)\b|\brishta\s*for\s*(girl|daughter|bride)\b/i;

// Who the biodata is about. Words about the candidate count for that gender; words in the
// partner requirements describe the other side, so they count the opposite way.
function guessGender(candidateText, demandText) {
  const count = (text, pattern) => (text?.match(pattern) ?? []).length;
  const score = count(candidateText, FEMALE) - count(candidateText, MALE) + count(demandText, MALE) - count(demandText, FEMALE);
  return score > 0 ? 'female' : score < 0 ? 'male' : null;
}

function splitLabel(line) {
  const match = /^([^:：]{1,40}?)\s*[:：]\s*(.*)$/.exec(line);
  if (match) return [match[1].trim(), match[2].trim()];
  // "Name - Ayesha" is only read as a label when the left side is a known label.
  const dash = /^(.{1,30}?)\s+[-–—=]\s+(.+)$/.exec(line);
  if (dash && LABELS.some(([, pattern]) => pattern.test(dash[1].trim()))) return [dash[1].trim(), dash[2].trim()];
  return null;
}

export function parseBiodata(input) {
  const values = {};
  const unassigned = [];
  const paragraphs = { background: [], about: [], demand: [] };
  let section = 'candidate';
  let headingSeen = false;
  const keep = (line) => { if (!unassigned.includes(line)) unassigned.push(line); };
  const candidateText = [];
  const demandText = [];

  const set = (name, value) => {
    if (value === null || value === undefined || value === '') return false;
    if (values[name] !== undefined && values[name] !== '' && values[name] !== value) return false;
    values[name] = value;
    return true;
  };

  const place = (key, value, raw) => {
    if (!value) return true;
    if (section === 'preferred' && PREFERRED[key]) {
      if (key === 'age') {
        const [low, high] = value.match(/\d{2}/g) ?? [];
        return set('pref_age_min', Number(low)) & set('pref_age_max', Number(high ?? low)) ? true : false;
      }
      if (key === 'height_cm') return set('pref_height_min', height(value));
      if (key === 'marital_status') return set('pref_marital_status', marital(value) ?? pick(OPTIONS.marital_status, value));
      return set(PREFERRED[key], value);
    }
    switch (key) {
      case 'full_name': {
        const name = value.replace(/\s*\(([a-z]{1,4}-?\d+)\)\s*$/i, '').trim();
        if (name !== value) keep(`Original reference: ${/\(([^)]+)\)\s*$/.exec(value)[1]}`);
        return set('full_name', name);
      }
      case 'gender': return set('gender', /f|girl|bride|لڑکی/i.test(value) ? 'female' : /m|boy|groom|لڑکا/i.test(value) ? 'male' : null);
      case 'date_of_birth': return set('date_of_birth', parseDate(value));
      case 'age': {
        const age = firstNumber(value);
        values._age = age;
        return age !== null;
      }
      case 'height_cm': return set('height_cm', height(value));
      case 'education': {
        const result = education(value);
        return set('education_level', result.education_level) | set('degree', result.degree) ? true : false;
      }
      case 'marital_status': return set('marital_status', marital(value) ?? pick(OPTIONS.marital_status, value));
      case 'work': {
        const [occupation, ...rest] = value.split(/\s*,\s*/);
        set('occupation', occupation);
        if (rest.length) set('job_title', rest.join(', '));
        return true;
      }
      case 'profession': return set('occupation', value);
      case 'employment_status': return set('employment_status', pick(OPTIONS.employment_status, value));
      case 'religion': return set('religion', pick(OPTIONS.religion, value) ?? (/muslim|اسلام/i.test(value) ? 'Islam' : null));
      case 'sect': return set('sect', pick(OPTIONS.sect, value));
      case 'religious_practices': return set('religious_practices', pick(OPTIONS.religious_practices, value));
      case 'mother_tongue': return set('mother_tongue', pick(OPTIONS.mother_tongue, value));
      case 'family_status': return set('family_status', pick(OPTIONS.family_status, value));
      case 'profile_created_by': return set('profile_created_by', pick(OPTIONS.profile_created_by, value));
      case 'city': {
        const area = /\((city|town|village)\)/i.exec(value);
        if (area) set('residence_area', pick(OPTIONS.residence_area, area[1]));
        return set('city', value.replace(/\s*\([^)]*\)\s*/g, '').trim());
      }
      case 'country': return set('country', value);
      case 'home_ownership': return set('home_ownership', pick(OPTIONS.home_ownership, value) ?? (/own|ذاتی/i.test(value) ? 'Own' : /rent|کرائ/i.test(value) ? 'Rented' : null));
      case 'current_residence':
      case 'permanent_residence': return set(key, value.replace(/\s*\(private\)\s*$/i, '').trim());
      case 'father':
      case 'mother': {
        const result = parent(value);
        set(`${key}_status`, result.status);
        if (result.occupation) set(`${key}_occupation`, result.occupation);
        return true;
      }
      case 'brothers':
      case 'sisters': {
        const count = firstNumber(value);
        if (count === null) return false;
        set(key, count);
        if (value.replace(/\d+/, '').trim()) keep(`${raw}`);
        return true;
      }
      case 'contact_phone':
      case 'contact_whatsapp': return set(key, phone(value));
      case 'contact_email': return set('contact_email', /\S+@\S+\.\S+/.exec(value)?.[0] ?? null);
      case 'demand': paragraphs.demand.push(value); demandText.push(value); return true;
      default: return set(key, value);
    }
  };

  for (const original of String(input ?? '').replace(/\r/g, '').split('\n')) {
    const line = clean(original);
    if (!line) continue;
    if (BRANDING.test(line)) continue;
    const code = OLD_CODE.exec(line);
    if (code) { keep(`Original reference: ${code[2].toUpperCase()}`); continue; }

    const heading = SECTIONS.find(([, pattern]) => pattern.test(line.replace(/[:：]$/, '')));
    // "رشتے کی ضروریات / PARTNER REQUIREMENTS" style bilingual headings.
    const bilingual = !heading && line.length < 60 && SECTIONS.find(([, pattern]) => line.split(/\s*[/|]\s*/).some((part) => pattern.test(part.trim())));
    const found = heading ?? bilingual;
    if (found && line.length <= 60 && !splitLabel(line)?.[1]) {
      section = found[0];
      headingSeen = true;
      continue;
    }

    if (PARAGRAPHS.has(section)) {
      // Contact details often follow the requirements without a heading of their own.
      const contactPair = splitLabel(line);
      const contactKey = contactPair && LABELS.find(([, pattern]) => pattern.test(contactPair[0]))?.[0];
      if (contactKey?.startsWith('contact_') && place(contactKey, contactPair[1], line)) continue;
      if (section !== 'demand') candidateText.push(line);
      else demandText.push(line);
      paragraphs[section].push(original.trim().replace(/^[*_]+|[*_]+$/g, ''));
      continue;
    }

    if (section === 'preferred') demandText.push(line);
    else candidateText.push(line);
    const pair = splitLabel(line);
    if (pair) {
      const [label, value] = pair;
      const key = LABELS.find(([, pattern]) => pattern.test(label))?.[0];
      if (key && place(key, value, line)) continue;
      keep(line);
      continue;
    }

    // An Urdu line before any heading is usually the candidate's name, shown as the Urdu heading.
    if (!headingSeen && URDU.test(line) && !values.headline_ur && line.length <= 200) { values.headline_ur = line; continue; }
    keep(line);
  }

  const joinParagraph = (lines) => lines.join('\n').trim() || null;
  if (paragraphs.background.length) set('family_background', joinParagraph(paragraphs.background));
  if (paragraphs.about.length) set('description', joinParagraph(paragraphs.about));
  if (paragraphs.demand.length) set('partner_demand', joinParagraph(paragraphs.demand));

  if (!values.date_of_birth && values._age) {
    values.date_of_birth = dateFromAge(values._age);
    unassigned.push(`Age given as ${values._age}. The date of birth was estimated, please correct it.`);
  }
  delete values._age;
  if (!values.gender && FOR_MALE.test(input)) values.gender = 'male';
  if (!values.gender && FOR_FEMALE.test(input)) values.gender = 'female';
  if (!values.gender) {
    const gender = guessGender(candidateText.join('\n'), demandText.join('\n'));
    if (gender) values.gender = gender;
  }
  // Most biodatas are from Pakistan and do not say so: fill it in, and say so, so it can be changed.
  if (!values.country && (values.city || URDU.test(input))) {
    values.country = 'Pakistan';
    unassigned.push('Country was not given, so Pakistan was filled in. Please change it if needed.');
  }
  if (!values.nationality && values.country === 'Pakistan') values.nationality = 'Pakistani';
  if (!values.contact_whatsapp && values.contact_phone && /whats\s*app/i.test(input)) values.contact_whatsapp = values.contact_phone;
  if (!values.origin_city && values.city) values.origin_city = values.city;
  return { values, unassigned };
}

// The same biodata pasted twice gives the same fingerprint, whatever the spacing or emoji.
export function biodataFingerprint(text) {
  return String(text ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

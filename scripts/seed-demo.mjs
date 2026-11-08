// Adds realistic sample records for presentations. Remove them with: npm run clear:demo
// Every record is marked is_demo and uses the reserved .example email domain, so none can reach a real person.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const { closeDb, getDb } = await import('../lib/db.js');
const { addPhoto, attachCnic, createProfile, deleteProfile } = await import('../lib/profiles.js');
const { hashPassword } = await import('../lib/security.js');
const { photosDir, saveCnic } = await import('../lib/uploads.js');
const { notify } = await import('../lib/notifications.js');
const db = getDb();

const DOMAIN = '@alzaujain.example';
const OLD_DOMAIN = '@demo.alzaujain.local';

async function clearDemo() {
  const profiles = await db.profile.findMany({ where: { is_demo: true }, select: { id: true } });
  for (const { id } of profiles) await deleteProfile(id);
  const users = await db.user.deleteMany({ where: { OR: [{ email: { endsWith: DOMAIN } }, { email: { endsWith: OLD_DOMAIN } }] } });
  await db.enquiry.deleteMany({ where: { phone: { startsWith: '0300 555' } } });
  console.log(`Removed ${profiles.length} sample profiles and ${users.count} sample accounts.`);
}

await clearDemo();
if (process.argv.includes('--clear')) { await closeDb(); process.exit(0); }

const pick = (list, index) => list[index % list.length];
const DAY = 86400000;

const ABOUT_F = [
  'Comes from a respected, close-knit family. Calm by nature, she balances her career with a love of home and family.',
  'Soft-spoken and well mannered, she values her deen, her education and the people around her.',
  'Grew up in a joint family and enjoys cooking, reading and time with her nieces and nephews.',
  'Confident and caring, with a clear sense of purpose in her work and her family life.',
];
const ABOUT_M = [
  'Hardworking and dependable, he has built a stable career while staying close to his parents.',
  'Well settled, respectful and family-minded, he prays regularly and enjoys travelling with family.',
  'Humble and straightforward, with a good reputation among colleagues and relatives.',
  'Grew up in a joint family and takes responsibility for his parents and siblings with pride.',
];
const DEMAND_F = [
  'لڑکی تعلیم یافتہ، باپردہ اور گھریلو مزاج کی ہے۔ والدین حیات ہیں اور خاندان نہایت شریف ہے۔\nلڑکا تعلیم یافتہ، برسرِ روزگار اور شریف خاندان سے ہو۔ عمر 35 سال تک ہو۔ باقی تفصیلات پرسنل۔',
  'رشتہ اچھے اور دیندار گھرانے سے مطلوب ہے۔ لڑکا نمازی، خوش اخلاق اور اپنے پاؤں پر کھڑا ہو۔ اپنا گھر ہو تو بہتر ہے۔',
  'An educated, practising and well-settled young man from a respectable family is preferred. Overseas proposals are welcome if the family is known.',
  'لڑکا پڑھا لکھا اور اچھی ملازمت یا کاروبار والا ہو۔ ذات کی کوئی پابندی نہیں، خاندان شریف ہونا ضروری ہے۔',
];
const DEMAND_M = [
  'لڑکی تعلیم یافتہ، خوش اخلاق اور گھریلو ہو۔ عمر زیادہ سے زیادہ 28 سال ہو۔ جو جائز ڈیمانڈ ہوگی پوری کریں گے۔',
  'A kind, educated girl from a good family who values both home and faith. Her working or not is the family’s choice.',
  'رشتہ شریف گھرانے سے مطلوب ہے۔ لڑکی باپردہ اور دیندار ہو۔ ذات برادری کی پابندی نہیں۔ باقی تفصیلات پرسنل۔',
  'لڑکی کم از کم گریجویٹ ہو، سادہ مزاج ہو اور بیرون ملک رہائش پر راضی ہو۔ خاندان کی پسند کو اہمیت دی جائے گی۔',
];

// name, urdu, gender, age, city, state, country, level, degree, institution, occupation, title, caste, sect, marital, tongue, income, father, mother, brothers, sisters, status, height, area
const ROWS = [
  ['Ayesha Khan', 'عائشہ خان', 'female', 26, 'Multan', 'Punjab', 'Pakistan', 'Masters', 'MSc Mathematics', 'Bahauddin Zakariya University', 'Teacher', 'Senior Mathematics Teacher', 'Jutt', 'Sunni', 'Never married', 'Saraiki', null, 'Retired bank manager', 'Homemaker', 2, 1, 'Upper middle class', 163, 'City'],
  ['Ahmed Raza', 'انجینئر احمد رضا', 'male', 29, 'Lahore', 'Punjab', 'Pakistan', 'Bachelors', 'BS Computer Science', 'LUMS', 'Software engineer', 'Senior Software Engineer', 'Rajput', 'Sunni', 'Never married', 'Punjabi', '4.5 Lac', 'Civil engineer', 'Lecturer', 1, 2, 'Upper middle class', 178, 'City'],
  ['Fatima Malik', 'فاطمہ ملک', 'female', 27, 'Islamabad', 'Federal Capital', 'Pakistan', 'Bachelors', 'BBA', 'NUST Business School', 'Business analyst', 'Business Analyst', 'Malik', 'Sunni', 'Never married', 'Urdu', null, 'Government officer', 'School principal', 1, 1, 'Upper middle class', 165, 'City'],
  ['Usman Sheikh', 'عثمان شیخ', 'male', 31, 'Karachi', 'Sindh', 'Pakistan', 'Masters', 'MBA', 'IBA Karachi', 'Operations manager', 'Operations Manager', 'Sheikh', 'Sunni', 'Never married', 'Urdu', '6 Lac', 'Businessman', 'Homemaker', 2, 2, 'Affluent', 180, 'City'],
  ['Zainab Bhatti', 'ڈاکٹر زینب بھٹی', 'female', 27, 'Lahore', 'Punjab', 'Pakistan', 'Professional (MBBS, CA, LLB)', 'MBBS', 'King Edward Medical University', 'Doctor', 'House Officer', 'Bhatti', 'Sunni', 'Never married', 'Punjabi', null, 'Consultant surgeon', 'Doctor', 1, 2, 'Affluent', 160, 'City'],
  ['Bilal Chaudhry', 'بلال چوہدری', 'male', 33, 'Faisalabad', 'Punjab', 'Pakistan', 'Bachelors', 'BCom', 'Government College University', 'Own business', 'Textile exporter', 'Jutt', 'Sunni', 'Divorced', 'Punjabi', '8 Lac', 'Textile mill owner', 'Homemaker', 3, 1, 'Affluent', 175, 'City'],
  ['Hira Arain', 'حرا آرائیں', 'female', 29, 'Multan', 'Punjab', 'Pakistan', 'Masters', 'MA English Literature', 'Bahauddin Zakariya University', 'Lecturer', 'Lecturer', 'Arain', 'Sunni', 'Never married', 'Saraiki', '90K', 'Landowner', 'Homemaker', 2, 3, 'Middle class', 158, 'Town'],
  ['Hamza Jutt', 'حمزہ جٹ', 'male', 28, 'Multan', 'Punjab', 'Pakistan', 'Bachelors', 'BSc Civil Engineering', 'UET Lahore', 'Civil engineer', 'Site Engineer', 'Jutt', 'Sunni', 'Never married', 'Saraiki', '2.2 Lac', 'Agriculturist', 'Homemaker', 1, 3, 'Middle class', 176, 'City'],
  ['Maryam Qureshi', 'مریم قریشی', 'female', 25, 'Rawalpindi', 'Punjab', 'Pakistan', 'Bachelors', 'BS Psychology', 'Fatima Jinnah Women University', 'Counsellor', 'School Counsellor', 'Qureshi', 'Shia', 'Never married', 'Urdu', null, 'Army officer (retired)', 'Homemaker', 2, 0, 'Upper middle class', 162, 'City'],
  ['Ali Awan', 'پروفیسر علی اعوان', 'male', 36, 'Peshawar', 'Khyber Pakhtunkhwa', 'Pakistan', 'MPhil', 'MPhil Physics', 'University of Peshawar', 'Assistant professor', 'Assistant Professor', 'Awan', 'Sunni', 'Widowed', 'Hindko', '2.8 Lac', 'Headmaster (retired)', 'Homemaker', 2, 2, 'Middle class', 173, 'City'],
  ['Sana Mirza', 'ثناء مرزا', 'female', 30, 'London', 'England', 'United Kingdom', 'Masters', 'MSc Finance', 'University of Manchester', 'Financial analyst', 'Senior Financial Analyst', 'Mughal', 'Sunni', 'Never married', 'Urdu', '£5,200', 'GP doctor', 'Pharmacist', 1, 1, 'Affluent', 166, 'City'],
  ['Imran Butt', 'عمران بٹ', 'male', 34, 'Birmingham', 'England', 'United Kingdom', 'Bachelors', 'BEng Mechanical Engineering', 'University of Birmingham', 'Mechanical engineer', 'Project Engineer', 'Butt', 'Sunni', 'Never married', 'Punjabi', '£4,800', 'Retail business', 'Homemaker', 2, 1, 'Upper middle class', 182, 'City'],
  ['Nida Syed', 'ندا سید', 'female', 28, 'Manchester', 'England', 'United Kingdom', 'Professional (MBBS, CA, LLB)', 'MPharm', 'University of Bradford', 'Pharmacist', 'Community Pharmacist', 'Syed', 'Shia', 'Never married', 'Urdu', '£3,900', 'Accountant', 'Teacher', 1, 2, 'Upper middle class', 161, 'City'],
  ['Kamran Gill', 'کامران گل', 'male', 32, 'Berlin', 'Berlin', 'Germany', 'Masters', 'MS Data Science', 'TU Berlin', 'Data scientist', 'Lead Data Scientist', 'Gill', 'Sunni', 'Never married', 'Punjabi', '€6,100', 'Agriculturist', 'Homemaker', 2, 2, 'Middle class', 179, 'City'],
  ['Rabia Cheema', 'رابعہ چیمہ', 'female', 27, 'Milan', 'Lombardy', 'Italy', 'Bachelors', 'BA Interior Design', 'Politecnico di Milano', 'Designer', 'Interior Designer', 'Cheema', 'Sunni', 'Never married', 'Punjabi', null, 'Restaurant owner', 'Homemaker', 1, 2, 'Upper middle class', 164, 'City'],
  ['Tariq Warraich', 'طارق وڑائچ', 'male', 37, 'Paris', 'Île-de-France', 'France', 'Bachelors', 'BBA', 'University of the Punjab', 'Own business', 'Restaurant owner', 'Jutt', 'Sunni', 'Divorced', 'Punjabi', '€7,000', 'Agriculturist', 'Homemaker', 3, 2, 'Upper middle class', 177, 'City'],
  ['Amna Rana', 'آمنہ رانا', 'female', 29, 'New York', 'New York', 'United States', 'Masters', 'MS Nursing', 'Hunter College', 'Registered nurse', 'Registered Nurse', 'Rajput', 'Sunni', 'Never married', 'Urdu', '$7,200', 'Engineer', 'Homemaker', 1, 2, 'Upper middle class', 163, 'City'],
  ['Faisal Siddiqui', 'فیصل صدیقی', 'male', 33, 'Houston', 'Texas', 'United States', 'Masters', 'MS Petroleum Engineering', 'University of Houston', 'Petroleum engineer', 'Reservoir Engineer', 'Siddiqui', 'Sunni', 'Never married', 'Urdu', '$13,000', 'Physician', 'Homemaker', 1, 1, 'Affluent', 181, 'City'],
  ['Sidra Abbasi', 'سدرہ عباسی', 'female', 26, 'Riyadh', 'Riyadh Province', 'Saudi Arabia', 'Bachelors', 'BS Biology', 'University of Karachi', 'School teacher', 'Science Teacher', 'Abbasi', 'Sunni', 'Never married', 'Urdu', null, 'Bank officer', 'Homemaker', 2, 1, 'Middle class', 160, 'City'],
  ['Waqas Tiwana', 'وقاص ٹوانہ', 'male', 31, 'Jeddah', 'Makkah Province', 'Saudi Arabia', 'Bachelors', 'BSc Accounting & Finance', 'University of Sargodha', 'Accountant', 'Finance Manager', 'Jutt', 'Sunni', 'Never married', 'Punjabi', 'SAR 18,000', 'Landowner', 'Homemaker', 2, 3, 'Upper middle class', 174, 'City'],
  ['Mahnoor Khan', 'ماہ نور خان', 'female', 28, 'Dubai', 'Dubai', 'United Arab Emirates', 'Masters', 'MBA Marketing', 'Middlesex University Dubai', 'Marketing manager', 'Marketing Manager', 'Pathan', 'Sunni', 'Never married', 'Pashto', 'AED 19,000', 'Businessman', 'Homemaker', 1, 1, 'Affluent', 167, 'City'],
  ['Saad Ansari', 'سعد انصاری', 'male', 30, 'Abu Dhabi', 'Abu Dhabi', 'United Arab Emirates', 'Bachelors', 'BE Electrical Engineering', 'NED University', 'Electrical engineer', 'Electrical Engineer', 'Ansari', 'Sunni', 'Never married', 'Urdu', 'AED 21,000', 'Engineer (retired)', 'Teacher', 1, 2, 'Upper middle class', 175, 'City'],
  ['Iqra Hashmi', 'اقرا ہاشمی', 'female', 27, 'Doha', 'Doha', 'Qatar', 'Bachelors', 'BS Computer Science', 'COMSATS University', 'IT consultant', 'IT Consultant', 'Hashmi', 'Sunni', 'Never married', 'Urdu', null, 'Pilot (retired)', 'Homemaker', 1, 1, 'Upper middle class', 162, 'City'],
  ['Junaid Kiani', 'جنید کیانی', 'male', 35, 'Muscat', 'Muscat', 'Oman', 'Bachelors', 'BBA', 'SZABIST', 'Sales manager', 'Regional Sales Manager', 'Kiani', 'Sunni', 'Never married', 'Pothwari', 'OMR 1,600', 'Government officer', 'Homemaker', 2, 1, 'Middle class', 172, 'City'],
  ['Asma Lodhi', 'اسماء لودھی', 'female', 33, 'Kuwait City', 'Al Asimah', 'Kuwait', 'Masters', 'MA Education', 'Allama Iqbal Open University', 'Vice principal', 'Vice Principal', 'Lodhi', 'Sunni', 'Divorced', 'Urdu', 'KWD 780', 'Businessman', 'Homemaker', 2, 2, 'Middle class', 159, 'City'],
  ['Rizwan Baig', 'رضوان بیگ', 'male', 38, 'Manama', 'Capital Governorate', 'Bahrain', 'Masters', 'MBA Banking', 'University of Karachi', 'Banker', 'Branch Manager', 'Mughal', 'Sunni', 'Widowed', 'Urdu', 'BHD 1,300', 'Banker (retired)', 'Homemaker', 1, 2, 'Upper middle class', 170, 'City'],
  ['Laiba Tariq', 'لائبہ طارق', 'female', 24, 'Sialkot', 'Punjab', 'Pakistan', 'Bachelors', 'BS Fashion Design', 'Pakistan Institute of Fashion and Design', 'Designer', 'Bridal Designer', 'Butt', 'Sunni', 'Never married', 'Punjabi', null, 'Sports goods exporter', 'Homemaker', 2, 1, 'Affluent', 161, 'City'],
  ['Danish Iqbal', 'ڈاکٹر دانش اقبال', 'male', 32, 'Bahawalpur', 'Punjab', 'Pakistan', 'Professional (MBBS, CA, LLB)', 'MBBS, FCPS', 'Quaid-e-Azam Medical College', 'Doctor', 'Consultant Physician', 'Arain', 'Sunni', 'Never married', 'Saraiki', '5 Lac', 'Doctor', 'Homemaker', 1, 2, 'Upper middle class', 174, 'City'],
  ['Saima Niazi', 'صائمہ نیازی', 'female', 31, 'Quetta', 'Balochistan', 'Pakistan', 'Masters', 'LLM', 'University of Balochistan', 'Advocate', 'Advocate High Court', 'Niazi', 'Sunni', 'Never married', 'Pashto', '1.8 Lac', 'Advocate', 'Homemaker', 3, 1, 'Upper middle class', 165, 'City'],
  ['Hassan Rizvi', 'حسن رضوی', 'male', 30, 'Karachi', 'Sindh', 'Pakistan', 'Professional (MBBS, CA, LLB)', 'Chartered Accountancy', 'ICAP', 'Chartered accountant', 'Audit Manager', 'Syed', 'Shia', 'Never married', 'Urdu', '5.5 Lac', 'Professor', 'Homemaker', 0, 2, 'Upper middle class', 172, 'City'],
  ['Komal Javed', 'کومل جاوید', 'female', 28, 'Gujranwala', 'Punjab', 'Pakistan', 'Masters', 'MPhil Chemistry', 'University of Gujrat', 'Lecturer', 'Lecturer', 'Rajput', 'Sunni', 'Never married', 'Punjabi', '85K', 'Business', 'Teacher', 2, 2, 'Middle class', 160, 'Village'],
  ['Shahzaib Khokhar', 'شاہ زیب کھوکھر', 'male', 27, 'Sargodha', 'Punjab', 'Pakistan', 'Bachelors', 'BSc Agriculture', 'University of Agriculture Faisalabad', 'Own work', 'Citrus farm owner', 'Khokhar', 'Sunni', 'Never married', 'Punjabi', '3 Lac', 'Landowner', 'Homemaker', 2, 2, 'Upper middle class', 179, 'Village'],
];

const countries = new Map((await db.country.findMany({ select: { id: true, name: true } })).map((row) => [row.name, row.id]));
const year = new Date().getFullYear();
const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');
const phone = (index) => `0300 555 ${String(1000 + index)}`;

const password = crypto.randomBytes(9).toString('base64url');
const hash = hashPassword(password);
const addUser = async (email, name, role = 'user', extra = {}) => (await db.user.create({ data: { email, password_hash: hash, name, role, match_emails: false, ...extra } })).id;

const consultants = [];
for (const [name, title, city, languages, years, bio] of [
  ['Saima Rehman', 'Senior Marriage Consultant', 'Multan', 'Urdu, Punjabi, Saraiki, English', 12, 'For twelve years Saima has guided families across South Punjab and the Gulf with care and discretion, and she remains personally involved from first conversation to nikah.'],
  ['Tariq Mehmood', 'Overseas Proposals Consultant', 'London', 'English, Urdu, Punjabi', 9, 'Based in London, Tariq helps British Pakistani families and those in Europe find proposals that honour both their roots and their life abroad.'],
  ['Nadia Farooq', 'Family Consultant', 'Dubai', 'Urdu, English, Arabic', 7, 'Nadia works with families across the Gulf, bringing together professionals who value faith, education and family life.'],
]) {
  const userId = await addUser(`${slug(name)}${DOMAIN}`, name, 'consultant');
  consultants.push(await db.consultant.create({ data: { user_id: userId, slug: name.toLowerCase().replace(/\s+/g, '-'), display_name: name, title, city, languages, experience_years: years, bio, phone: phone(900 + consultants.length), whatsapp: `9230055509${consultants.length}`, public_email: `${slug(name)}${DOMAIN}`, perm_edit: true } }));
}

const ids = [];
for (const [index, row] of ROWS.entries()) {
  const [full_name, headline_ur, gender, age, city, state, country, education_level, degree, institution, occupation, job_title, caste, sect, marital_status, mother_tongue, monthly_income, father_occupation, mother_occupation, brothers, sisters, family_status, height_cm, residence_area] = row;
  const female = gender === 'female';
  const pending = index >= ROWS.length - 3;
  const id = await createProfile({
    headline_ur, full_name, gender, date_of_birth: `${year - age - 1}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`, height_cm, marital_status,
    children_details: marital_status === 'Never married' ? null : pick(['No kids', '1 son', 'No kids', '1 daughter'], index), mother_tongue, caste, nationality: country === 'Pakistan' ? 'Pakistani' : 'Pakistani (dual national)',
    origin_country: 'Pakistan', origin_city: country === 'Pakistan' ? city : pick(['Lahore', 'Sialkot', 'Mirpur', 'Karachi', 'Gujrat', 'Rawalpindi'], index), profile_created_by: pick(['Father', 'Mother', 'Self', 'Brother'], index),
    education_level, degree, institution, occupation, job_title, employment_status: occupation === 'Own business' || occupation === 'Own work' ? 'Business owner' : 'Employed', monthly_income,
    religion: 'Islam', sect, religious_practices: pick(['Practising', 'Moderately practising', 'Very practising'], index),
    father_status: index % 7 === 3 ? 'Deceased' : 'Alive', mother_status: 'Alive', father_occupation, mother_occupation, brothers, sisters, family_status, family_location: city,
    family_background: pick(['A well-educated family with roots in Punjab.', 'A respected family known for its hospitality and values.', 'A close family that keeps its traditions alive at home and abroad.'], index),
    country_id: countries.get(country), state, city, residence_area, home_ownership: pick(['Own', 'Own', 'Family home', 'Rented'], index), current_residence: `${city} (private)`, permanent_residence: country === 'Pakistan' ? `${city} (private)` : 'Pakistan (private)',
    partner_demand: pick(female ? DEMAND_F : DEMAND_M, index), description: pick(female ? ABOUT_F : ABOUT_M, index),
    pref_age_min: female ? age : Math.max(21, age - 9), pref_age_max: female ? age + 8 : age, pref_marital_status: index % 3 ? 'Never married' : null, pref_education: 'Bachelors',
    contact_phone: phone(index), contact_whatsapp: phone(index), contact_email: `${slug(full_name)}${DOMAIN}`,
  }, { status: pending ? 'pending' : 'approved', isDemo: true, consultantId: pick(consultants, index).id });
  await db.profile.update({ where: { id }, data: { approved_at: pending ? null : new Date(Date.now() - (index + 2) * DAY), created_at: new Date(Date.now() - (index + 3) * DAY), featured: index < 4, featured_sort: index, verification_status: !pending && index % 3 === 0 ? 'verified' : 'not_submitted', views: 0 } });
  ids.push(id);
}

// Portraits: the four supplied with the site, then any licensed files added to scripts/demo-portraits.
fs.mkdirSync(photosDir(), { recursive: true });
async function usePortrait(profileId, buffer) {
  const file = `demo-${crypto.randomUUID()}.webp`;
  const thumb = `demo-${crypto.randomUUID()}.webp`;
  await sharp(buffer).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(photosDir(), file));
  await sharp(buffer).resize(640, 640, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(path.join(photosDir(), thumb));
  await addPhoto(profileId, { file, thumb });
}
const sprite = path.join('public', 'images', 'proposal-portraits.png');
const half = Math.floor((await sharp(sprite).metadata()).width / 2);
for (let index = 0; index < 4; index += 1) {
  await usePortrait(ids[index], await sharp(sprite).extract({ left: index % 2 ? half : 0, top: index > 1 ? half : 0, width: half, height: half }).toBuffer());
}
for (const gender of ['female', 'male']) {
  const folder = path.join('scripts', 'demo-portraits', gender);
  const files = fs.readdirSync(folder).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
  const targets = ROWS.map((row, index) => ({ row, index })).filter(({ row, index }) => row[2] === gender && index >= 4);
  for (const [position, name] of files.entries()) if (targets[position]) await usePortrait(ids[targets[position].index], fs.readFileSync(path.join(folder, name)));
}

// A specimen card, so the verification queue has something to review.
const specimen = await sharp({ create: { width: 900, height: 560, channels: 3, background: '#e9eef0' } }).composite([{ input: Buffer.from('<svg width="900" height="560"><text x="450" y="290" font-size="64" text-anchor="middle" fill="#8a97a0" font-family="sans-serif">SPECIMEN</text></svg>') }]).jpeg().toBuffer();
const asFile = () => new File([specimen], 'specimen.jpg', { type: 'image/jpeg' });
for (const index of [1, 2, 10]) {
  await attachCnic(ids[index], await saveCnic(asFile(), 'CNIC'), null);
}
for (const index of ROWS.keys()) {
  if (index % 3 === 0 && index < ROWS.length - 3) {
    await attachCnic(ids[index], await saveCnic(asFile(), 'CNIC'), null);
    await db.profile.update({ where: { id: ids[index] }, data: { verification_status: 'verified' } });
  }
}

// Member accounts for the first profiles, so chat, matches and saved lists are alive.
const members = [];
for (const index of [0, 1, 2, 3, 7, 10]) {
  const [name] = ROWS[index];
  const userId = await addUser(`${slug(name)}${DOMAIN}`, name, 'user', { created_at: new Date(Date.now() - 40 * DAY + index * DAY) });
  await db.profile.update({ where: { id: ids[index] }, data: { user_id: userId } });
  members.push({ userId, profileId: ids[index], name });
}
const [ayesha, ahmed, fatima, usman, hamza] = members;

// Fourteen days of view history for each member profile.
const today = new Date(new Date().toISOString().slice(0, 10));
for (const member of members) {
  let total = 0;
  for (let day = 0; day < 14; day += 1) {
    const count = 1 + ((day * 7 + member.profileId * 3) % 6);
    const rows = Array.from({ length: count }, (_, index) => ({ profile_id: member.profileId, viewer_key: `visitor-${day}-${index}`, view_date: new Date(today.getTime() - day * DAY), created_at: new Date(Date.now() - day * DAY - index * 3600000) }));
    await db.profileView.createMany({ data: rows });
    total += count;
  }
  await db.profile.update({ where: { id: member.profileId }, data: { views: total + 40 } });
}
for (const viewer of [ahmed, usman, hamza]) {
  await db.profileView.create({ data: { profile_id: ayesha.profileId, viewer_id: viewer.userId, viewer_key: `member:${viewer.userId}`, view_date: today } });
}

// Saved lists.
for (const index of [1, 3, 7, 5]) await db.savedProfile.create({ data: { user_id: ayesha.userId, profile_id: ids[index] } });
for (const index of [0, 2, 4]) await db.savedProfile.create({ data: { user_id: ahmed.userId, profile_id: ids[index] } });

// A real conversation.
const pair = (a, b) => (a < b ? [a, b] : [b, a]);
async function conversation(a, b, lines, minutesAgo) {
  const [user_low, user_high] = pair(a.userId, b.userId);
  const { id } = await db.conversation.create({ data: { user_low, user_high, last_message_at: new Date(Date.now() - minutesAgo * 60000) } });
  for (const [position, [sender, body]] of lines.entries()) {
    const unread = position === lines.length - 1;
    await db.message.create({ data: { conversation_id: id, sender_id: sender.userId, body, created_at: new Date(Date.now() - (minutesAgo + (lines.length - position) * 180) * 60000), read_at: unread ? null : new Date() } });
  }
}
await conversation(ayesha, ahmed, [
  [ahmed, 'Assalam-o-Alaikum. I read your biodata and my family was impressed. Would it be alright if our parents spoke?'],
  [ayesha, 'Walaikum Assalam. Thank you. My father handles these conversations, so please go through our consultant, Saima sahiba.'],
  [ahmed, 'Of course, that is the right way. My mother will call her this week, In sha Allah.'],
], 95);
await conversation(ayesha, hamza, [
  [hamza, 'السلام علیکم، ہم نے آپ کی پروفائل دیکھی ہے۔ ہمارا خاندان بھی ملتان سے ہے۔'],
  [ayesha, 'وعلیکم السلام۔ جی، شکریہ۔ مزید بات کے لیے کنسلٹنٹ سے رابطہ کر لیجیے۔'],
], 1500);

// Notifications and matches for Ayesha.
await notify(ayesha.userId, { type: 'account', title: 'Welcome to Al Zaujain', body: 'Your account is ready. Create your matrimonial biodata to start receiving proposals.', href: '/dashboard/profile' });
await notify(ayesha.userId, { type: 'profile', title: `Your profile AZ-${String(ids[0]).padStart(2, '0')} is approved`, body: 'It now appears in Al Zaujain proposals.', href: '/dashboard/profile' });
await notify(ayesha.userId, { type: 'verification', title: 'Your profile is verified', body: 'The blue tick now appears beside your name.', href: '/dashboard/profile' });
await notify(ayesha.userId, { type: 'consultant', title: `${consultants[0].display_name} is now your marriage consultant`, body: 'They will guide you through suitable proposals.', href: '/dashboard' });
await notify(ayesha.userId, { type: 'match', title: '5 new recommended matches', body: 'New proposals suited to your profile are ready to view.', href: '/dashboard/matches', groupKey: 'matches' });
await notify(ayesha.userId, { type: 'message', title: 'New message from Ahmed Raza', body: 'My mother will call her this week, In sha Allah.', href: '/messages', groupKey: 'demo-conversation' });

// Consultant work in progress.
const proposal = async (a, b, status, note) => {
  const [first, second] = a < b ? [a, b] : [b, a];
  await db.matchProposal.create({ data: { consultant_id: consultants[0].id, profile_a_id: first, profile_b_id: second, status, note } });
};
await proposal(ids[0], ids[1], 'shared', 'Both families are comfortable with Lahore and Multan.');
await proposal(ids[0], ids[7], 'suggested', 'Same city and biradari.');
await proposal(ids[2], ids[3], 'accepted', 'Families have met in Islamabad.');

await db.enquiry.createMany({ data: [
  { name: 'Mrs Rukhsana Akhtar', phone: phone(801), profile_for: 'My son', city: 'Lahore', message: 'Looking for an educated bride for my son who works in Dubai.' },
  { name: 'Haji Muhammad Aslam', phone: phone(802), profile_for: 'My daughter', city: 'Multan', message: 'بیٹی کے لیے رشتہ درکار ہے، ڈاکٹر یا انجینئر کو ترجیح ہوگی۔' },
  { name: 'Nasir Mahmood', phone: phone(803), profile_for: 'Myself', city: 'Birmingham', message: 'Please share the process for overseas Pakistanis.' },
] });

console.log(`Added ${ids.length} sample profiles, ${members.length} members and ${consultants.length} consultants.`);
console.log(`  Member:     ayesha.khan${DOMAIN}\n  Member:     ahmed.raza${DOMAIN}\n  Consultant: saima.rehman${DOMAIN}\n  Password:   ${password}`);
await closeDb();

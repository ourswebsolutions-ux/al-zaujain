// The official marriage consultancy fee structure (registration and rishta finalization fees).
// This is the bureau's own service pricing. It is entirely separate from premium profile credit
// packages (lib/credits.js): nothing here is bought on the website or changes any balance.
import { getSetting, saveSettings } from './settings.js';

export const DEFAULT_FEES = {
  company: 'AL ZAUJAIN MARRIAGE BUREAU',
  registered: 'REGISTERED MATRIMONIAL SERVICES',
  city: 'MULTAN, PAKISTAN',
  ntn: 'FBR PAKISTAN – NTN No. 8052006-4',
  ceo: 'CEO: MUHAMMAD ASIF RAZA',
  registration: [
    { category: 'Normal Family Pakistani Proposals', fee: 'Rs. 5,000' },
    { category: 'Govt. Job Holder, Doctor, Engineer, Second Marriage, Premium Requirements & Businessman Families', fee: 'Rs. 10,000' },
    { category: 'Gulf Countries (UAE, Saudi Arabia, Qatar, Oman, etc.)', fee: 'Rs. 20,000' },
    { category: 'UK, USA, Canada & All Premium Overseas Proposals', fee: 'Rs. 25,000' },
  ],
  finalization: [
    { category: 'Normal Family Pakistani Proposals', fee: 'Rs. 50,000' },
    { category: 'Govt. Job Holder, Doctor, Engineer, Second Marriage, Premium Requirements & Businessman Families', fee: 'Rs. 100,000' },
    { category: 'Gulf Countries (UAE, Saudi Arabia, Qatar, Oman, etc.)', fee: 'Rs. 200,000' },
    { category: 'UK, USA, Canada & All Premium Overseas Proposals', fee: 'Rs. 500,000' },
  ],
  countries: 'Pakistan, UAE, Saudi Arabia, Qatar, Oman, Kuwait, Bahrain, Jordan, Turkey, UK, USA, Canada, Australia, New Zealand and all other countries.',
  whatsapp: '0339-9077424',
  email: 'alzaujain@gmail.com',
};

const text = (value, max = 300) => String(value ?? '').trim().slice(0, max);
const rows = (list) => (Array.isArray(list) ? list : []).map((row) => ({ category: text(row?.category, 200), fee: text(row?.fee, 40) })).filter((row) => row.category && row.fee).slice(0, 12);

function clean(fees) {
  return {
    company: text(fees.company, 120) || DEFAULT_FEES.company,
    registered: text(fees.registered, 120),
    city: text(fees.city, 120),
    ntn: text(fees.ntn, 120),
    ceo: text(fees.ceo, 120),
    registration: rows(fees.registration),
    finalization: rows(fees.finalization),
    countries: text(fees.countries, 600),
    whatsapp: text(fees.whatsapp, 30),
    email: text(fees.email, 160),
  };
}

export async function getFees() {
  try {
    const stored = JSON.parse((await getSetting('consultancy_fees')) || 'null');
    return stored ? clean({ ...DEFAULT_FEES, ...stored }) : DEFAULT_FEES;
  } catch {
    return DEFAULT_FEES;
  }
}

export async function saveFees(fees) {
  const value = clean(fees);
  await saveSettings({ consultancy_fees: JSON.stringify(value) });
  return value;
}

// "0339-9077424" → "923399077424" for wa.me links.
export const whatsappDigits = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
};

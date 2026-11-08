import { FaCircleCheck, FaClock, FaCircleXmark, FaIdCard } from 'react-icons/fa6';
import { getT } from '@/lib/i18n/server.js';

const REVIEW = {
  pending: ['Waiting for review', 'Our team will review this profile shortly. It is not public yet.', FaClock, 'text-[#806126]'],
  approved: ['Approved and live', 'This profile appears in Al Zaujain proposals.', FaCircleCheck, 'text-[#3d6b4a]'],
  rejected: ['Not approved', 'Please update your details or contact our team.', FaCircleXmark, 'text-[#a33a2c]'],
};

const VERIFICATION = {
  not_submitted: ['CNIC not submitted', 'Upload your CNIC to become eligible for the blue tick.', FaIdCard, 'text-muted'],
  pending: ['Verification pending', 'Our team is reviewing your CNIC privately.', FaClock, 'text-[#806126]'],
  verified: ['Verified', 'This profile shows the blue verified tick.', FaCircleCheck, 'text-verified'],
  rejected: ['Verification rejected', 'Please upload a clearer CNIC from the edit page.', FaCircleXmark, 'text-[#a33a2c]'],
};

async function Card({ title, data, note }) {
  const t = await getT();
  const [label, text, Icon, color] = data;
  return (
    <div className="rounded-2xl border border-[#e7e9ee] bg-white p-5 shadow-[0_10px_28px_#03223f08]">
      <p className="text-[10px] font-semibold tracking-[1px] text-muted">{title}</p>
      <p className={`mt-1.5 flex items-center gap-2 text-base font-bold ${color}`}><Icon aria-hidden="true" /> {t(label)}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{t(note || text)}</p>
    </div>
  );
}

export async function StatusPanel({ profile }) {
  const t = await getT();
  return (
    <div className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
      <Card title={t('PROFILE STATUS')} data={REVIEW[profile.status]} note={profile.rejection_reason} />
      <Card title={t('VERIFICATION')} data={VERIFICATION[profile.verification_status]} note={profile.verification_note} />
    </div>
  );
}

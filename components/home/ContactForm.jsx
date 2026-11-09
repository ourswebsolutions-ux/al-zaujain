'use client';

import { useActionState } from 'react';
import { FaCircleInfo, FaLocationDot, FaMessage, FaPaperPlane, FaPenToSquare, FaPeopleRoof, FaUser, FaWhatsapp } from 'react-icons/fa6';
import { submitEnquiry } from '@/app/actions/public';
import { useT } from '@/components/i18n/LanguageProvider';
import { buttonClass } from '@/components/ui/Button';
import { Urdu } from '@/components/ui/Text';

const input = 'mt-2 block w-full rounded-[7px] border border-[#dce0dc] bg-[#fafbf9] p-[13px] font-sans text-xs font-normal text-navy';

function Title({ icon: Icon, label, ur }) {
  return (
    <span className="flex items-center gap-[7px] text-[10px] leading-[15px] text-navy">
      <Icon aria-hidden="true" className="text-xs text-[#a37a2c]" /> {label}
      <Urdu as="span" className="ms-auto text-[11px] font-normal leading-[24.2px] text-[#7e6c48] max-m:text-xs max-m:leading-[26.4px]">{ur}</Urdu>
    </span>
  );
}

const PROFILE_FOR = ['Myself', 'My son', 'My daughter', 'My sibling', 'Another family member'];

export function ContactForm() {
  const t = useT();
  const [state, action, pending] = useActionState(submitEnquiry, null);
  return (
    <form action={action} className="min-w-0">
      <h3 className="mb-[7px] text-xl font-bold leading-[29px] max-m:text-lg max-m:leading-[26.1px]">
        <FaPenToSquare aria-hidden="true" className="me-2 inline-block text-[#a9802c]" /> {t('A little about your enquiry')}
      </h3>
      <div className="grid grid-cols-2 gap-[18px] max-b:grid-cols-1 max-m:gap-4">
        <label className="text-[11px] font-medium leading-[16.5px]">
          <Title icon={FaUser} label={t('Your name *')} ur="آپ کا نام" />
          <input name="name" type="text" autoComplete="name" placeholder={t('Enter your full name')} required maxLength={100} className={`${input} h-[46px]`} />
        </label>
        <label className="text-[11px] font-medium leading-[16.5px]">
          <Title icon={FaWhatsapp} label={t('Phone / WhatsApp *')} ur="موبائل نمبر" />
          <input name="phone" type="tel" autoComplete="tel" placeholder="0300 1234567" required pattern="[+0-9\s\(\)\-]{7,20}" title={t('Enter a valid phone number')} className={`${input} h-[46px]`} />
        </label>
        <label className="text-[11px] font-medium leading-[16.5px]">
          <Title icon={FaPeopleRoof} label={t('Profile for')} ur="رشتہ کس کے لیے؟" />
          <select name="profile_for" className={`${input} h-[47px] py-0`}>
            {PROFILE_FOR.map((option) => <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
        <label className="text-[11px] font-medium leading-[16.5px]">
          <Title icon={FaLocationDot} label={t('Your city')} ur="آپ کا شہر" />
          <input name="city" autoComplete="address-level2" placeholder={t('e.g. Multan')} maxLength={100} className={`${input} h-[46px]`} />
        </label>
        <label className="col-span-2 text-[11px] font-medium leading-[16.5px] max-b:col-auto">
          <Title icon={FaMessage} label={t('How can we help?')} ur="ہم کیسے مدد کر سکتے ہیں؟" />
          <textarea name="message" rows={3} placeholder={t('Share your preferences with us…')} maxLength={1500} className={`${input} min-h-[100px]`} />
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      </div>
      <button type="submit" disabled={pending} className={buttonClass('navy', 'lg', 'mt-[22px] min-h-[49px] w-full cursor-pointer gap-[15px]!')}>
        <FaPaperPlane aria-hidden="true" /> {t(pending ? 'Sending…' : 'Send your enquiry')}
        <Urdu as="span" className="text-xs font-normal leading-3 max-m:text-[11px]">پیغام بھیجیں</Urdu>
      </button>
      <p className="mt-[13px] text-[9px] leading-[15.3px] text-muted">
        <FaCircleInfo aria-hidden="true" className="inline-block" /> {t('Our team will contact you on the number you share.')}
        <Urdu as="span" className="mt-[5px] block text-[10px] leading-[22px]">ہماری ٹیم آپ کے دیے گئے نمبر پر رابطہ کرے گی۔</Urdu>
      </p>
      {state?.message && (
        <p role="status" className={`mt-[18px] border-s-[3px] p-[15px] text-xs ${state.ok ? 'border-[#588465] bg-[#eef4ef]' : 'border-[#a33a2c] bg-[#fbeeec]'}`}>{t(state.message)}</p>
      )}
    </form>
  );
}

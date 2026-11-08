'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheck, FaCircleCheck } from 'react-icons/fa6';
import { FieldControl, FieldRow } from './ProfileField';
import { Button } from '@/components/ui/Button';
import { inputClass, labelClass } from '@/components/ui/Form';
import { Urdu } from '@/components/ui/Text';
import { ageFromDob } from '@/lib/format.js';
import { SECTIONS, validateProfile, validateStep } from '@/lib/profile-schema.js';
import { AdminProfileSettings } from './AdminProfileSettings';
import { useT } from '@/components/i18n/LanguageProvider';

const MAX_PHOTOS = 6;

function FilePicker({ label, hint, accept = 'image/jpeg,image/png,image/webp', multiple, onChange, files }) {
  const t = useT();
  return (
    <label className={labelClass}>
      {label}
      <input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange([...event.target.files])} className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy`} />
      <span className="mt-1 block font-normal text-muted">{hint}</span>
      {files?.length > 0 && <span className="mt-1 block font-medium text-[#3d6b4a]">{t('{count} selected', { count: files.length })}</span>}
    </label>
  );
}

export function ProfileWizard({ countries, castes = [], initial = {}, mode = 'create', code, token, existingPhotos = [], photoPublic = true, verificationStatus = 'not_submitted', doneUrl, admin = null }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [front, setFront] = useState([]);
  const [back, setBack] = useState([]);
  const [showPhoto, setShowPhoto] = useState(photoPublic);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [direction, setDirection] = useState(1);
  const [accessType, setAccessType] = useState(admin?.type ?? 'paid');
  const [publish, setPublish] = useState(true);
  const [extraInfo, setExtraInfo] = useState(admin?.extra ?? '');
  const [duplicates, setDuplicates] = useState(admin?.duplicates ?? []);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const options = admin ? { admin: true } : undefined;
  const top = useRef(null);

  // Answers survive an accidental reload. Kept per tab, and cleared on success.
  const draftKey = mode === 'create' && !admin ? 'az-profile-draft' : null;
  useEffect(() => {
    if (!draftKey) return;
    const saved = sessionStorage.getItem(draftKey);
    if (saved) setValues((current) => ({ ...current, ...JSON.parse(saved) }));
  }, [draftKey]);
  useEffect(() => {
    if (draftKey && Object.keys(values).length) sessionStorage.setItem(draftKey, JSON.stringify(values));
  }, [draftKey, values]);

  const section = SECTIONS[step];
  const last = step === SECTIONS.length - 1;
  const age = useMemo(() => ageFromDob(values.date_of_birth), [values.date_of_birth]);

  useEffect(() => {
    if (!values.country_id) return undefined;
    let cancelled = false;
    fetch(`/api/cities?country=${values.country_id}`).then((response) => response.json()).then((data) => { if (!cancelled) setCities(data.cities); }).catch(() => {});
    return () => { cancelled = true; };
  }, [values.country_id]);

  const change = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => { const { [name]: _, ...rest } = current; return rest; });
  };

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setMessage('');
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    const stepErrors = validateStep(section.key, values, options);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setMessage('Please correct the highlighted fields.');
      return;
    }
    setErrors({});
    goTo(step + 1);
  };

  const submit = async () => {
    const stepErrors = admin ? validateProfile(values, options).errors ?? {} : validateStep(section.key, values, options);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setMessage('Please correct the highlighted fields.');
      if (admin) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (mode === 'create' && !admin && !consent) {
      setMessage('Please confirm the consent statement.');
      return;
    }
    setBusy(true);
    setMessage('');
    const form = new FormData();
    form.append('data', JSON.stringify(values));
    photos.forEach((file) => form.append('photos', file));
    if (front[0]) form.append('cnic_front', front[0]);
    if (back[0]) form.append('cnic_back', back[0]);
    form.append('photo_public', showPhoto ? 'yes' : 'no');
    if (consent) form.append('consent', 'yes');
    removed.forEach((id) => form.append('remove_photo', id));
    if (token) form.append('manage_token', token);
    if (admin) {
      form.append('access_type', accessType);
      form.append('extra_info', extraInfo);
      if (publish) form.append('publish', 'yes');
      if (admin.hash) form.append('import_hash', admin.hash);
      if (confirmDuplicate) form.append('confirm_duplicate', 'yes');
    }
    try {
      const response = await fetch(mode === 'create' ? '/api/profiles' : `/api/profiles/${code}`, { method: mode === 'create' ? 'POST' : 'PATCH', body: form });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message ?? 'Something went wrong. Please try again.');
        if (result.duplicates) setDuplicates(result.duplicates);
        if (result.errors) {
          setErrors(result.errors);
          const firstStep = SECTIONS.findIndex((item) => item.fields.some((field) => result.errors[field.name]));
          if (firstStep >= 0 && !admin) setStep(firstStep);
        }
        return;
      }
      if (draftKey) sessionStorage.removeItem(draftKey);
      router.push(doneUrl ?? result.url);
      router.refresh();
    } catch {
      setMessage('We could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const keptPhotos = existingPhotos.filter((photo) => !removed.includes(photo.id));
  const remaining = MAX_PHOTOS - keptPhotos.length;

  const documents = (
              <div className="grid gap-5">
                {keptPhotos.length > 0 && (
                  <div>
                    <p className={labelClass}>{t('Current photos')}</p>
                    <ul className="mt-2 flex flex-wrap gap-3">
                      {keptPhotos.map((photo) => (
                        <li key={photo.id} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/media/photos/${photo.thumb}${token ? `?m=${token}` : ''}`} alt={t('Profile')} className="size-24 rounded-lg object-cover" />
                          <button type="button" onClick={() => setRemoved([...removed, photo.id])} className="mt-1 block w-full cursor-pointer text-center text-[11px] font-semibold text-[#a33a2c]">{t('Remove')}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {remaining > 0 && <FilePicker label={t('Profile photographs')} hint={t('JPG, PNG or WebP, up to 8 MB each. You can add {count} more.', { count: remaining })} multiple files={photos} onChange={(files) => setPhotos(files.slice(0, remaining))} />}
                <label className="flex items-start gap-2.5 text-xs leading-5">
                  <input type="checkbox" checked={!showPhoto} onChange={(event) => setShowPhoto(!event.target.checked)} className="mt-1 accent-navy" />
                  Keep my photo private. It will only be shared through the bureau.
                </label>

                <div className="rounded-xl border border-[#ddcfb1] bg-[#f8f4eb] p-5">
                  <h3 className="mb-1 flex items-center gap-2 font-quicksand text-base font-bold"><FaCircleCheck aria-hidden="true" className="text-verified" /> {t('Get the blue verified tick (optional)')}</h3>
                  <p className="mb-4 text-xs leading-5 text-muted">
                    Upload your CNIC so our team can verify this profile. It is encrypted, never shown publicly, and only administrators can open it.
                  </p>
                  {verificationStatus === 'verified' && <p className="mb-3 text-xs font-semibold text-[#3d6b4a]">{t('This profile is verified. Uploading a new CNIC restarts the review.')}</p>}
                  {verificationStatus === 'pending' && <p className="mb-3 text-xs font-semibold text-[#806126]">{t('Your CNIC is waiting for review.')}</p>}
                  <div className="grid grid-cols-2 gap-4 max-m:grid-cols-1">
                    <FilePicker label={t('CNIC front')} hint={t('Clear photo or scan.')} files={front} onChange={setFront} />
                    <FilePicker label={t('CNIC back')} hint={t('Clear photo or scan.')} files={back} onChange={setBack} />
                  </div>
                </div>

                {mode === 'create' && !admin && (
                  <label className="flex items-start gap-2.5 text-xs leading-5">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-navy" />
                    <span>{t('I confirm this information is true, the person concerned is an adult and has agreed to this profile, and I accept the')} <a href="/privacy" target="_blank" className="font-semibold underline">{t('privacy policy')}</a> {t('and')} <a href="/terms" target="_blank" className="font-semibold underline">{t('terms')}</a>.</span>
                  </label>
                )}
              </div>
  );

  if (admin) {
    return (
      <div ref={top} className="grid scroll-mt-5 gap-6">
        <AdminProfileSettings mode={mode} type={accessType} onType={setAccessType} publish={publish} onPublish={setPublish} extra={extraInfo} onExtra={setExtraInfo} duplicates={duplicates} confirm={confirmDuplicate} onConfirm={setConfirmDuplicate} />
        {SECTIONS.map((item) => (
          <section key={item.key} className="rounded-[20px] border border-line bg-white p-[30px] shadow-[0_12px_35px_#03223f08] max-m:p-5">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#eee6d8] pb-4">
              <h2 className="font-quicksand text-xl font-bold text-navy">{t(item.title)}</h2>
              <Urdu className="text-lg leading-10 text-[#9b712b]">{item.ur}</Urdu>
            </div>
            {item.fields.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 max-m:grid-cols-1">
                {item.fields.filter((field) => field.type !== 'derived').map((field) => <FieldRow key={field.name} field={field} value={values[field.name]} onChange={change} error={errors[field.name]} countries={countries} cities={cities} castes={castes} />)}
              </div>
            ) : documents}
          </section>
        ))}
        {message && <p role="alert" className="border-l-[3px] border-[#a33a2c] bg-[#fbeeec] p-3 text-xs">{t(message)}</p>}
        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="button" tone="gold" disabled={busy} onClick={submit} className="cursor-pointer shadow-[0_10px_30px_#03223f33]">{t(busy ? 'Saving…' : mode === 'create' ? 'Save profile' : 'Save changes')} <FaCheck aria-hidden="true" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="scroll-mt-5">
      <ol aria-label={t('Progress')} className="mb-3 flex items-center gap-1.5">
        {SECTIONS.map((item, index) => (
          <li key={item.key} className="flex-1">
            <button
              type="button"
              aria-label={t(item.title)}
              aria-current={index === step ? 'step' : undefined}
              disabled={index > step}
              onClick={() => goTo(index)}
              className={`block h-1.5 w-full rounded-full transition-colors duration-300 enabled:cursor-pointer ${index <= step ? 'bg-gold' : 'bg-[#e6ddcc]'}`}
            />
          </li>
        ))}
      </ol>
      <p className="mb-6 text-[11px] font-semibold tracking-[1px] text-bronze">{t('STEP {step} OF {total}', { step: step + 1, total: SECTIONS.length })}</p>

      <div className="rounded-[20px] border border-line bg-white p-[35px] shadow-[0_12px_35px_#03223f08] max-m:p-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={section.key} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -24 }} transition={{ duration: 0.22 }}>
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#eee6d8] pb-4">
              <h2 className="font-quicksand text-2xl font-bold text-navy max-m:text-xl">{t(section.title)}</h2>
              <Urdu className="text-lg leading-10 text-[#9b712b]">{section.ur}</Urdu>
            </div>

            <div className={`grid grid-cols-2 gap-5 max-m:grid-cols-1 ${section.fields.length === 0 ? 'hidden' : ''}`}>
              {section.fields.map((field) => field.type === 'derived' ? (
                <div key={field.name} className={labelClass}>
                  Age
                  <p className="mt-2 rounded-[7px] border border-[#dce0dc] bg-cream p-[13px] text-[13px] font-normal">{age ?? 'Calculated from date of birth'}</p>
                </div>
              ) : (
                <FieldRow key={field.name} field={field} value={values[field.name]} onChange={change} error={errors[field.name]} countries={countries} cities={cities} castes={castes} />
              ))}
            </div>

            {last && documents}
          </motion.div>
        </AnimatePresence>

        {message && <p role="alert" className="mt-5 border-l-[3px] border-[#a33a2c] bg-[#fbeeec] p-3 text-xs">{t(message)}</p>}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#eee6d8] pt-6">
          <Button type="button" tone="outline" disabled={step === 0} onClick={() => goTo(step - 1)} className="cursor-pointer"><FaArrowLeft aria-hidden="true" /> {t('Back')}</Button>
          {last ? (
            <Button type="button" tone="gold" disabled={busy} onClick={submit} className="cursor-pointer">
              {busy ? 'Saving…' : mode === 'create' ? 'Submit profile' : 'Save changes'} <FaCheck aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" onClick={next} className="cursor-pointer">{t('Continue')} <FaArrowRight aria-hidden="true" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

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
import { SECTIONS, validateProfile, validateStep, ALL_FIELDS, visibleProfileFields } from '@/lib/profile-schema.js';
import { withoutHidden } from '@/lib/form-conditions.js';
import { AdminProfileSettings } from './AdminProfileSettings';
import { CropPreview, PhotoCropper } from './PhotoCropper';
import { useT } from '@/components/i18n/LanguageProvider';

const MAX_PHOTOS = 6;

function FilePicker({ label, hint, accept = 'image/jpeg,image/png,image/webp', multiple, onChange, files }) {
  const t = useT();
  return (
    <label className={labelClass}>
      {label}
      <input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange([...event.target.files])} className={`${inputClass} cursor-pointer file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy`} />
      <span className="mt-1 block font-normal text-muted">{hint}</span>
      {files?.length > 0 && <span className="mt-1 block font-medium text-[#3d6b4a]">{t('{count} selected', { count: files.length })}</span>}
    </label>
  );
}

// A yes/no question as two large buttons, easy to tap on a phone.
function YesNo({ name, question, hint, value, onChange }) {
  const t = useT();
  return (
    <fieldset>
      <legend className={labelClass}>{t(question)}</legend>
      <div role="radiogroup" className="mt-2 grid max-w-[360px] grid-cols-2 gap-3">
        {[['yes', 'Yes'], ['no', 'No']].map(([key, label]) => (
          <label key={key} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-colors ${value === key ? 'border-navy bg-navy text-white' : 'border-[#e2dccd] bg-white text-navy hover:border-gold'}`}>
            <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} className="sr-only" />
            {t(label)}
          </label>
        ))}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted">{t(hint)}</p>}
    </fieldset>
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
  // For each new photo: its preview address and the part chosen for cards.
  const [previews, setPreviews] = useState([]);
  const [crops, setCrops] = useState([]);
  // Photos already on file whose card picture was adjusted: { [photoId]: crop }.
  const [recrops, setRecrops] = useState({});
  // The photo being adjusted: { kind: 'new', index, queue } or { kind: 'existing', photo }.
  const [cropping, setCropping] = useState(null);
  const [removed, setRemoved] = useState([]);
  const [front, setFront] = useState([]);
  const [back, setBack] = useState([]);
  const [showPhoto, setShowPhoto] = useState(photoPublic);
  const [consent, setConsent] = useState(false);
  // Step 7 asks before showing anything: photos only if the person wants to add them, the CNIC only if
  // they apply for the blue tick, and the authorisation only then.
  const [wantPhotos, setWantPhotos] = useState(existingPhotos.length > 0 ? 'yes' : '');
  const [applyTick, setApplyTick] = useState('');
  const [verifyConsent, setVerifyConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [direction, setDirection] = useState(1);
  const [accessType, setAccessType] = useState(admin?.type ?? 'paid');
  const [publish, setPublish] = useState(true);
  const [extraInfo, setExtraInfo] = useState(admin?.extra ?? '');
  const [duplicates, setDuplicates] = useState(admin?.duplicates ?? []);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const context = useMemo(() => ({ countries }), [countries]);
  const options = { admin: !!admin, context };
  // The questions that apply to this person, worked out again after every answer.
  const visible = useMemo(() => visibleProfileFields(values, context), [values, context]);
  const shown = (fields) => fields.filter((field) => field.type === 'derived' || visible.has(field.name));
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
  const accent = (item) => ({ '--accent': item.color ?? '#062b4e' });
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

  // Scrolls to the first field with an error and puts the cursor in it, so it cannot be missed.
  const showFirstError = (fieldErrors) => {
    requestAnimationFrame(() => {
      const names = Object.keys(fieldErrors);
      const field = names.map((name) => document.getElementById(name)).find(Boolean);
      if (field) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field.focus({ preventScroll: true });
      } else top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const next = () => {
    const stepErrors = validateStep(section.key, values, options);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      setMessage('Please correct the highlighted fields.');
      showFirstError(stepErrors);
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
      // Go straight to the first field that needs fixing (everything typed stays as it is).
      showFirstError(stepErrors);
      return;
    }
    if (mode === 'create' && !admin && !consent) {
      setMessage('Please confirm the consent statement.');
      return;
    }
    const sendCnic = applyTick === 'yes' || admin;
    if (sendCnic && (front[0] || back[0]) && !(front[0] && back[0])) {
      setMessage('Please upload both the front and the back of the CNIC.');
      return;
    }
    if (!admin && applyTick === 'yes' && front[0] && !verifyConsent) {
      setMessage('Please authorise Al Zaujain to verify your information and documents.');
      return;
    }
    setBusy(true);
    setMessage('');
    const form = new FormData();
    // Answers to questions that no longer apply are not sent.
    form.append('data', JSON.stringify(withoutHidden(ALL_FIELDS, values, context, '')));
    (wantPhotos === 'yes' || admin ? photos : []).forEach((file, index) => {
      form.append('photos', file);
      form.append('photo_crop', crops[index] ? JSON.stringify(crops[index]) : '');
    });
    Object.entries(recrops).forEach(([id, crop]) => form.append('recrop', `${id}|${JSON.stringify(crop)}`));
    if (sendCnic && front[0]) form.append('cnic_front', front[0]);
    if (sendCnic && back[0]) form.append('cnic_back', back[0]);
    if (verifyConsent) form.append('verify_consent', 'yes');
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
        // A field error goes to that field; anything else (such as a possible duplicate) to the message at the top.
        showFirstError(result.errors ?? {});
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

  const photoUrl = (file) => `/media/photos/${file}${token ? `?m=${token}` : ''}`;
  // Like WhatsApp: each newly chosen photo opens the cropper in turn.
  function choosePhotos(files) {
    const chosen = files.slice(0, MAX_PHOTOS - existingPhotos.filter((photo) => !removed.includes(photo.id)).length);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(chosen);
    setPreviews(chosen.map((file) => URL.createObjectURL(file)));
    setCrops(chosen.map(() => null));
    if (chosen.length > 0) setCropping({ kind: 'new', index: 0, queue: chosen.map((_, index) => index).slice(1) });
  }
  function nextCrop() {
    setCropping((current) => (current?.kind === 'new' && current.queue.length > 0 ? { kind: 'new', index: current.queue[0], queue: current.queue.slice(1) } : null));
  }
  function dropPhoto(index) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((list) => list.filter((_, i) => i !== index));
    setPreviews((list) => list.filter((_, i) => i !== index));
    setCrops((list) => list.filter((_, i) => i !== index));
  }

  // Progress within this step, counting only the questions that apply.
  const stepFields = shown(section.fields).filter((field) => field.type !== 'derived');
  const stepAnswered = stepFields.filter((field) => values[field.name] !== undefined && values[field.name] !== null && String(values[field.name]).trim() !== '').length;

  const keptPhotos = existingPhotos.filter((photo) => !removed.includes(photo.id));
  const remaining = MAX_PHOTOS - keptPhotos.length;

  const photosOn = wantPhotos === 'yes' || !!admin;
  const tickOn = applyTick === 'yes' || !!admin;
  const documents = (
              <div className="grid gap-5">
                {!admin && <YesNo name="want_photos" question="Would you like to upload your profile photographs?" hint="You can add up to 6 photos. You can also add them later." value={wantPhotos} onChange={setWantPhotos} />}
                {photosOn && keptPhotos.length > 0 && (
                  <div>
                    <p className={labelClass}>{t('Current photos')}</p>
                    <ul className="mt-2 flex flex-wrap gap-3">
                      {keptPhotos.map((photo) => (
                        <li key={photo.id} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {recrops[photo.id]
                            ? <CropPreview src={photoUrl(photo.file)} crop={recrops[photo.id]} />
                            : <img src={photoUrl(photo.thumb)} alt={t('Profile')} className="size-24 rounded-full object-cover" />}
                          <button type="button" onClick={() => setCropping({ kind: 'existing', photo })} className="mt-1 block w-full cursor-pointer text-center text-[11px] font-semibold text-navy underline">{t('Adjust card photo')}</button>
                          <button type="button" onClick={() => setRemoved([...removed, photo.id])} className="block w-full cursor-pointer text-center text-[11px] font-semibold text-[#a33a2c]">{t('Remove')}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {photosOn && remaining > 0 && <FilePicker label={t('Profile photographs')} hint={t('JPG, PNG or WebP, up to 8 MB each. You can add {count} more.', { count: remaining })} multiple files={photos} onChange={choosePhotos} />}
                {photosOn && photos.length > 0 && (
                  <div>
                    <p className={labelClass}>{t('How your photos appear on proposal cards')}</p>
                    <ul className="mt-2 flex flex-wrap gap-3">
                      {photos.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="w-24">
                          <CropPreview src={previews[index]} crop={crops[index]} />
                          <button type="button" onClick={() => setCropping({ kind: 'new', index, queue: [] })} className="mt-1 block w-full cursor-pointer text-center text-[11px] font-semibold text-navy underline">{t('Adjust')}</button>
                          <button type="button" onClick={() => dropPhoto(index)} className="block w-full cursor-pointer text-center text-[11px] font-semibold text-[#a33a2c]">{t('Remove')}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cropping && (
                  <PhotoCropper
                    key={cropping.kind === 'new' ? `new-${cropping.index}` : `old-${cropping.photo.id}`}
                    src={cropping.kind === 'new' ? previews[cropping.index] : photoUrl(cropping.photo.file)}
                    initial={cropping.kind === 'new' ? crops[cropping.index] : recrops[cropping.photo.id]}
                    onCancel={nextCrop}
                    onDone={(crop) => {
                      if (cropping.kind === 'new') setCrops((list) => Object.assign([...list], { [cropping.index]: crop }));
                      else setRecrops((map) => ({ ...map, [cropping.photo.id]: crop }));
                      nextCrop();
                    }}
                  />
                )}
                {photosOn && (keptPhotos.length > 0 || photos.length > 0) && (
                  <label className="flex items-start gap-2.5 rounded-xl bg-cream p-3 text-xs leading-5">
                    <input type="checkbox" checked={!showPhoto} onChange={(event) => setShowPhoto(!event.target.checked)} className="mt-1 accent-navy" />
                    {t('Keep my photographs private and share them only through Al Zaujain Marriage Bureau.')}
                  </label>
                )}

                <div className="rounded-xl border border-[#ddcfb1] bg-[#f8f4eb] p-5">
                  <h3 className="mb-1 flex items-center gap-2 font-quicksand text-base font-bold"><FaCircleCheck aria-hidden="true" className="text-verified" /> {t('Get the blue verified tick (optional)')}</h3>
                  <p className="mb-4 text-xs leading-5 text-muted">
                    {t('Upload your CNIC so our team can verify this profile. It is encrypted, never shown publicly, and only administrators can open it.')}
                  </p>
                  {verificationStatus === 'verified' && <p className="mb-3 text-xs font-semibold text-[#3d6b4a]">{t('This profile is verified. Uploading a new CNIC restarts the review.')}</p>}
                  {verificationStatus === 'pending' && <p className="mb-3 text-xs font-semibold text-[#806126]">{t('Your CNIC is waiting for review.')}</p>}
                  {!admin && <YesNo name="apply_tick" question="Would you like to apply for the blue verified tick?" value={applyTick} onChange={setApplyTick} />}
                  {tickOn && (
                    <>
                      {/* Both sides of the CNIC, always together. */}
                      <div className="mt-4 grid grid-cols-2 gap-4 max-m:grid-cols-1">
                        <FilePicker label={t('CNIC front')} hint={t('Clear photo or scan.')} files={front} onChange={setFront} />
                        <FilePicker label={t('CNIC back')} hint={t('Clear photo or scan.')} files={back} onChange={setBack} />
                      </div>
                      {!admin && (
                        <label className="mt-4 flex items-start gap-2.5 text-xs leading-5">
                          <input type="checkbox" checked={verifyConsent} onChange={(event) => setVerifyConsent(event.target.checked)} className="mt-1 accent-navy" />
                          <span>{t('I authorise Al Zaujain Marriage Bureau to verify the information and documents I have submitted.')}</span>
                        </label>
                      )}
                    </>
                  )}
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
          <section key={item.key} style={accent(item)} className="rounded-[20px] border border-line bg-white p-[30px] shadow-[0_12px_35px_#03223f08] max-m:p-5">
            <div className="-mx-[30px] -mt-[30px] mb-6 flex items-center justify-between gap-4 rounded-t-[19px] border-t-[5px] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,white)] px-[30px] py-4 max-m:-mx-5 max-m:-mt-5 max-m:px-5">
              <h2 className="font-quicksand text-xl font-bold text-[var(--accent)]">{t(item.title)}</h2>
              <Urdu heading className="text-lg leading-10 text-[#9b712b]">{item.ur}</Urdu>
            </div>
            {item.fields.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 max-m:grid-cols-1">
                {shown(item.fields).filter((field) => field.type !== 'derived').map((field) => <FieldRow key={field.name} field={field} value={values[field.name]} onChange={change} error={errors[field.name]} countries={countries} cities={cities} castes={castes} values={values} errors={errors} fields={ALL_FIELDS} />)}
              </div>
            ) : documents}
          </section>
        ))}
        {message && <p role="alert" className="border-s-[3px] border-[#a33a2c] bg-[#fbeeec] p-3 text-xs">{t(message)}</p>}
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
              onClick={() => goTo(index)}
              style={accent(item)}
              className={`block w-full cursor-pointer rounded-full transition-all duration-300 ${index === step ? 'h-2.5 bg-[var(--accent)]' : index < step ? 'h-1.5 bg-[var(--accent)] opacity-60' : 'h-1.5 bg-[#e6ddcc] hover:bg-[color-mix(in_srgb,var(--accent)_40%,white)]'}`}
            />
          </li>
        ))}
      </ol>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p style={accent(section)} className="text-[11px] font-semibold tracking-[1px] text-[var(--accent)]">{t('STEP {step} OF {total}', { step: step + 1, total: SECTIONS.length })}</p>
        {stepFields.length > 0 && <p className="text-[11px] font-medium text-muted">{t('{answered} of {total} questions answered', { answered: stepAnswered, total: stepFields.length })}</p>}
      </div>

      <div style={accent(section)} className="rounded-[20px] border border-line bg-white p-[35px] shadow-[0_12px_35px_#03223f08] transition-[border-color] duration-300 max-m:p-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={section.key} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -24 }} transition={{ duration: 0.22 }}>
            <div className="-mx-[35px] -mt-[35px] mb-6 flex flex-wrap items-center justify-between gap-x-4 rounded-t-[19px] border-t-[5px] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,white)] px-[35px] py-5 max-m:-mx-6 max-m:-mt-6 max-m:px-6 max-m:py-4">
              <h2 className="font-quicksand text-2xl font-bold text-[var(--accent)] max-m:text-xl">{t(section.title)}</h2>
              <Urdu heading className="text-lg leading-10 text-[#9b712b]">{section.ur}</Urdu>
            </div>

            <div className={`grid grid-cols-2 gap-5 max-m:grid-cols-1 ${section.fields.length === 0 ? 'hidden' : ''}`}>
              {shown(section.fields).map((field) => field.type === 'derived' ? (
                <div key={field.name} className={labelClass}>
                  Age
                  <p className="mt-2 rounded-[7px] border border-[#dce0dc] bg-cream p-[13px] text-[13px] font-normal">{age ?? 'Calculated from date of birth'}</p>
                </div>
              ) : (
                <FieldRow key={field.name} field={field} value={values[field.name]} onChange={change} error={errors[field.name]} countries={countries} cities={cities} castes={castes} values={values} errors={errors} fields={ALL_FIELDS} />
              ))}
            </div>

            {last && documents}
          </motion.div>
        </AnimatePresence>

        {message && <p role="alert" className="mt-5 border-s-[3px] border-[#a33a2c] bg-[#fbeeec] p-3 text-xs">{t(message)}</p>}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#eee6d8] pt-6">
          <Button type="button" tone="outline" disabled={step === 0} onClick={() => goTo(step - 1)} className="cursor-pointer"><FaArrowLeft aria-hidden="true" className="rtl:-scale-x-100" /> {t('Back')}</Button>
          {last ? (
            <Button type="button" tone="gold" disabled={busy} onClick={submit} className="cursor-pointer">
              {busy ? 'Saving…' : mode === 'create' ? 'Submit profile' : 'Save changes'} <FaCheck aria-hidden="true" />
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {/* Every question is optional, so a family can leave a whole section for later. */}
              <button type="button" onClick={() => { setErrors({}); setMessage(''); goTo(step + 1); }} className="cursor-pointer text-[13px] font-semibold text-muted underline-offset-4 hover:text-navy hover:underline">{t('Skip this section')}</button>
              <Button type="button" onClick={next} className="cursor-pointer">{t('Continue')} <FaArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

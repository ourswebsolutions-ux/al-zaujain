'use client';

import { useEffect, useRef, useState } from 'react';
import { FaArrowsUpDownLeftRight, FaImage } from 'react-icons/fa6';
import { BannerShade, BannerText } from '@/components/home/BannerText';
import { useT } from '@/components/i18n/LanguageProvider';
import { inputSm } from './styles';

const label = 'grid min-w-0 gap-1 text-[12.5px] font-medium text-[var(--d-text,#47566a)] [&>input]:w-full [&>input]:min-w-0 [&>select]:w-full [&>textarea]:w-full';
const check = 'flex cursor-pointer items-center gap-1.5 text-[13px]';
const file = `${inputSm} w-full file:me-3 file:cursor-pointer file:rounded file:border-0 file:bg-[#062b4e14] file:px-3 file:py-1 file:text-navy`;
const LINK = '(/|#|https?://|tel:|mailto:).*';
// The live banner is laid out for a 1440 × 520 desktop; the preview draws that box and scales it.
const W = 1440;
const H = 520;

/**
 * Banner fields with a drag-and-drop designer. The image alone is the default. Switching the text on
 * shows a true-to-size preview where the administrator drags the words to where they should sit;
 * arrow keys move them too. The position is posted as percentages.
 */
export function BannerEditor({ banner, imageSrc }) {
  const t = useT();
  const [values, setValues] = useState(() => ({
    eyebrow: banner?.eyebrow ?? '', heading: banner?.heading ?? '', urdu: banner?.urdu ?? '', text: banner?.text ?? '',
    cta: banner?.cta ?? '', href: banner?.href ?? '', cta2: banner?.cta2 ?? '', href2: banner?.href2 ?? '',
    showText: banner?.showText ?? false, textX: banner?.textX ?? 8, textY: banner?.textY ?? 50,
    textAlign: banner?.textAlign ?? 'start', textTheme: banner?.textTheme ?? 'light', textSize: banner?.textSize ?? 'md', shade: banner?.shade ?? 'soft',
  }));
  const [preview, setPreview] = useState(imageSrc ?? null);
  const [scale, setScale] = useState(0.5);
  const frame = useRef(null);
  const drag = useRef(null);
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  useEffect(() => {
    if (!frame.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [values.showText]);

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const area = () => {
    const box = frame.current.getBoundingClientRect();
    // The words move inside the same margins as on the website (6% across, 8% down).
    return { left: box.left + box.width * 0.06, top: box.top + box.height * 0.08, width: box.width * 0.88, height: box.height * 0.84 };
  };
  const moveTo = (clientX, clientY) => {
    const box = area();
    const x = Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100));
    setValues((current) => ({ ...current, textX: Math.round(x * 10) / 10, textY: Math.round(y * 10) / 10 }));
  };
  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = true;
  };
  const onPointerMove = (event) => { if (drag.current) moveTo(event.clientX, event.clientY); };
  const onPointerUp = () => { drag.current = false; };
  const onKeyDown = (event) => {
    const step = event.shiftKey ? 5 : 1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    setValues((current) => ({ ...current, textX: Math.min(100, Math.max(0, current.textX + delta[0])), textY: Math.min(100, Math.max(0, current.textY + delta[1])) }));
  };
  const snap = (x, y) => setValues((current) => ({ ...current, textX: x, textY: y }));

  return (
    <>
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
        <label className={label}>
          {t(banner ? 'Replace image (1500 × 500, shown the same on computers and phones)' : 'Banner image (1500 × 500, shown the same on computers and phones)')}
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required={!banner} className={file} onChange={(event) => { const picked = event.target.files?.[0]; if (picked) setPreview(URL.createObjectURL(picked)); }} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className={check}><input type="checkbox" name="active" defaultChecked={banner ? banner.active : true} className="accent-navy" /> {t('Show on the homepage')}</label>
        <label className={check}><input type="checkbox" name="show_text" checked={values.showText} onChange={set('showText')} className="accent-navy" /> {t('Add text and buttons on the banner (optional)')}</label>
        {banner?.mobileImage && <label className={check}><input type="checkbox" name="remove_mobile" className="accent-navy" /> {t('Remove the phone image')}</label>}
      </div>

      {!values.showText && ['eyebrow', 'heading', 'urdu', 'text', 'cta', 'cta2', 'href2'].map((key) => <input key={key} type="hidden" name={key} value={values[key]} />)}
      {!values.showText && ['text_x', 'text_y', 'text_align', 'text_theme', 'text_size', 'shade'].map((name) => <input key={name} type="hidden" name={name} value={values[{ text_x: 'textX', text_y: 'textY', text_align: 'textAlign', text_theme: 'textTheme', text_size: 'textSize', shade: 'shade' }[name]]} />)}
      {!values.showText && (
        <label className={`${label} max-w-[640px]`}>{t('Link when the banner is tapped (optional)')}<input name="href" pattern={LINK} title={t('Start with /, https://, tel: or mailto:')} maxLength={300} value={values.href} onChange={set('href')} placeholder="/proposals" className={inputSm} /></label>
      )}
      {!values.showText && preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="aspect-[3/1] w-full max-w-[640px] rounded-lg object-cover shadow-[0_4px_14px_#062b4e26]" />
      )}

      {values.showText && (
        <div className="grid gap-3 rounded-xl border border-[var(--d-line,#e6e8ee)] bg-[var(--d-soft,#f8f9fb)] p-3">
          <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
            <label className={label}>{t('Small line above the heading')}<input name="eyebrow" maxLength={80} value={values.eyebrow} onChange={set('eyebrow')} className={inputSm} /></label>
            <label className={label}>{t('Heading')}<input name="heading" maxLength={140} value={values.heading} onChange={set('heading')} className={inputSm} /></label>
          </div>
          <label className={label}>{t('Urdu line (optional)')}<input name="urdu" dir="rtl" maxLength={140} value={values.urdu} onChange={set('urdu')} className={inputSm} /></label>
          <label className={label}>{t('Description')}<textarea name="text" rows={2} maxLength={320} value={values.text} onChange={set('text')} className={inputSm} /></label>
          <div className="grid grid-cols-[1fr_1.4fr_1fr_1.4fr] gap-3 max-p:grid-cols-2 max-m:grid-cols-1">
            <label className={label}>{t('Button text')}<input name="cta" maxLength={40} value={values.cta} onChange={set('cta')} placeholder={t('e.g. Browse proposals')} className={inputSm} /></label>
            <label className={label}>{t('Button link')}<input name="href" pattern={LINK} title={t('Start with /, https://, tel: or mailto:')} maxLength={300} value={values.href} onChange={set('href')} placeholder="/proposals" className={inputSm} /></label>
            <label className={label}>{t('Second button text')}<input name="cta2" maxLength={40} value={values.cta2} onChange={set('cta2')} className={inputSm} /></label>
            <label className={label}>{t('Second button link')}<input name="href2" pattern={LINK} title={t('Start with /, https://, tel: or mailto:')} maxLength={300} value={values.href2} onChange={set('href2')} placeholder="/submit-profile" className={inputSm} /></label>
          </div>
          <div className="grid grid-cols-4 gap-3 max-p:grid-cols-2">
            <label className={label}>{t('Text colour')}<select name="text_theme" value={values.textTheme} onChange={set('textTheme')} className={inputSm}><option value="light">{t('White text')}</option><option value="dark">{t('Navy text')}</option></select></label>
            <label className={label}>{t('Text size')}<select name="text_size" value={values.textSize} onChange={set('textSize')} className={inputSm}><option value="sm">{t('Small')}</option><option value="md">{t('Medium')}</option><option value="lg">{t('Large')}</option></select></label>
            <label className={label}>{t('Alignment')}<select name="text_align" value={values.textAlign} onChange={set('textAlign')} className={inputSm}><option value="start">{t('Left')}</option><option value="center">{t('Centre')}</option><option value="end">{t('Right')}</option></select></label>
            <label className={label}>{t('Shade behind text')}<select name="shade" value={values.shade} onChange={set('shade')} className={inputSm}><option value="soft">{t('Soft')}</option><option value="strong">{t('Strong')}</option><option value="none">{t('None')}</option></select></label>
          </div>
          <input type="hidden" name="text_x" value={values.textX} />
          <input type="hidden" name="text_y" value={values.textY} />

          <div>
            <p className="mb-2 flex items-center gap-2 text-[12.5px] font-medium text-[var(--d-text,#47566a)]"><FaArrowsUpDownLeftRight aria-hidden="true" /> {t('Drag the text to place it. Arrow keys move it too.')}</p>
            <div ref={frame} className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-dark shadow-[0_4px_14px_#062b4e26]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
              ) : <span className="absolute inset-0 grid place-items-center text-sm text-white/70"><FaImage aria-hidden="true" className="me-2 inline" /> {t('Choose an image to see the preview')}</span>}
              <div style={{ width: W, height: H, transform: `scale(${scale})` }} className="absolute start-0 top-0 origin-top-left rtl:origin-top-right">
                <BannerShade banner={{ ...values, showText: true }} />
                <div className="absolute inset-x-[6%] inset-y-[8%]">
                  <BannerText banner={values} preview />
                </div>
              </div>
              <button
                type="button"
                aria-label={t('Text position: {x}% across, {y}% down', { x: Math.round(values.textX), y: Math.round(values.textY) })}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={onKeyDown}
                style={{ left: `calc(6% + ${values.textX * 0.88}%)`, top: `calc(8% + ${values.textY * 0.84}%)` }}
                className="absolute z-10 grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-full border-2 border-white bg-gold text-dark shadow-[0_4px_14px_#00000059] active:cursor-grabbing focus-visible:outline-3 focus-visible:outline-white"
              >
                <FaArrowsUpDownLeftRight aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {[['Left', 0, 50], ['Centre', 50, 50], ['Right', 100, 50], ['Bottom left', 0, 100], ['Bottom centre', 50, 100]].map(([name, x, y]) => (
                <button key={name} type="button" onClick={() => snap(x, y)} className="cursor-pointer rounded-md border border-[var(--d-line,#dfe2e8)] bg-white px-2.5 py-1 text-navy hover:border-navy">{t(name)}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

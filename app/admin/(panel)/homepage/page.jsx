import { FaArrowDown, FaArrowUp, FaTrash } from 'react-icons/fa6';
import { deleteBanner, moveBanner, saveBanner, saveDirectorAction, toggleBanner } from '@/app/actions/homepage';
import { BannerEditor } from '@/components/admin/BannerEditor';
import { BannerOrder } from '@/components/admin/BannerOrder';
import { ActionButton, Badge, ConfirmDelete, Panel, Title } from '@/components/admin/Ui';
import { inputSm } from '@/components/admin/styles';
import { ActionForm, Submit } from '@/components/ui/Form';
import { requireAdmin } from '@/lib/auth.js';
import { getBanners, getDirector, imageSrc } from '@/lib/homepage.js';
import { getT } from '@/lib/i18n/server.js';

export const metadata = { title: 'Homepage' };

const label = 'grid min-w-0 gap-1 text-[12.5px] font-medium text-[var(--d-text,#47566a)] [&>input]:w-full [&>input]:min-w-0 [&>textarea]:w-full';
const check = 'flex cursor-pointer items-center gap-1.5 text-[13px]';
const file = `${inputSm} w-full file:me-3 file:cursor-pointer file:rounded file:border-0 file:bg-[#062b4e14] file:px-3 file:py-1 file:text-navy`;

export default async function HomepageSettings() {
  await requireAdmin();
  const t = await getT();
  const [banners, director] = await Promise.all([getBanners(), getDirector()]);
  const shown = banners.filter((banner) => banner.active && banner.image).length;
  return (
    <>
      <Title text="The banner at the top of the homepage and the director section. One banner stands still; two or more rotate on their own.">{t('Homepage')}</Title>

      <Panel title="Add a banner">
        <ActionForm action={saveBanner} className="grid gap-3">
          <BannerEditor />
          <p className="text-[12.5px] text-muted">{t('Links can lead inside the website (for example /proposals or /fees) or to https://, tel: and mailto: addresses.')}</p>
          <Submit className="w-fit cursor-pointer">{t('Add banner')}</Submit>
        </ActionForm>
      </Panel>

      <h2 className="mb-3 mt-2 text-[15px] font-semibold text-navy">
        {t('Banners')} · {shown === 0 ? t('none shown, so the standard banner appears') : shown === 1 ? t('1 shown, standing still') : t('{count} shown, rotating', { count: shown })}
      </h2>
      <BannerOrder banners={banners.map((banner) => ({ id: banner.id, heading: banner.showText ? banner.heading : '', active: banner.active, src: imageSrc(banner.image, 400) }))} />
      {banners.length === 0 && <Panel><p className="py-4 text-center text-sm text-muted">{t('No banners yet. Until you add one, the homepage shows the standard Al Zaujain banner.')}</p></Panel>}
      <div className="grid gap-6">
        {banners.map((banner, index) => (
          <Panel key={banner.id} title={`${index + 1}. ${(banner.showText && banner.heading) || t('Image banner')}`}>
            <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2">
              <Badge value={banner.active ? 'active' : 'inactive'} label={banner.active ? 'Shown' : 'Hidden'} />
            </div>
            <div className="grid grid-cols-[minmax(0,160px)_minmax(0,1fr)] items-start gap-5 max-p:grid-cols-1 [&>*]:min-w-0">
              <p className="text-xs text-muted">{t('Shown as a 3:1 rectangle (1500 × 500) on computers and phones alike, like the reference site.')}</p>
              <ActionForm action={saveBanner} className="grid gap-3">
                <BannerEditor banner={banner} imageSrc={imageSrc(banner.image, 1400)} />
                <Submit size="sm" className="w-fit cursor-pointer">{t('Save changes')}</Submit>
              </ActionForm>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--d-line,#eef0f3)] pt-3">
              {index > 0 && <ActionButton action={moveBanner} fields={{ id: banner.id, direction: 'up' }} tone="outline"><FaArrowUp aria-hidden="true" /> {t('Move up')}</ActionButton>}
              {index < banners.length - 1 && <ActionButton action={moveBanner} fields={{ id: banner.id, direction: 'down' }} tone="outline"><FaArrowDown aria-hidden="true" /> {t('Move down')}</ActionButton>}
              <ActionButton action={toggleBanner} fields={{ id: banner.id }} tone="outline">{t(banner.active ? 'Hide' : 'Show')}</ActionButton>
              <ConfirmDelete action={deleteBanner} fields={{ id: banner.id }} icon={<FaTrash aria-hidden="true" />} label="Delete banner" title="Delete this banner?" text="The banner and its images are removed from the homepage." />
            </div>
          </Panel>
        ))}
      </div>

      <h2 className="mb-3 mt-4 text-[15px] font-semibold text-navy">{t('Director section')}</h2>
      <Panel>
        <ActionForm action={saveDirectorAction} className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] items-start gap-5 max-m:grid-cols-1">
            <div className="grid gap-2">
              {director.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(director.photo, 400)} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ) : <div className="grid aspect-square w-full place-items-center rounded-lg bg-[#f3ece0] text-center text-xs text-muted">{t('No photo: the logo is shown')}</div>}
              <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" aria-label={t('Director photo')} className={file} />
              {director.photo && <label className={check}><input type="checkbox" name="remove_photo" className="accent-navy" /> {t('Remove photo')}</label>}
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
                <label className={label}>{t('Name')}<input name="name" required maxLength={100} defaultValue={director.name} className={inputSm} /></label>
                <label className={label}>{t('Title (shown above the section)')}<input name="title" maxLength={140} defaultValue={director.title} className={inputSm} /></label>
              </div>
              <label className={label}>{t('One-line summary')}<textarea name="summary" rows={2} maxLength={400} defaultValue={director.summary} className={inputSm} /></label>
              <label className={label}>{t('About the director (leave a blank line between paragraphs)')}<textarea name="bio" rows={6} maxLength={2000} defaultValue={director.bio} className={inputSm} /></label>
              <div className="grid grid-cols-2 gap-3 max-m:grid-cols-1">
                <label className={label}>{t('Button text')}<input name="cta" maxLength={40} defaultValue={director.cta} className={inputSm} /></label>
                <label className={label}>{t('Button link (empty: WhatsApp)')}<input name="href" pattern="(/|#|https?://|tel:|mailto:).*" title={t('Start with /, https://, tel: or mailto:')} maxLength={300} defaultValue={director.href} placeholder="https://wa.me/92…" className={inputSm} /></label>
              </div>
            </div>
          </div>
          <Submit className="w-fit cursor-pointer">{t('Save director section')}</Submit>
        </ActionForm>
      </Panel>
    </>
  );
}

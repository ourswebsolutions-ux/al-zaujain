'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth.js';
import { getBanners, getDirector, safeHref, saveBanners, saveDirector } from '@/lib/homepage.js';
import { logActivity } from '@/lib/security.js';
import { deleteHomepageImage, saveHomepageImage, UploadError } from '@/lib/uploads.js';

const text = (form, key) => String(form.get(key) ?? '').replace(/\r\n?/g, '\n').trim();
const hasFile = (file) => file && typeof file.arrayBuffer === 'function' && file.size > 0;
const refresh = () => { revalidatePath('/'); revalidatePath('/admin/homepage'); };

function bannerFields(form) {
  return {
    eyebrow: text(form, 'eyebrow'), heading: text(form, 'heading'), urdu: text(form, 'urdu'), text: text(form, 'text'),
    cta: text(form, 'cta'), href: text(form, 'href'), cta2: text(form, 'cta2'), href2: text(form, 'href2'),
    active: form.get('active') === 'on',
    showText: form.get('show_text') === 'on',
    textX: text(form, 'text_x'), textY: text(form, 'text_y'),
    textAlign: text(form, 'text_align'), textTheme: text(form, 'text_theme'), textSize: text(form, 'text_size'), shade: text(form, 'shade'),
  };
}

function checkLinks(values) {
  for (const [label, key] of [['first button', 'href'], ['second button', 'href2']]) {
    if (values[key] && !safeHref(values[key])) return `The ${label} link must start with /, https://, tel: or mailto:.`;
  }
  if (values.showText && !values.heading && !values.text && !values.cta) return 'Write a heading, a description or a button, or switch the text off.';
  if (values.showText && values.cta && !values.href) return 'Add a link for the first button, or leave its text empty.';
  if (values.showText && values.cta2 && !values.href2) return 'Add a link for the second button, or leave its text empty.';
  return null;
}

export async function saveBanner(_previous, form) {
  const admin = await requireAdmin();
  const id = text(form, 'id');
  const list = await getBanners();
  const current = id ? list.find((banner) => banner.id === id) : null;
  if (id && !current) return { ok: false, message: 'This banner no longer exists.' };
  const values = bannerFields(form);
  const problem = checkLinks(values);
  if (problem) return { ok: false, message: problem };
  const image = form.get('image');
  const mobileImage = form.get('mobile_image');
  if (!current && !hasFile(image)) return { ok: false, message: 'Choose a banner image.' };
  const added = [];
  try {
    if (hasFile(image)) added.push(['image', await saveHomepageImage(image, 'banner')]);
    if (hasFile(mobileImage)) added.push(['mobileImage', await saveHomepageImage(mobileImage, 'banner')]);
  } catch (error) {
    for (const [, file] of added) await deleteHomepageImage(file);
    if (error instanceof UploadError) return { ok: false, message: error.message };
    if (String(error.message).startsWith('Cloudinary')) return { ok: false, message: 'The image could not be uploaded to image storage. Please try again.' };
    throw error;
  }
  const next = { ...(current ?? {}), ...values, ...Object.fromEntries(added) };
  if (form.get('remove_mobile') === 'on' && !added.some(([key]) => key === 'mobileImage')) next.mobileImage = null;
  await saveBanners(current ? list.map((banner) => (banner.id === id ? next : banner)) : [...list, next]);
  // Replaced images are removed from the disk once the new ones are saved.
  for (const [key] of added) if (current?.[key]) await deleteHomepageImage(current[key]);
  if (current?.mobileImage && next.mobileImage === null) await deleteHomepageImage(current.mobileImage);
  await logActivity(admin.id, current ? 'banner.update' : 'banner.create', values.heading || 'Homepage banner');
  refresh();
  return { ok: true, message: current ? 'Banner saved.' : 'Banner added to the homepage.', reset: !current };
}

export async function moveBanner(form) {
  await requireAdmin();
  const list = await getBanners();
  const index = list.findIndex((banner) => banner.id === text(form, 'id'));
  const target = index + (text(form, 'direction') === 'up' ? -1 : 1);
  if (index < 0 || target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  await saveBanners(list);
  refresh();
}

// Drag-and-drop order from the admin list: the ids in their new order.
export async function reorderBanners(ids) {
  await requireAdmin();
  const list = await getBanners();
  const wanted = Array.isArray(ids) ? ids.map(String) : [];
  const byId = new Map(list.map((banner) => [banner.id, banner]));
  const ordered = [...wanted.filter((id) => byId.has(id)).map((id) => byId.get(id)), ...list.filter((banner) => !wanted.includes(banner.id))];
  await saveBanners(ordered);
  refresh();
  return { ok: true };
}

export async function toggleBanner(form) {
  await requireAdmin();
  const list = await getBanners();
  await saveBanners(list.map((banner) => (banner.id === text(form, 'id') ? { ...banner, active: !banner.active } : banner)));
  refresh();
}

export async function deleteBanner(form) {
  const admin = await requireAdmin();
  const list = await getBanners();
  const banner = list.find((item) => item.id === text(form, 'id'));
  if (!banner) return;
  await saveBanners(list.filter((item) => item.id !== banner.id));
  if (banner.image) await deleteHomepageImage(banner.image);
  if (banner.mobileImage) await deleteHomepageImage(banner.mobileImage);
  await logActivity(admin.id, 'banner.delete', banner.heading || 'Homepage banner');
  refresh();
}

export async function saveDirectorAction(_previous, form) {
  const admin = await requireAdmin();
  const current = await getDirector();
  const values = { name: text(form, 'name'), title: text(form, 'title'), summary: text(form, 'summary'), bio: text(form, 'bio'), cta: text(form, 'cta'), href: text(form, 'href'), photo: current.photo };
  if (!values.name) return { ok: false, message: 'Enter the director’s name.' };
  if (values.href && !safeHref(values.href)) return { ok: false, message: 'The button link must start with /, https://, tel: or mailto:.' };
  const photo = form.get('photo');
  let saved = null;
  if (hasFile(photo)) {
    try {
      saved = await saveHomepageImage(photo, 'portrait');
    } catch (error) {
      if (error instanceof UploadError) return { ok: false, message: error.message };
      if (String(error.message).startsWith('Cloudinary')) return { ok: false, message: 'The image could not be uploaded to image storage. Please try again.' };
      throw error;
    }
    values.photo = saved;
  } else if (form.get('remove_photo') === 'on') {
    values.photo = null;
  }
  await saveDirector(values);
  if (current.photo && values.photo !== current.photo) await deleteHomepageImage(current.photo);
  await logActivity(admin.id, 'director.update', values.name);
  refresh();
  return { ok: true, message: 'Director section saved.' };
}

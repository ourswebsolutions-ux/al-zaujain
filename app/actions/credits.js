'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser, requireAdmin } from '@/lib/auth.js';
import { adjustCredits, CreditError, revokeUnlock, unlockProfile } from '@/lib/credits.js';
import { getDb } from '@/lib/db.js';
import { saveFees } from '@/lib/fees.js';
import { idFromCode } from '@/lib/format.js';
import { logActivity } from '@/lib/security.js';
import { saveSettings } from '@/lib/settings.js';

const text = (form, key) => String(form.get(key) ?? '').trim();
const refresh = () => revalidatePath('/', 'layout');

// ---- Member -------------------------------------------------------------------------------

// The "Unlock profile" button. The server decides everything: membership, cost, balance, once only.
export async function unlockProfileAction(_previous, formData) {
  const code = text(formData, 'code');
  const user = await currentUser();
  if (!user) redirect(`/login?next=/profile/${code}`);
  try {
    const result = await unlockProfile(user, idFromCode(code));
    refresh();
    return { ok: true, message: result.charged ? 'Profile unlocked. {charged} used, {balance} credits left.' : 'This profile is already unlocked for you.', charged: result.charged, balance: result.balance };
  } catch (error) {
    if (error instanceof CreditError) return { ok: false, message: error.message, insufficient: error.code === 'insufficient' };
    throw error;
  }
}

// ---- Administrator --------------------------------------------------------------------------

export async function savePackage(_previous, form) {
  const admin = await requireAdmin();
  const id = Number(form.get('id')) || null;
  const credits = Math.trunc(Number(text(form, 'credits')));
  const price = Number(text(form, 'price').replace(/,/g, ''));
  const values = {
    name: text(form, 'name').slice(0, 100),
    credits,
    price: Number.isFinite(price) ? price.toFixed(2) : '0',
    description: text(form, 'description').slice(0, 500) || null,
    sort: Math.max(0, Math.min(999, Math.trunc(Number(text(form, 'sort')) || 100))),
    active: !!form.get('active'),
    featured: !!form.get('featured'),
  };
  if (values.name.length < 2) return { ok: false, message: 'Please enter a package name.' };
  if (!(credits >= 1 && credits <= 10000)) return { ok: false, message: 'Profile credits must be a whole number from 1 to 10,000.' };
  if (!(price >= 0 && price <= 100000000)) return { ok: false, message: 'Please enter the price in PKR.' };
  const db = getDb();
  if (id) await db.creditPackage.update({ where: { id }, data: values });
  else await db.creditPackage.create({ data: values });
  await logActivity(admin.id, id ? 'credit_package_updated' : 'credit_package_created', values.name, `${credits} credits, Rs ${values.price}`);
  refresh();
  return { ok: true, message: id ? 'Package saved.' : 'Package created.' };
}

export async function togglePackage(form) {
  const admin = await requireAdmin();
  const db = getDb();
  const id = Number(form.get('id'));
  const field = form.get('field') === 'featured' ? 'featured' : 'active';
  const row = await db.creditPackage.findUnique({ where: { id } });
  if (!row) return;
  await db.creditPackage.update({ where: { id }, data: { [field]: !row[field] } });
  await logActivity(admin.id, 'credit_package_updated', row.name, `${field}: ${!row[field]}`);
  refresh();
}

// A package that was ever bought is kept for the records; it can be switched off instead.
export async function deletePackage(form) {
  const admin = await requireAdmin();
  const db = getDb();
  const id = Number(form.get('id'));
  const row = await db.creditPackage.findUnique({ where: { id }, include: { _count: { select: { payments: true } } } });
  if (!row) return;
  if (row._count.payments > 0) await db.creditPackage.update({ where: { id }, data: { active: false } });
  else await db.creditPackage.delete({ where: { id } });
  await logActivity(admin.id, row._count.payments > 0 ? 'credit_package_retired' : 'credit_package_deleted', row.name);
  refresh();
}

export async function saveUnlockCost(_previous, form) {
  const admin = await requireAdmin();
  const cost = Math.trunc(Number(text(form, 'cost')));
  if (!(cost >= 1 && cost <= 100)) return { ok: false, message: 'Credits per unlock must be from 1 to 100.' };
  await saveSettings({ unlock_credit_cost: String(cost) });
  await logActivity(admin.id, 'unlock_cost_changed', null, String(cost));
  refresh();
  return { ok: true, message: 'Saved. Unlocking a Premium profile now costs {cost} of the member\'s credits.', cost };
}

export async function adjustCreditsAction(_previous, form) {
  const admin = await requireAdmin();
  const userId = Number(form.get('user_id'));
  const sign = form.get('direction') === 'remove' ? -1 : 1;
  try {
    const row = await adjustCredits(userId, sign * Math.abs(Math.trunc(Number(text(form, 'amount')))), text(form, 'reason'), admin.id);
    refresh();
    return { ok: true, message: 'Done. The member now has {balance} credits.', balance: row.balance_after };
  } catch (error) {
    if (error instanceof CreditError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function revokeUnlockAction(form) {
  const admin = await requireAdmin();
  await revokeUnlock(Number(form.get('id')), form.get('refund') === '1', admin.id);
  refresh();
}

export async function saveFeesAction(_previous, form) {
  const admin = await requireAdmin();
  const table = (prefix) => Array.from({ length: 12 }, (_, index) => ({ category: text(form, `${prefix}_category_${index}`), fee: text(form, `${prefix}_fee_${index}`) }));
  await saveFees({
    company: text(form, 'company'), registered: text(form, 'registered'), city: text(form, 'city'), ntn: text(form, 'ntn'), ceo: text(form, 'ceo'),
    registration: table('registration'), finalization: table('finalization'),
    countries: text(form, 'countries'), whatsapp: text(form, 'whatsapp'), email: text(form, 'email'),
  });
  await logActivity(admin.id, 'consultancy_fees_saved');
  refresh();
  return { ok: true, message: 'Fee structure saved. It is now shown on the Fees page.' };
}

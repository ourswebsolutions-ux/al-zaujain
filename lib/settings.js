import { getDb } from './db.js';

export async function getSettings() {
  const rows = await getDb().setting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']));
}

export const getSetting = async (key) => (await getDb().setting.findUnique({ where: { key } }))?.value ?? null;

export async function saveSettings(values) {
  const db = getDb();
  await db.$transaction(Object.entries(values).map(([key, value]) => {
    const text = value == null ? '' : String(value);
    return db.setting.upsert({ where: { key }, create: { key, value: text }, update: { value: text } });
  }));
}

import { getDb } from './db.js';

export const publicConsultants = () => getDb().consultant.findMany({ where: { is_public: true }, orderBy: [{ experience_years: 'desc' }, { display_name: 'asc' }] });
export const consultantBySlug = (slug) => getDb().consultant.findFirst({ where: { slug, is_public: true } });

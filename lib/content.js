import { getDb } from './db.js';

export const activeFaqs = () => getDb().faq.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] });

export const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029VaddRahADTOD4MXm3T25';

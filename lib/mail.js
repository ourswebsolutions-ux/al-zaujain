import nodemailer from 'nodemailer';
import { getDb } from './db.js';
import { runMatchEmails } from './matching.js';
import { notify } from './notifications.js';
import { decryptText, signValue } from './security.js';
import { getSettings } from './settings.js';

export const siteUrl = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Admin settings win over environment variables.
export async function smtpConfig() {
  const settings = await getSettings();
  let password = process.env.SMTP_PASS || '';
  if (settings.smtp_pass_enc) password = decryptText(settings.smtp_pass_enc);
  const host = settings.smtp_host || process.env.SMTP_HOST || '';
  const secureRaw = settings.smtp_secure || process.env.SMTP_SECURE || 'false';
  return {
    host,
    port: Number(settings.smtp_port || process.env.SMTP_PORT || 587),
    secure: secureRaw === 'true' || secureRaw === '1',
    user: settings.smtp_user || process.env.SMTP_USER || '',
    password,
    from: settings.smtp_from || process.env.SMTP_FROM || '',
  };
}

export async function smtpReady() {
  const config = await smtpConfig();
  return !!(config.host && config.from);
}

function transport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });
}

const escapeHtml = (text = '') => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fill = (text, vars, transform = (value) => value) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => transform(vars[key] ?? ''));
const toPlainText = (text) => text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');

function toHtml(body) {
  const paragraphs = body.split(/\n{2,}/).map((block) => {
    const button = /^\[([^\]]+)\]\((https?:[^)\s]+)\)$/.exec(block.trim());
    if (button) {
      return `<p style="margin:24px 0"><a href="${button[2]}" style="background:#062b4e;color:#fff;padding:13px 22px;border-radius:9px;font-weight:700;text-decoration:none;display:inline-block">${button[1]}</a></p>`;
    }
    const line = block.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" style="color:#976c20">$1</a>').replace(/(^|\s)(https?:\/\/\S+)/g, '$1<a href="$2" style="color:#976c20">$2</a>');
    return `<p style="margin:0 0 16px;line-height:1.65">${line.replace(/\n/g, '<br>')}</p>`;
  });
  return `<!doctype html><html><body style="margin:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;color:#092a49">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #ddd1b8;border-radius:14px;overflow:hidden">
<tr><td style="background:#062b4e;padding:20px 26px;text-align:center"><img src="${siteUrl()}/images/icon.png" alt="" width="56" height="56" style="border-radius:50%;background:#fff"><div style="color:#fff;font-weight:700;letter-spacing:1px;margin-top:8px">AL ZAUJAIN</div><div style="color:#f4d889;font-size:11px">International Marriage Consultancy</div></td></tr>
<tr><td style="padding:28px 26px;font-size:14px">${paragraphs.join('')}</td></tr>
<tr><td style="background:#fcfbf8;border-top:1px solid #eee6d8;padding:14px 26px;font-size:11px;color:#66717d;text-align:center">Building relationships, building futures.</td></tr>
</table></td></tr></table></body></html>`;
}

const logEmail = (template, recipient, subject, status, error = null) => getDb().emailLog.create({ data: { template, recipient, subject: subject.slice(0, 255), status, error } });

// Returns 'sent', 'skipped' or 'failed'. Never throws: an email problem must not break a request.
export async function sendTemplate(key, to, vars = {}) {
  try {
    const template = await getDb().emailTemplate.findUnique({ where: { key } });
    if (!template) throw new Error(`Unknown email template: ${key}`);
    const subject = fill(template.subject, vars).replace(/[\r\n]+/g, ' ');
    if (!template.enabled) return 'skipped';
    // Sample records use the reserved .example domain and must never reach a mail server.
    if (to.endsWith('.example')) return 'skipped';
    const config = await smtpConfig();
    if (!config.host || !config.from) {
      await logEmail(key, to, subject, 'skipped', 'SMTP is not configured');
      return 'skipped';
    }
    const body = fill(template.body, vars);
    const safeBody = fill(template.body, vars, escapeHtml);
    await transport(config).sendMail({ from: config.from, to, subject, text: toPlainText(body), html: toHtml(safeBody) });
    await logEmail(key, to, subject, 'sent');
    return 'sent';
  } catch (error) {
    console.error(`Email "${key}" failed:`, error.message);
    await logEmail(key, to, key, 'failed', error.message?.slice(0, 300)).catch(() => {});
    return 'failed';
  }
}

export async function testSmtp(to) {
  const config = await smtpConfig();
  if (!config.host || !config.from) throw new Error('Enter an SMTP host and a From address first.');
  const mailer = transport(config);
  await mailer.verify();
  await mailer.sendMail({ from: config.from, to, subject: 'Al Zaujain SMTP test', text: 'Your SMTP settings are working.' });
}

export const unsubscribeUrl = (userId) => `${siteUrl()}/unsubscribe?u=${userId}&t=${signValue(`unsubscribe:${userId}`)}`;

export async function sendMatchEmails(options = {}) {
  if (!(await smtpReady())) return { checked: 0, emailed: 0, matches: 0, failed: 0, skipped: 'SMTP is not configured, so no matches were marked as sent.' };
  return runMatchEmails({
    ...options,
    baseUrl: siteUrl(),
    send: async (user, data) => {
      const result = await sendTemplate('match_digest', user.email, {
        name: user.name,
        count: data.count,
        matches: data.matches,
        matches_url: `${siteUrl()}/dashboard/matches`,
        unsubscribe_url: unsubscribeUrl(user.id),
      });
      if (result === 'sent') await notify(user.id, { type: 'match', title: `${data.count} new recommended ${data.count === 1 ? 'match' : 'matches'}`, body: 'New proposals suited to your profile are ready to view.', href: '/dashboard/matches', groupKey: 'matches' });
      return result;
    },
  });
}

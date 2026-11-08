import { sendMatchEmails } from './mail.js';
import { logActivity } from './security.js';

const INTERVAL = 60 * 60 * 1000;

async function tick() {
  try {
    const result = await sendMatchEmails();
    if (result.emailed || result.failed) await logActivity(null, 'match_emails_run', null, JSON.stringify(result));
  } catch (error) {
    console.error('Match email run failed:', error.message);
  }
}

// Each user's daily or weekly schedule is checked inside the run, so an hourly tick is enough.
export function startScheduler() {
  if (globalThis.__azScheduler) return;
  globalThis.__azScheduler = setInterval(tick, INTERVAL);
  globalThis.__azScheduler.unref?.();
}

// Every endpoint of the mobile API, served at /api/mobile/<path>.
import * as account from './account.js';
import * as chat from './chat.js';
import { createRouter } from './core.js';
import * as member from './member.js';
import * as profiles from './profiles.js';
import * as site from './public.js';
import * as staff from './staff.js';

export const handle = createRouter({
  'GET config': site.config,
  'GET i18n': site.i18n,
  'GET home': site.home,
  'GET proposals': site.proposals,
  'GET profiles/:code': site.profile,
  'GET consultants': site.consultants,
  'GET consultants/:slug': site.consultant,
  'POST enquiry': site.enquiry,
  'POST form/validate': site.validateFormStep,

  'POST staff/web-link': staff.webLink,
  'GET admin/summary': staff.adminSummary,

  'POST auth/login': account.login,
  'POST auth/register': account.register,
  'POST auth/logout': account.logout,
  'POST auth/forgot': account.forgot,
  'POST auth/verify-email': account.verifyEmail,
  'POST auth/resend-code': account.resendCode,
  'GET me': account.me,
  'POST me/details': account.saveDetails,
  'POST me/password': account.changePassword,
  'POST me/notifications': account.saveNotifications,

  'GET dashboard': member.dashboard,
  'GET my/profiles': member.myProfiles,
  'GET my/profiles/:code': member.myProfile,
  'GET matches': member.matches,
  'GET saved': member.saved,
  'POST saved': member.setSaved,
  'GET views': member.views,
  'GET notifications': member.notifications,
  'POST notifications/read': member.readNotifications,
  'GET preferences': member.preferences,
  'POST preferences': member.savePreferences,
  'GET payments': member.payments,
  'POST payments': member.submitPaymentRequest,
  'GET credits': member.credits,
  'POST profiles/:code/unlock': member.unlock,

  'POST profiles': profiles.submit,
  'POST profiles/:code': profiles.edit,
  'DELETE profiles/:code': profiles.remove,
  'GET manage/:token': profiles.manage,
  'POST manage/:token/claim': profiles.claim,

  'GET conversations': chat.conversations,
  'POST chat/start': chat.start,
  'GET chat/:id': chat.thread,
  'POST chat/:id': chat.send,
  'POST chat/:id/block': chat.block,
});

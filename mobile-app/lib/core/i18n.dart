/// English text is the key, exactly as on the website (lib/i18n/core.js). The Urdu dictionary is
/// downloaded from the website, so both always use the same wording. A few app-only phrases live here.
class Translator {
  Translator({Map<String, String>? ur, List<List<String>>? patterns}) : _ur = {..._appUrdu, ...?ur}, _patterns = (patterns ?? []).map((item) => (RegExp(item[0]), item[1])).toList();

  final Map<String, String> _ur;
  final List<(RegExp, String)> _patterns;
  String lang = 'en';

  bool get isUrdu => lang == 'ur';

  /// Title Case for English, as on the website: every word starts with a capital ("Candidate Information").
  /// Emails, links and words that already have capitals inside (WhatsApp, AZ-61) are left as they are.
  static String titled(String text) => text.replaceAllMapped(RegExp(r"[^\s]+"), (match) {
        final word = match[0]!;
        if (word.contains('@') || word.contains('://') || word.startsWith('www.')) return word;
        final first = word.runes.first;
        final letter = String.fromCharCode(first);
        if (letter.toUpperCase() == letter) return word;
        return letter.toUpperCase() + word.substring(letter.length);
      });

  static String fill(String text, Map<String, Object?>? vars) {
    if (vars == null) return text;
    return text.replaceAllMapped(RegExp(r'\{(\w+)\}'), (match) => vars.containsKey(match[1]) ? '${vars[match[1]] ?? ''}' : match[0]!);
  }

  String call(String? text, [Map<String, Object?>? vars]) {
    if (text == null || text.isEmpty) return text ?? '';
    if (lang != 'ur') return titled(fill(text, vars));
    final exact = _ur[text];
    if (exact != null) return fill(exact, vars);
    for (final (pattern, template) in _patterns) {
      final match = pattern.firstMatch(text);
      if (match != null) {
        return template.replaceAllMapped(RegExp(r'\$(\d)'), (m) {
          final part = match.group(int.parse(m[1]!)) ?? '';
          return _ur[part] ?? part;
        });
      }
    }
    return fill(text, vars);
  }
}

/// Wording used only by the app. Everything else comes from the website's dictionary.
const _appUrdu = <String, String>{
  'Website address': 'ویب سائٹ کا پتہ',
  'Connect': 'منسلک کریں',
  'Connecting…': 'منسلک ہو رہا ہے…',
  'Welcome to Al Zaujain': 'الزوجین میں خوش آمدید',
  'Enter the address of the Al Zaujain website to connect this app.': 'اس ایپ کو منسلک کرنے کے لیے الزوجین ویب سائٹ کا پتہ درج کریں۔',
  'You can change this later in Settings.': 'آپ اسے بعد میں ترتیبات میں تبدیل کر سکتے ہیں۔',
  'This address does not look like an Al Zaujain website.': 'یہ پتہ الزوجین ویب سائٹ کا نہیں لگتا۔',
  'We could not reach the server. Please check your connection and try again.': 'ہم سرور تک نہیں پہنچ سکے۔ براہ کرم اپنا کنکشن چیک کر کے دوبارہ کوشش کریں۔',
  'Try again': 'دوبارہ کوشش کریں',
  'Home': 'ہوم',
  'Proposals': 'رشتے',
  'Messages': 'پیغامات',
  'Saved': 'محفوظ',
  'Account': 'اکاؤنٹ',
  'Settings': 'ترتیبات',
  'Language': 'زبان',
  'Change website': 'ویب سائٹ تبدیل کریں',
  'Use the default website': 'ڈیفالٹ ویب سائٹ استعمال کریں',
  'Open navigation': 'مینو کھولیں',
  'Marriage Bureau Multan Pakistan': 'میرج بیورو ملتان پاکستان',
  'Connected website': 'منسلک ویب سائٹ',
  'Sign out': 'سائن آؤٹ',
  'Filters': 'فلٹرز',
  'Clear all': 'سب صاف کریں',
  'Show results': 'نتائج دکھائیں',
  'Search': 'تلاش',
  'Any': 'کوئی بھی',
  'Done': 'مکمل',
  'Share': 'شیئر کریں',
  'Share biodata': 'بائیو ڈیٹا شیئر کریں',
  'Share image': 'تصویر شیئر کریں',
  'Share PDF': 'پی ڈی ایف شیئر کریں',
  'Biodata copied.': 'بائیو ڈیٹا کاپی ہو گیا۔',
  'Open the private link': 'نجی لنک کھولیں',
  'Paste the private link from your email': 'اپنی ای میل سے نجی لنک پیسٹ کریں',
  'Profiles submitted from this phone': 'اس فون سے جمع کرائی گئی پروفائلز',
  'Take a photo': 'تصویر کھینچیں',
  'Choose from gallery': 'گیلری سے منتخب کریں',
  'Help': 'مدد',
  'More': 'مزید',
  'Version {version}': 'ورژن {version}',
  'Changing the website signs you out of this app.': 'ویب سائٹ تبدیل کرنے سے آپ اس ایپ سے سائن آؤٹ ہو جائیں گے۔',
  'Staff panels are available on the website.': 'عملے کے پینل ویب سائٹ پر دستیاب ہیں۔',
  'Open the website': 'ویب سائٹ کھولیں',
  'Loading…': 'لوڈ ہو رہا ہے…',
  'Use this address': 'یہ پتہ استعمال کریں',
  'This address uses http, so data is not encrypted. Use https on a live website.': 'یہ پتہ http استعمال کرتا ہے، اس لیے ڈیٹا محفوظ نہیں۔ لائیو ویب سائٹ پر https استعمال کریں۔',
  'Something went wrong. Please try again.': 'کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
  'My account': 'میرا اکاؤنٹ',
  'Signing in…': 'سائن اِن ہو رہا ہے…',
  'Reset your password': 'اپنا پاس ورڈ دوبارہ ترتیب دیں',
  'Enter your email and we will send you a link to choose a new password.': 'اپنا ای میل درج کریں، ہم آپ کو نیا پاس ورڈ منتخب کرنے کا لنک بھیجیں گے۔',
  'The link opens on the website, where you choose the new password. Then sign in here with it.': 'لنک ویب سائٹ پر کھلے گا جہاں آپ نیا پاس ورڈ منتخب کریں گے۔ پھر اسی پاس ورڈ سے یہاں سائن اِن کریں۔',
  'INTERNATIONAL RISHTA SEARCH': 'بین الاقوامی رشتہ تلاش',
  'AL ZAUJAIN MARRIAGE BUREAU': 'الزوجین میرج بیورو',
  'This private link is not valid. Please check it and try again.': 'یہ نجی لنک درست نہیں۔ براہ کرم چیک کر کے دوبارہ کوشش کریں۔',
  'Your conversations will appear here': 'آپ کی گفتگو یہاں نظر آئے گی',
  'No conversations yet': 'ابھی کوئی گفتگو نہیں',
  'Open a proposal and tap “Chat now” to send a message.': 'کوئی رشتہ کھولیں اور پیغام بھیجنے کے لیے “ابھی بات کریں” دبائیں۔',
  '{percent}% complete': '{percent}% مکمل',
  'The profile has been deleted.': 'پروفائل حذف کر دی گئی ہے۔',
  'Payment received. Our team will review it shortly.': 'ادائیگی موصول ہو گئی۔ ہماری ٹیم جلد اس کا جائزہ لے گی۔',
  'Not specified': 'درج نہیں',
  'Select': 'منتخب کریں',
  'Type or choose': 'لکھیں یا منتخب کریں',
  'Keep my photo private. It will only be shared through the bureau.': 'میری تصویر نجی رکھیں۔ یہ صرف بیورو کے ذریعے شیئر کی جائے گی۔',
  'Upload your CNIC so our team can verify this profile. It is encrypted, never shown publicly, and only administrators can open it.': 'اپنا شناختی کارڈ اپ لوڈ کریں تاکہ ہماری ٹیم اس پروفائل کی تصدیق کر سکے۔ یہ محفوظ طریقے سے رکھا جاتا ہے، کبھی عوامی طور پر نہیں دکھایا جاتا، اور صرف منتظمین اسے کھول سکتے ہیں۔',
  '{score}% match with your profile': 'آپ کی پروفائل سے {score}% مطابقت',
  'SUGGESTED FOR THIS PROFILE': 'اس پروفائل کے لیے تجویز کردہ',
  'Save the proposals you like': 'پسندیدہ رشتے محفوظ کریں',
  'Removed from your saved profiles.': 'محفوظ پروفائلز سے ہٹا دیا گیا۔',
  'Saved to your shortlist.': 'آپ کی فہرست میں محفوظ ہو گیا۔',
  'Remove from saved': 'محفوظ سے ہٹائیں',
  'This link could not be opened.': 'یہ لنک نہیں کھل سکا۔',
  'Jan': 'جنوری',
  'Feb': 'فروری',
  'Mar': 'مارچ',
  'Apr': 'اپریل',
  'May': 'مئی',
  'Jun': 'جون',
  'Jul': 'جولائی',
  'Aug': 'اگست',
  'Sep': 'ستمبر',
  'Oct': 'اکتوبر',
  'Nov': 'نومبر',
  'Dec': 'دسمبر',
  'Complete profile copied to your clipboard.': 'مکمل پروفائل کاپی ہو گئی۔',
  'The image could not be created. Please try again.': 'تصویر نہیں بن سکی۔ براہ کرم دوبارہ کوشش کریں۔',
  'The PDF could not be created. Please try again.': 'پی ڈی ایف نہیں بن سکی۔ براہ کرم دوبارہ کوشش کریں۔',
  'Image': 'تصویر',
  'PDF': 'پی ڈی ایف',
  'Never shown publicly': 'کبھی عوامی طور پر نہیں دکھایا جاتا',
  'Please sign in.': 'براہ کرم سائن اِن کریں۔',
  'Your session has ended. Please sign in again.': 'آپ کا سیشن ختم ہو گیا۔ براہ کرم دوبارہ سائن اِن کریں۔',
  'Saved.': 'محفوظ ہو گیا۔',
  'The profile has been added to your account.': 'پروفائل آپ کے اکاؤنٹ میں شامل کر دی گئی۔',
  'This profile is already linked to an account.': 'یہ پروفائل پہلے سے کسی اکاؤنٹ سے منسلک ہے۔',
  'Please sign in with a member account to save proposals.': 'رشتے محفوظ کرنے کے لیے ممبر اکاؤنٹ سے سائن اِن کریں۔',
  'This proposal cannot be saved.': 'یہ رشتہ محفوظ نہیں کیا جا سکتا۔',
  'Your profile has been received. Our team will review it shortly.': 'آپ کی پروفائل موصول ہو گئی۔ ہماری ٹیم جلد اس کا جائزہ لے گی۔',
  'This list of proposals was not found.': 'رشتوں کی یہ فہرست نہیں ملی۔',
  'This proposal is not available.': 'یہ رشتہ دستیاب نہیں۔',
  'This consultant was not found.': 'یہ کنسلٹنٹ نہیں ملا۔',
  'You cannot delete this profile.': 'آپ یہ پروفائل حذف نہیں کر سکتے۔',
  'Copy': 'کاپی',
  'Copied': 'کاپی ہو گیا',
  'Your profile': 'آپ کی پروفائل',
  'Add photos': 'تصاویر شامل کریں',
  'Updates for this phone come from the app store.': 'اس فون کے لیے اپ ڈیٹس ایپ اسٹور سے آتی ہیں۔',
  'You have the latest version of the app.': 'آپ کے پاس ایپ کا تازہ ترین ورژن موجود ہے۔',
  'A new version of the app is ready': 'ایپ کا نیا ورژن تیار ہے',
  'Version {version} brings the latest improvements. It takes a minute and keeps you signed in.': 'ورژن {version} میں تازہ ترین بہتریاں شامل ہیں۔ اس میں ایک منٹ لگتا ہے اور آپ سائن اِن رہیں گے۔',
  'Later': 'بعد میں',
  'Update now': 'ابھی اپ ڈیٹ کریں',
  'Downloading the update…': 'اپ ڈیٹ ڈاؤن لوڈ ہو رہی ہے…',
  'Opening the installer…': 'انسٹالر کھل رہا ہے…',
  'The download was damaged. Please try again.': 'ڈاؤن لوڈ خراب ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔',
  'The update could not be installed. Please try again.': 'اپ ڈیٹ انسٹال نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔',
  'App version': 'ایپ کا ورژن',
  'Check for updates': 'اپ ڈیٹ چیک کریں',
  'Create a free account to continue': 'جاری رکھنے کے لیے مفت اکاؤنٹ بنائیں',
  'Create a free account to view this proposal': 'یہ رشتہ دیکھنے کے لیے مفت اکاؤنٹ بنائیں',
  'Create a free account to submit a profile': 'پروفائل جمع کرانے کے لیے مفت اکاؤنٹ بنائیں',
  'Browsing is open to everyone. Full proposals, submitting a profile, saving and chat are for registered members. It is free and takes a minute.': 'رشتے دیکھنا سب کے لیے کھلا ہے۔ مکمل رشتے، پروفائل جمع کرانا، محفوظ کرنا اور بات چیت رجسٹرڈ ممبرز کے لیے ہیں۔ یہ مفت ہے اور ایک منٹ لگتا ہے۔',
  // Home design, admin and consultant panels in the app.
  'Admin panel': 'ایڈمن پینل',
  'Consultant panel': 'کنسلٹنٹ پینل',
  'Refresh': 'تازہ کریں',
  'Close': 'بند کریں',
  'Could not open the panel': 'پینل نہیں کھل سکا',
  'This page could not be opened. Check your connection and try again.': 'یہ صفحہ نہیں کھل سکا۔ انٹرنیٹ کنکشن دیکھیں اور دوبارہ کوشش کریں۔',
  '{profiles} live profiles · {members} members': '{profiles} شائع شدہ پروفائلز · {members} ممبرز',
  'Profiles to review': 'جائزے کے لیے پروفائلز',
  'Payments to check': 'جانچ کے لیے ادائیگیاں',
  'Open the full admin panel': 'مکمل ایڈمن پینل کھولیں',
  'Open the consultant panel': 'کنسلٹنٹ پینل کھولیں',
  'Your assigned profiles, proposals and account, exactly as on the website.': 'آپ کو سونپی گئی پروفائلز، رشتے اور اکاؤنٹ، بالکل ویب سائٹ کی طرح۔',
  'Matches are for members': 'میچز ممبرز کے لیے ہیں',
  'Team accounts can open every profile from the admin panel.': 'ٹیم اکاؤنٹس ایڈمن پینل سے ہر پروفائل کھول سکتے ہیں۔',
  'Your recommended matches': 'آپ کے لیے تجویز کردہ رشتے',
  'Sign in and add your profile to see proposals ranked for you on both sides.': 'سائن اِن کریں اور اپنی پروفائل شامل کریں تاکہ دونوں طرف کی مطابقت کے مطابق رشتے دیکھ سکیں۔',
  'Menu': 'مینو',
  'Pakistani Marriage Bureau': 'پاکستانی میرج بیورو',
  'Meaningful\nConnections\nfor a Blessed Tomorrow': 'بامعنی رشتے\nایک بابرکت\nکل کے لیے',
  'Choose a city': 'شہر منتخب کریں',
  'By City': 'شہر کے لحاظ سے',
  'Values': 'اقدار',
  'Featured Profiles': 'نمایاں پروفائلز',
  'View All': 'سب دیکھیں',
  'Create a free account to save proposals': 'رشتے محفوظ کرنے کے لیے مفت اکاؤنٹ بنائیں',
  'Copy profile ID {code}': 'پروفائل آئی ڈی {code} کاپی کریں',
  'Profile ID copied.': 'پروفائل آئی ڈی کاپی ہو گئی۔',
  'Only members can save proposals.': 'صرف ممبرز رشتے محفوظ کر سکتے ہیں۔',
  '{count} photos': '{count} تصاویر',
  'Back to proposals': 'رشتوں پر واپس',
};

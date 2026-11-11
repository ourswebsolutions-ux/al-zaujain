import Link from 'next/link';
import { FaBuildingColumns } from 'react-icons/fa6';
import { Ornament } from '@/components/home/HomeUi';
import { packageColor, RishtaPackageCard } from '@/components/packages/RishtaPackageCard';
import { activePackages, packageView } from '@/lib/credits.js';
import { getDb } from '@/lib/db.js';
import { getFees } from '@/lib/fees.js';
import { whatsappNumber } from '@/lib/format.js';
import { getT } from '@/lib/i18n/server.js';
import { getSettings } from '@/lib/settings.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rishta Packages', description: 'Al Zaujain rishta packages: Local and International profile connect packages, Boost my Proposal and Personalized Matchmaking, with clear prices.' };

// "Rs. 25,000" → 25000
const amount = (fee) => Number((/\d[\d,]*(\.\d+)?/.exec(String(fee ?? ''))?.[0] ?? '0').replace(/,/g, '')) || 0;
const rupees = (value) => `Rs. ${Number(value).toLocaleString('en-PK')}`;
const available = (yes) => (yes ? 'Available' : 'Not Available');
const availableUr = (yes) => (yes ? 'دستیاب ہے' : 'دستیاب نہیں');

const container = 'mx-auto w-full max-w-[1320px] px-3';
const paragraph = 'text-[18px] leading-[1.6] text-[#333] max-sm:text-[16px]';
const urduParagraph = 'font-urdu text-[18px] leading-[2.2] text-[#9b712b] max-sm:text-[16px]';
const box = 'rounded-[6px] border border-[#00000020] bg-white';

// A section heading as on the reference: the title, its Urdu line beneath, then the divider.
function Heading({ as: Tag = 'h2', title, urdu, quotes = false, className = '' }) {
  return (
    <div className={`text-center ${className}`}>
      <Tag className={`font-semibold leading-snug text-[#1a1a1a] ${Tag === 'h1' ? 'text-[40px] max-sm:text-[30px]' : 'text-[32px] max-sm:text-[24px]'}`}>
        {quotes ? <>❝&nbsp;{title}&nbsp;❞</> : title}
        {urdu && <span lang="ur" dir="rtl" className="mt-2 block font-urdu text-[30px] font-medium leading-[2] max-sm:text-[20px]">{quotes ? <>❞ {urdu} ❝</> : urdu}</span>}
      </Tag>
      <Ornament className="mt-3" />
    </div>
  );
}

// The packages page, built like the reference page from top to bottom: the introduction, the two kinds of
// service, Local and International packages, the comparison table, Boost my Proposal, Personalized
// Matchmaking and the payment accounts. Every package and price comes from Admin → Rishta Packages.
export default async function PackagesPage() {
  const t = await getT();
  const [fees, rows, methods, settings] = await Promise.all([
    getFees(),
    activePackages(),
    getDb().paymentMethod.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] }),
    getSettings(),
  ]);
  const packages = rows.map(packageView).map((pack, index) => ({ ...pack, color: packageColor(pack, index) }));
  const local = packages.filter((pack) => pack.kind === 'credits' && pack.scope === 'local');
  const foreign = packages.filter((pack) => pack.kind === 'credits' && pack.scope === 'foreign');
  const boosts = packages.filter((pack) => pack.kind === 'boost');
  const registration = fees.registration.map((row) => amount(row.fee)).filter(Boolean);
  const lowest = registration.length ? Math.min(...registration) : 0;
  const whatsapp = settings.site_whatsapp || settings.site_phone || '';
  const whatsappDigits = whatsappNumber(whatsapp);
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Assalam o Alaikum Al Zaujain, I need more information about the packages.')}` : null;
  const WhatsApp = () => (whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener" className="font-medium text-[#1a1a1a]" dir="ltr">{whatsapp}</a> : null);

  const connectRows = (pack) => [
    { label: 'Profile Connect', value: String(pack.credits), ur: `پروفائل کنیکٹ: ${pack.credits}` },
    { label: 'Duration', value: 'Unlimited', ur: 'مدت: لا محدود' },
    { label: 'Audio Call', value: available(pack.audioCall), ur: `آڈیو کال: ${availableUr(pack.audioCall)}` },
    { label: 'Video Call', value: available(pack.videoCall), ur: `ویڈیو کال: ${availableUr(pack.videoCall)}` },
  ];
  const buy = (pack) => `/dashboard/credits/buy?package=${pack.id}`;
  const grid = 'grid grid-cols-3 gap-x-6 max-[991px]:grid-cols-2 max-sm:grid-cols-1';

  return (
    <main className="bg-[#fbf7f1] pb-16 font-sans text-[#333]">
      <div className={container}>
        {/* Introduction */}
        <section className="mb-5 pt-10 text-center">
          <span className="mt-4 block text-[17px] uppercase tracking-[3px] text-[#666] max-sm:text-[13px]">{t('Welcome to {company}', { company: 'Al Zaujain Marriage Bureau' })}</span>
          <h1 className="mx-auto max-w-[900px] bg-[linear-gradient(135deg,#062b4e_30%,#d4af37_100%)] bg-clip-text text-[50px] font-bold capitalize leading-[1.2] text-transparent [-webkit-text-fill-color:transparent] max-sm:text-[34px]">
            {t('Rishta Packages')}
            <span lang="ur" dir="rtl" className="block font-urdu text-[46px] font-medium leading-[1.9] max-sm:text-[32px]">رشتہ پیکجز</span>
          </h1>
          <div aria-hidden="true" className="mt-5 flex items-center justify-center">
            <span className="h-px w-[50px] bg-[#d4af37]" /><span className="mx-2.5 size-2 rounded-full bg-navy" /><span className="h-px w-[50px] bg-[#d4af37]" />
          </div>
        </section>
        <div className="mx-auto max-w-[880px]">
          <p className={`${paragraph} mb-2 text-[19px]!`}>{t('Al Zaujain Marriage Bureau offers mainly two types of rishta services: Web & App Based Packages and Personalized Matchmaking.')}</p>
          <p className={`${paragraph} mb-2 text-[19px]!`}>{t('In Web & App Based Packages you can use our matrimonial website and app to find proposals on a self-service basis, i.e. you use our website to find a proposal for yourself directly.')}</p>
          <p className={`${paragraph} mb-3 text-[19px]!`}>{t('In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements.')}</p>
          <p lang="ur" dir="rtl" className={`${urduParagraph} m-2`}>الزوجین میرج بیورو بنیادی طور پر دو قسم کی رشتہ خدمات فراہم کرتا ہے۔ ویب اور ایپ پر مبنی پیکجز اور ذاتی نوعیت کی میچ میکنگ۔</p>
          <p lang="ur" dir="rtl" className={`${urduParagraph} m-3`}>ویب اور ایپ پر مبنی پیکجز میں آپ ہماری ویب سائٹ اور ایپ کو سیلف سروس کی بنیاد پر رشتہ تلاش کرنے کے لیے استعمال کر سکتے ہیں، یعنی رشتہ تلاش کرنے کے لیے آپ براہ راست ہماری ویب سائٹ کا استعمال کریں گے۔</p>
          <p lang="ur" dir="rtl" className={`${urduParagraph} m-3`}>ذاتی نوعیت کی میچ میکنگ میں ہمارے رشتہ کنسلٹنٹ آپ کو آپ کی ضرورت کے مطابق رشتے دکھائیں گے۔</p>
        </div>

        {/* Which type of service */}
        <div className={`${box} mt-6 px-4 py-6`}>
          <Heading title={t('Which Type of Rishta Service Do You Need?')} urdu="آپ کو کس قسم کی رشتہ سروس کی ضرورت ہے؟" />
          <div className="mt-6 flex flex-wrap justify-center">
            {[['#allPackageList', 'Web & App Based Packages', 'ویب اور ایپ پر مبنی پیکیجز'], ['#personalizedMatching', 'Personalized Matchmaking', 'ذاتی نوعیت کی میچ میکنگ']].map(([href, label, urdu]) => (
              <a key={href} href={href} className="az-run-button m-3 inline-block bg-[linear-gradient(-30deg,#03223f_50%,#062b4e_50%)] px-10 py-5 text-center text-[14px] uppercase tracking-[2.5px] text-[#f4dfb4] no-underline shadow-[0_20px_50px_#00000080] transition-colors hover:text-white max-sm:mx-0 max-sm:w-full max-sm:px-5 max-sm:py-4">
                <i /><i /><i /><i />
                {t(label)}<br /><span lang="ur" dir="rtl" className="font-urdu normal-case tracking-normal leading-[2.2]">{urdu}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Local packages */}
        <div id="allPackageList" className="scroll-mt-24">
          {local.length > 0 && (
            <section className="pt-10">
              <Heading quotes title={t('Local Rishta Packages (Pakistan)')} urdu="لوکل رشتہ پیکجز (پاکستان)" />
              <div className="mx-auto max-w-[1100px]">
                <p className="mb-1 mt-2 text-center text-[1.2rem] font-semibold text-[#9b712b] max-sm:text-[1rem]">{t('With these packages, you can connect with all members in this category. However, access to Foreign (overseas) profiles is excluded. To contact Foreign members, you must purchase the Foreign package.')}</p>
                <p lang="ur" dir="rtl" className="mb-2 mt-1 text-center font-urdu text-[1.2rem] font-semibold leading-[2.2] text-[#9b712b] max-sm:text-[1rem]">ان پیکجز کے ذریعے آپ اس کیٹیگری میں شامل تمام ممبرز سے رابطہ کر سکتے ہیں۔ تاہم، فارن پروفائلز سے رابطہ اس میں شامل نہیں ہے۔ فارن ممبرز سے رابطہ کرنے کے لیے آپ کو فارن پیکج خریدنا ہوگا۔</p>
              </div>
              <div className={grid}>
                {local.map((pack) => (
                  <div key={pack.id} className="pt-12">
                    <RishtaPackageCard t={t} name={pack.name} color={pack.color} discount={pack.discount} was={pack.wasPrice} price={pack.price} rows={connectRows(pack)} href={buy(pack)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* International packages */}
          {foreign.length > 0 && (
            <section className="pt-12">
              <Heading quotes title={t('International Rishta Packages (Foreign)')} urdu="انٹرنیشنل رشتہ پیکجز (بیرونِ ملک)" />
              <div className={`${grid} ${foreign.length === 1 ? 'grid-cols-1! justify-items-center [&>*]:w-full [&>*]:max-w-[440px]' : ''}`}>
                {foreign.map((pack) => (
                  <div key={pack.id} className="pt-12">
                    <RishtaPackageCard t={t} name={pack.name} color={pack.color} discount={pack.discount} was={pack.wasPrice} price={pack.price} rows={connectRows(pack)} href={buy(pack)} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Comparison table */}
        {local.length + foreign.length > 0 && (
          <section className="py-12 max-sm:px-0">
            <div className={`${box} p-5 max-sm:p-3`}>
              <h2 className="text-center text-[32px] font-semibold leading-snug text-[#1a1a1a] max-sm:text-[22px]">
                {t('Web & App Based Packages Comparison')}
                <span lang="ur" dir="rtl" className="block font-urdu text-[24px] font-medium leading-[2] max-sm:text-[18px]">ویب اور ایپ پر مبنی پیکیجز کا موازنہ</span>
              </h2>
              <Ornament className="mb-6 mt-3" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-[15px]">
                  <thead>
                    <tr className="border-b-2 border-[#dee2e6] text-start">
                      {['Packages', 'Profile Connect', 'Duration', 'Audio Call', 'Video Call', 'Before Discount - Rs.', 'After Discount - Rs.'].map((head) => <th key={head} scope="col" className="p-2 text-start font-bold text-[#212529]">{t(head)}</th>)}
                    </tr>
                  </thead>
                  {[[local, 'Local Rishta Packages (Pakistan)'], [foreign, 'International Rishta Package (Foreign)']].filter(([list]) => list.length > 0).map(([list, title]) => (
                    <tbody key={title}>
                      <tr className="bg-[#f6ead2]"><td colSpan={7} className="p-2 text-[1rem] font-semibold text-[#9b712b]">{t(title)}</td></tr>
                      {list.map((pack) => (
                        <tr key={pack.id} className="border-b border-[#dee2e6] transition-colors hover:bg-[#00000008]">
                          <td className="p-2">{t(pack.name)}</td>
                          <td className="p-2">{pack.credits}</td>
                          <td className="p-2">{t('Unlimited')}</td>
                          <td className="p-2">{t(available(pack.audioCall))}</td>
                          <td className="p-2">{t(available(pack.videoCall))}</td>
                          <td className="p-2 text-[#6c757d] line-through" dir="ltr">{pack.wasPrice ? rupees(pack.wasPrice) : '—'}</td>
                          <td className="p-2" dir="ltr">{rupees(pack.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Boost my Proposal */}
        {boosts.length > 0 && (
          <section id="booster" className="scroll-mt-24 pt-4">
            <Heading as="h1" title={t('Boost my Proposal')} />
            <p className="m-0 pt-1 text-center text-[18px] font-semibold text-[#9b712b] max-sm:text-[16px]">{t('To boost your proposal, your profile information must be complete, and your profile image must be visible.')}</p>
            <p lang="ur" dir="rtl" className="m-0 text-center font-urdu text-[18px] font-semibold leading-[2.2] text-[#9b712b] max-sm:text-[16px]">آپ کی پروپوزل کو بوسٹ کرنے کے لیے ضروری ہے کہ آپ کی پروفائل کی معلومات مکمل ہوں اور آپ کی پروفائل تصویر نظر آ رہی ہو۔</p>
            <div className="mx-auto grid max-w-[880px] grid-cols-2 gap-x-6 max-sm:grid-cols-1">
              {boosts.map((pack) => (
                <div key={pack.id} className="pt-12">
                  <RishtaPackageCard
                    t={t}
                    name={pack.name}
                    color={pack.color}
                    discount={pack.discount}
                    was={pack.wasPrice}
                    price={pack.price}
                    href={buy(pack)}
                    rows={[
                      { label: 'Duration', value: `${pack.days} Days`, ur: `مدت: ${pack.days} دن` },
                      { label: 'Proposal Status', value: pack.superBoost ? 'Super Boosted' : 'Boosted', ur: `پروپوزل کی حیثیت: ${pack.superBoost ? 'سپر بوسٹ شدہ' : 'بوسٹ شدہ'}` },
                    ]}
                  >
                    <li className="py-3">
                      <p className="mb-2.5 text-[15px] leading-[1.6] text-[#666]">{pack.description || t('Boosted proposals receive top-tier visibility, appearing at the forefront of search results for maximum exposure.')}</p>
                      <p lang="ur" dir="rtl" className="font-urdu text-[16px] leading-[2.1] text-[#444]">بوسٹڈ پروپوزلز کو زیادہ نمایاں حیثیت ملتی ہے اور زیادہ سے زیادہ نمائش کے لیے یہ تلاش کے نتائج میں سب سے اوپر دکھائے جاتے ہیں۔</p>
                    </li>
                  </RishtaPackageCard>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Personalized Matchmaking */}
        <section id="personalizedMatching" className="mx-auto max-w-[990px] scroll-mt-24 pt-16">
          <Heading title={t('Personalized Matchmaking')} urdu="ذاتی نوعیت کی میچ میکنگ" />
          <div className={`${box} mt-6 p-5 text-center`}>
            <p className={`${paragraph} mb-3 text-start`}>{t('In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements.')}</p>
            <p className={`${paragraph} mb-3 text-start`}>
              {lowest > 0
                ? t('The Personalized Matchmaking fee depends on your case. The registration fee starts from Rs. {fee}, and the finalization fee is paid only after the rishta is finalized.', { fee: lowest.toLocaleString('en-PK') })
                : t('The Personalized Matchmaking fee depends on your case. The finalization fee is paid only after the rishta is finalized.')}
            </p>
            <p className={`${paragraph} mb-3 text-start`}>{t('Please create your profile on the website and send the link of your profile to our consultants to discuss your case.')}</p>
            <p lang="ur" dir="rtl" className={`${urduParagraph} mb-2 text-end`}>ذاتی نوعیت کی میچ میکنگ میں ہمارے رشتہ کنسلٹنٹ آپ کو آپ کی ضرورت کے مطابق رشتے دکھائیں گے۔</p>
            <p lang="ur" dir="rtl" className={`${urduParagraph} mb-2 text-end`}>{lowest > 0 ? `ذاتی نوعیت کی میچ میکنگ کی فیس ہر کیس کے لیے مختلف ہے۔ رجسٹریشن فیس ${lowest.toLocaleString('en-PK')} روپے سے شروع ہوتی ہے اور رشتہ طے ہونے کی فیس صرف رشتہ طے ہونے کے بعد ادا کی جاتی ہے۔` : 'ذاتی نوعیت کی میچ میکنگ کی فیس ہر کیس کے لیے مختلف ہے۔'}</p>
            <p lang="ur" dir="rtl" className={`${urduParagraph} mb-2 text-end`}>براہ کرم ویب سائٹ پر اپنا پروفائل بنائیں اور اپنے کیس کے بارے میں بات کرنے کے لیے اپنے پروفائل کا لنک کنسلٹنٹس کو بھیجیں۔</p>
            <Link href="/submit-profile" className="mt-5 inline-block rounded-full bg-[linear-gradient(180deg,#d5ad6d_0%,#e2ba78_35%,#caaa75_45%,#b38f56_61%,#d5ad6d_100%)] px-10 py-3.5 text-[16px] font-bold text-[#03223f] no-underline shadow-[0_8px_20px_#b38f5659] transition-transform hover:-translate-y-0.5 hover:text-[#03223f]">{t('Register Now')}</Link>
          </div>
        </section>

        {/* Payment options */}
        {methods.length > 0 && (
          <section id="paymentDetailSection" className="pt-16">
            <div className="mx-auto max-w-[880px]">
              <Heading title={t('Payment Options')} urdu="ادائیگی کے طریقے" />
              <p className={`${paragraph} mt-6`}>
                {t('For payment, only use the following bank accounts and always send the payment screenshot on our official WhatsApp:')} <WhatsApp />. {t('We will not be responsible if payment is sent to any other account or to any other person. Make sure to communicate only on the official numbers mentioned on our website. In case of any issue, contact us on WhatsApp:')} <WhatsApp />.
              </p>
              <p lang="ur" dir="rtl" className={`${urduParagraph} mt-3 text-end`}>
                ادائیگی کے لیے صرف درج ذیل بینک اکاؤنٹس استعمال کریں اور ہمیشہ ہمارے آفیشل واٹس ایپ پر ادائیگی کا اسکرین شاٹ بھیجیں۔ اگر ادائیگی کسی دوسرے اکاؤنٹ یا کسی دوسرے شخص کو بھیجی جاتی ہے تو ہم ذمہ دار نہیں ہوں گے۔ صرف ان آفیشل نمبرز پر رابطہ کریں جن کا ذکر ہماری ویب سائٹ پر ہے۔
              </p>
              {whatsappHref && <p className="mt-1 text-end text-[18px] text-[#9b712b]"><WhatsApp /></p>}
            </div>
            <div className="mx-auto mt-8 w-[95%] columns-2 gap-[15px] text-center max-[991px]:w-full max-[991px]:columns-1">
              {methods.map((method) => (
                <figure key={method.id} className="mx-0.5 mb-[15px] inline-block w-full break-inside-avoid rounded-[10px] border-2 border-[#fcfcfc] bg-[#fefefe] p-[15px] pb-0 shadow-[0_5px_10px_#2323234d]">
                  {method.qr_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/media/payments/${method.qr_image}`} alt={t('{name} QR code', { name: method.name })} className="mx-auto mb-[5px] size-[190px] border-b-2 border-navy object-contain pb-1" />
                  ) : (
                    <div aria-hidden="true" className="mx-auto mb-[5px] grid size-[110px] place-items-center border-b-2 border-navy text-[52px] text-navy"><FaBuildingColumns /></div>
                  )}
                  <figcaption className="text-[.9rem] leading-[1.5] text-[#444]">
                    <h3 className="my-2 text-[1.35rem] font-semibold text-[#9b712b]">{method.bank_name || method.name}</h3>
                    <table className="mb-4 w-full border-collapse">
                      <tbody>
                        {[['Account Title', method.account_holder], ['Account Number', method.account_number], ['IBAN No.', method.iban]].filter(([, value]) => value).map(([label, value]) => (
                          <tr key={label} className="border-t border-[#dee2e6] text-start hover:bg-[#00000008]">
                            <td className="p-2">{t(label)}</td>
                            <td className="break-all p-2 font-medium text-[#212529]" dir="ltr">{value}</td>
                          </tr>
                        ))}
                        {method.instructions && <tr className="border-t border-[#dee2e6] text-start"><td colSpan={2} className="whitespace-pre-line p-2">{method.instructions}</td></tr>}
                      </tbody>
                    </table>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

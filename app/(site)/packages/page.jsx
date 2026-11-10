import { FaBuildingColumns, FaCircleInfo } from 'react-icons/fa6';
import { GradientHeading, Label, Ornament } from '@/components/home/HomeUi';
import { Slider } from '@/components/home/Slider';
import { PackageCard } from '@/components/packages/PackageCard';
import { Urdu } from '@/components/ui/Text';
import { activePackages, packageView } from '@/lib/credits.js';
import { getDb } from '@/lib/db.js';
import { getFees } from '@/lib/fees.js';
import { getT } from '@/lib/i18n/server.js';
import { getSettings } from '@/lib/settings.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rishta Packages', description: 'Al Zaujain rishta packages: Local and International profile connect packages, Boost my Proposal and Personalized Matchmaking, with clear prices.' };

// "Rs. 25,000" → 25000
const amount = (fee) => Number((/\d[\d,]*(\.\d+)?/.exec(String(fee ?? ''))?.[0] ?? '0').replace(/,/g, '')) || 0;
const rupees = (value) => `Rs. ${Number(value).toLocaleString('en-PK')}`;

function planName(category, index) {
  if (/gulf|uae|saudi|qatar|oman/i.test(category)) return 'Gulf';
  if (/overseas|uk|usa|canada|abroad/i.test(category)) return 'Overseas';
  if (/doctor|engineer|govt|government|business|second marriage/i.test(category)) return 'Professional';
  return index === 0 ? 'Standard' : `Plan ${index + 1}`;
}

// A section title in the reference's style: ❝ Title ❞, its Urdu line, then an optional note in both languages.
function Heading({ title, urdu, text, textUr }) {
  return (
    <div className="mx-auto mb-10 max-w-[960px] text-center max-sm:mb-7">
      <h2 className="text-[30px] font-bold leading-tight text-[#111] max-sm:text-[23px]">❝&nbsp;{title}&nbsp;❞</h2>
      {urdu && <Urdu keep as="p" className="mt-2 text-[26px] leading-[2] text-[#111] max-sm:text-[21px]">❞ {urdu} ❝</Urdu>}
      {text && <p className="mt-3 text-[17px] font-semibold leading-relaxed text-[#9b712b] max-sm:text-[15px]">{text}</p>}
      {textUr && <Urdu keep as="p" className="mt-2 text-[18px] leading-[2.1] text-[#9b712b] max-sm:text-[16px]">{textUr}</Urdu>}
    </div>
  );
}

const connectRows = (pack) => [
  { label: 'Profile Connect', value: String(pack.credits), ur: `پروفائل کنیکٹ: ${pack.credits}` },
  { label: 'Duration', value: 'Unlimited', ur: 'مدت: لا محدود' },
  ...(pack.description ? [{ label: 'Details', value: pack.description }] : []),
];

function ConnectCards({ packs, label, t, offset = 0 }) {
  return (
    <Slider label={label} perView={3}>
      {packs.map((pack, index) => (
        <PackageCard key={pack.id} t={t} tier={index + offset} name={pack.name} price={pack.price} was={pack.wasPrice} discount={pack.discount} ribbon={pack.featured ? 'Featured' : null} rows={connectRows(pack)} cta="Register Now" href={`/dashboard/credits/buy?package=${pack.id}`} />
      ))}
    </Slider>
  );
}

// The packages page, laid out like the reference's: the two kinds of service, Local and International
// profile connect packages, a comparison table, Boost my Proposal, Personalized Matchmaking (the bureau's
// official consultancy fees) and the payment accounts. Every price comes from the admin panel.
export default async function PackagesPage() {
  const t = await getT();
  const [fees, rows, methods, settings] = await Promise.all([
    getFees(),
    activePackages(),
    getDb().paymentMethod.findMany({ where: { active: true }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] }),
    getSettings(),
  ]);
  const packages = rows.map(packageView);
  const local = packages.filter((pack) => pack.kind === 'credits' && pack.scope === 'local');
  const foreign = packages.filter((pack) => pack.kind === 'credits' && pack.scope === 'foreign');
  const boosts = packages.filter((pack) => pack.kind === 'boost');
  const plans = fees.registration.map((row, index) => ({
    category: row.category,
    registration: row.fee,
    finalization: fees.finalization.find((item) => item.category === row.category)?.fee ?? fees.finalization[index]?.fee ?? '',
    name: planName(row.category, index),
  }));
  const connects = local.length + foreign.length > 0;
  const whatsapp = settings.site_whatsapp || settings.site_phone;
  return (
    <main className="bg-[linear-gradient(180deg,#fbf6ee,#f6efe2)] font-sans text-navy">
      <section className="px-[5%] pb-6 pt-14 text-center max-sm:px-4 max-sm:pt-10">
        <Label>{t('Welcome to {company}', { company: 'Al Zaujain Marriage Bureau' })}</Label>
        <GradientHeading as="h1" className="mt-2 text-[52px] leading-tight max-sm:text-[34px]">{t('Rishta Packages')}</GradientHeading>
        <Urdu keep as="p" className="mt-1 text-[34px] leading-[1.9] text-[#9b712b] max-sm:text-[26px]">رشتہ پیکجز</Urdu>
        <Ornament className="mt-2" />
        <div className="mx-auto mt-6 grid max-w-[900px] gap-3 text-start text-[17px] leading-[1.7] text-[#2f3b4a] max-sm:text-[15px]">
          <p>{t('Al Zaujain offers mainly two types of rishta services: Web & App Based Packages and Personalized Matchmaking.')}</p>
          <p>{t('In Web & App Based Packages you use our matrimonial website and app to find proposals yourself, on a self-service basis.')}</p>
          <p>{t('In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements.')}</p>
          <Urdu keep as="p" className="mt-2 text-end text-[18px] leading-[2.2]">الزوجین بنیادی طور پر دو قسم کی رشتہ خدمات فراہم کرتا ہے: ویب اور ایپ پر مبنی پیکجز اور ذاتی نوعیت کی میچ میکنگ۔ ویب اور ایپ پیکجز میں آپ ہماری ویب سائٹ اور ایپ کے ذریعے خود رشتہ تلاش کرتے ہیں، جبکہ ذاتی نوعیت کی میچ میکنگ میں ہمارے رشتہ کنسلٹنٹ آپ کی ضرورت کے مطابق رشتے دکھاتے ہیں۔</Urdu>
        </div>
        <h2 className="mt-10 text-[24px] font-bold text-[#111] max-sm:text-[20px]">{t('Which Type of Rishta Service Do You Need?')}</h2>
        <Urdu keep as="p" className="mt-1 text-[21px] leading-[2] text-[#333] max-sm:text-[18px]">آپ کو کس قسم کی رشتہ سروس کی ضرورت ہے؟</Urdu>
        <nav aria-label={t('Package types')} className="mx-auto mt-6 flex max-w-[900px] flex-wrap justify-center gap-4">
          {connects && (
            <a href="#web" className="min-w-[260px] rounded-md bg-[linear-gradient(135deg,#062b4e_55%,#0d3d6b)] px-7 py-4 text-[16px] font-semibold tracking-[1px] text-white no-underline shadow-[0_12px_26px_#062b4e40] ring-1 ring-[#c99432] transition-transform hover:-translate-y-0.5 hover:text-white max-sm:min-w-0 max-sm:flex-1">
              {t('Web & App Based Packages')}<Urdu keep as="span" className="block text-[15px] leading-[2] text-champagne">ویب اور ایپ پر مبنی پیکجز</Urdu>
            </a>
          )}
          <a href="#consultancy" className="min-w-[260px] rounded-md bg-[linear-gradient(135deg,#9b712b_55%,#c99432)] px-7 py-4 text-[16px] font-semibold tracking-[1px] text-white no-underline shadow-[0_12px_26px_#9b712b40] ring-1 ring-[#062b4e33] transition-transform hover:-translate-y-0.5 hover:text-white max-sm:min-w-0 max-sm:flex-1">
            {t('Personalized Matchmaking')}<Urdu keep as="span" className="block text-[15px] leading-[2] text-white/90">ذاتی نوعیت کی میچ میکنگ</Urdu>
          </a>
        </nav>
      </section>

      {local.length > 0 && (
        <section id="web" className="scroll-mt-24 px-[5%] py-12 max-sm:px-4">
          <div className="mx-auto max-w-[1296px]">
            <Heading
              title={t('Local Rishta Packages (Pakistan)')}
              urdu="لوکل رشتہ پیکجز (پاکستان)"
              text={t('With these packages you can connect with all members in this category. Overseas (Foreign) profiles are not included: to contact overseas members, please buy the International package.')}
              textUr="ان پیکجز کے ذریعے آپ اس کیٹیگری کے تمام ممبرز سے رابطہ کر سکتے ہیں۔ بیرونِ ملک (فارن) پروفائلز اس میں شامل نہیں؛ ان سے رابطے کے لیے انٹرنیشنل پیکج خریدیں۔"
            />
            <ConnectCards packs={local} label={t('Local rishta packages')} t={t} />
          </div>
        </section>
      )}

      {foreign.length > 0 && (
        <section id={local.length ? 'international' : 'web'} className="scroll-mt-24 px-[5%] py-12 max-sm:px-4">
          <div className="mx-auto max-w-[1296px]">
            <Heading title={t('International Rishta Packages (Foreign)')} urdu="انٹرنیشنل رشتہ پیکجز (بیرونِ ملک)" text={t('Connect with overseas members as well as members in Pakistan.')} />
            <ConnectCards packs={foreign} label={t('International rishta packages')} t={t} offset={3} />
          </div>
        </section>
      )}

      {connects && (
        <section className="px-[5%] py-12 max-sm:px-4">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center text-[28px] font-bold text-[#111] max-sm:text-[22px]">{t('Web & App Based Packages Comparison')}</h2>
            <Urdu keep as="p" className="mb-8 text-center text-[21px] leading-[2] text-[#333] max-sm:text-[18px]">ویب اور ایپ پر مبنی پیکجز کا موازنہ</Urdu>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_10px_30px_#062b4e14]">
              <table className="w-full min-w-[620px] border-collapse text-center text-[15px]">
                <thead>
                  <tr className="bg-navy text-white">
                    {['Packages', 'Profile Connect', 'Duration', 'Before Discount', 'After Discount'].map((head) => <th key={head} scope="col" className="px-4 py-3.5 font-semibold">{t(head)}</th>)}
                  </tr>
                </thead>
                {[[local, 'Local Rishta Packages (Pakistan)'], [foreign, 'International Rishta Packages (Foreign)']].filter(([list]) => list.length > 0).map(([list, title]) => (
                  <tbody key={title}>
                    <tr><th scope="colgroup" colSpan={5} className="bg-[#f6efe2] px-4 py-2.5 text-[14px] font-bold text-[#9b712b]">{t(title)}</th></tr>
                    {list.map((pack) => (
                      <tr key={pack.id} className="border-b border-[#f1ebe1] last:border-0">
                        <th scope="row" className="px-4 py-3 font-bold text-navy">{t(pack.name)}</th>
                        <td className="px-4 py-3">{pack.credits}</td>
                        <td className="px-4 py-3">{t('Unlimited')}</td>
                        <td className="px-4 py-3 text-[#777]" dir="ltr">{pack.wasPrice ? <s>{rupees(pack.wasPrice)}</s> : '—'}</td>
                        <td className="px-4 py-3 font-bold text-[#1f8a4c]" dir="ltr">{rupees(pack.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </div>
        </section>
      )}

      {boosts.length > 0 && (
        <section id="boost" className="scroll-mt-24 px-[5%] py-12 max-sm:px-4">
          <div className="mx-auto max-w-[1296px]">
            <Heading
              title={t('Boost my Proposal')}
              urdu="اپنی پروپوزل بوسٹ کریں"
              text={t('To boost your proposal, your profile information must be complete and your profile photo must be visible.')}
              textUr="پروپوزل بوسٹ کرنے کے لیے ضروری ہے کہ آپ کی پروفائل کی معلومات مکمل ہوں اور آپ کی پروفائل تصویر نظر آ رہی ہو۔"
            />
            <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-7 max-sm:grid-cols-1">
              {boosts.map((pack, index) => (
                <PackageCard
                  key={pack.id}
                  t={t}
                  tier={index + 2}
                  name={pack.name}
                  price={pack.price}
                  was={pack.wasPrice}
                  discount={pack.discount}
                  rows={[
                    { label: 'Duration', value: `${pack.days} Days`, ur: `مدت: ${pack.days} دن` },
                    { label: 'Proposal Status', value: pack.superBoost ? 'Super Boosted' : 'Boosted', ur: `پروپوزل کی حیثیت: ${pack.superBoost ? 'سپر بوسٹ شدہ' : 'بوسٹ شدہ'}` },
                    { label: 'Visibility', value: pack.description || 'Top of search results', ur: 'بوسٹڈ پروپوزلز تلاش کے نتائج میں سب سے اوپر دکھائی جاتی ہیں۔' },
                  ]}
                  cta="Register Now"
                  href={`/dashboard/credits/buy?package=${pack.id}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="consultancy" className="scroll-mt-24 px-[5%] py-12 max-sm:px-4">
        <div className="mx-auto max-w-[1296px]">
          <Heading
            title={t('Personalized Matchmaking')}
            urdu="ذاتی نوعیت کی میچ میکنگ"
            text={t('In Personalized Matchmaking, our office-based marriage consultants show you proposals as per your requirements. The registration fee is paid when you register and is non-refundable; the finalization fee is paid only after the rishta is finalized.')}
            textUr="ذاتی نوعیت کی میچ میکنگ میں ہمارے رشتہ کنسلٹنٹ آپ کی ضرورت کے مطابق رشتے دکھاتے ہیں۔ رجسٹریشن فیس رجسٹریشن کے وقت ادا ہوتی ہے اور ناقابلِ واپسی ہے؛ رشتہ طے ہونے کی فیس صرف رشتہ طے ہونے کے بعد ادا کی جاتی ہے۔"
          />
          <Slider label={t('Personalized matchmaking packages')} perView={3}>
            {plans.map((plan, index) => (
              <PackageCard
                key={plan.category}
                t={t}
                tier={index}
                name={plan.name}
                price={amount(plan.registration)}
                priceNote="Registration Fee · Non-Refundable"
                ribbon={/overseas/i.test(plan.name) ? 'International' : null}
                rows={[
                  { label: 'For', value: plan.category },
                  { label: 'Registration Fee', value: plan.registration, ur: `رجسٹریشن فیس: ${plan.registration}` },
                  { label: 'Finalization Fee', value: plan.finalization, ur: `رشتہ طے ہونے کی فیس: ${plan.finalization}` },
                  { label: 'Finalization Fee Paid', value: 'After The Rishta Is Finalized', ur: 'رشتہ طے ہونے کے بعد' },
                ]}
                cta="Register Now"
                href="/submit-profile"
              />
            ))}
          </Slider>
        </div>
      </section>

      {methods.length > 0 && (
        <section id="payment" className="scroll-mt-24 px-[5%] pb-16 pt-6 max-sm:px-4">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center text-[28px] font-bold text-[#111] max-sm:text-[22px]">{t('Payment Options')}</h2>
            <Urdu keep as="p" className="text-center text-[21px] leading-[2] text-[#333] max-sm:text-[18px]">ادائیگی کے طریقے</Urdu>
            <p className="mx-auto mb-8 mt-3 max-w-[860px] text-center text-[15.5px] leading-relaxed text-[#47566a]">
              {t('For payment, use only the following accounts and send the payment screenshot to our official WhatsApp{number}. We are not responsible for payments sent to any other account or person.', { number: whatsapp ? `: ${whatsapp}` : '' })}
            </p>
            <div className="grid grid-cols-2 gap-6 max-t:grid-cols-1">
              {methods.map((method) => (
                <article key={method.id} className="rounded-2xl border border-[#eadfca] bg-white p-6 shadow-[0_10px_30px_#062b4e10]">
                  <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-bold text-navy"><FaBuildingColumns aria-hidden="true" className="text-gold" /> {method.bank_name || method.name}</h3>
                  <dl className="grid gap-2.5 text-[14.5px]">
                    {[['Account Title', method.account_holder], ['Account Number', method.account_number], ['IBAN', method.iban]].filter(([, value]) => value).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[150px_1fr] gap-2 border-b border-[#f3ede2] pb-2 last:border-0 max-sm:grid-cols-1 max-sm:gap-0">
                        <dt className="text-[#777]">{t(label)}</dt>
                        <dd className="break-all font-semibold text-[#1f2a37]" dir="ltr">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {method.instructions && <p className="mt-3 whitespace-pre-line text-[13.5px] leading-6 text-[#47566a]">{method.instructions}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-[5%] pb-16 max-sm:px-4">
        <div className="mx-auto flex max-w-[900px] items-start gap-3 rounded-2xl border border-[#e8dcc3] bg-white/80 px-5 py-4 text-[14.5px] leading-6 text-[#47566a]">
          <FaCircleInfo aria-hidden="true" className="mt-1 shrink-0 text-gold" />
          <p>{t('Web & App Based Packages are separate from the Personalized Matchmaking fees. Our team will tell you which package fits your family; contact us on WhatsApp any time.')}</p>
        </div>
      </section>
    </main>
  );
}

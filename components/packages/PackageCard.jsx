import Link from 'next/link';
import { Urdu } from '@/components/ui/Text';

// The tier colours of the package cards, in order. Each package keeps its colour for the tag, the price
// and the button.
export const TIERS = [
  { tag: 'bg-[linear-gradient(135deg,#a8834f,#c9a46c)]', price: 'text-[#a8834f]', button: 'bg-[#a8834f] hover:bg-[#8f6d3e]', ribbon: 'bg-[#a8834f]' },
  { tag: 'bg-[linear-gradient(135deg,#7d8a99,#aab4bf)]', price: 'text-[#7d8a99]', button: 'bg-[#7d8a99] hover:bg-[#66727f]', ribbon: 'bg-[#7d8a99]' },
  { tag: 'bg-[linear-gradient(135deg,#c99432,#e4b653)]', price: 'text-[#c99432]', button: 'bg-[#c99432] hover:bg-[#a87a23]', ribbon: 'bg-[#c99432]' },
  { tag: 'bg-[linear-gradient(135deg,#062b4e,#0d4a80)]', price: 'text-[#0d3d6b]', button: 'bg-[#062b4e] hover:bg-[#03223f]', ribbon: 'bg-[#062b4e]' },
  { tag: 'bg-[linear-gradient(135deg,#1f8a6f,#3fb393)]', price: 'text-[#1f8a6f]', button: 'bg-[#1f8a6f] hover:bg-[#176b56]', ribbon: 'bg-[#1f8a6f]' },
  { tag: 'bg-[linear-gradient(135deg,#a33a2c,#d4573f)]', price: 'text-[#b8452f]', button: 'bg-[#b8452f] hover:bg-[#93372a]', ribbon: 'bg-[#b8452f]' },
];

/**
 * One package, in the style of the reference packages page: a coloured name tag, the price, a column
 * of facts (each with its Urdu line) and a full-width button. `rows` are { label, value, ur }.
 */
export function PackageCard({ tier = 0, name, price, priceNote, rows, cta, href, ribbon, t }) {
  const colour = TIERS[tier % TIERS.length];
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white px-5 pb-6 pt-7 text-center shadow-[0_10px_30px_#062b4e14] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_#062b4e26]">
      {ribbon && (
        <span aria-hidden="true" className="absolute -end-[46px] top-[26px] w-[180px] rotate-45 py-1 text-center text-[11px] font-bold capitalize text-white shadow-[0_3px_8px_#00000026]">
          <span className={`absolute inset-0 ${colour.ribbon}`} />
          <span className="relative">{t(ribbon)}</span>
        </span>
      )}
      <span className={`mx-auto inline-block rounded-full px-5 py-1.5 text-[14px] font-bold capitalize tracking-[1px] text-white shadow-[0_6px_14px_#00000026] ${colour.tag}`}>{t(name)}</span>
      <p className="mt-6 flex items-baseline justify-center gap-1.5" dir="ltr">
        <span className="text-[17px] font-medium text-[#222]">Rs.</span>
        <span className={`font-[family-name:var(--font-poppins)] text-[38px] font-extrabold leading-none ${colour.price}`}>{Number(price).toLocaleString('en-PK')}</span>
      </p>
      {priceNote && <p className="mt-2 text-[13px] text-muted">{t(priceNote)}</p>}
      <dl className="mt-6 border-t border-[#eee6da]">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-[#f1ebe1] px-2 py-3.5">
            <dt className="text-[14.5px] capitalize text-[#444]">{t(row.label)}</dt>
            <dd className="mt-0.5 text-[16px] font-bold capitalize leading-snug text-[#1f2a37]">{t(row.value)}</dd>
            {row.ur && <Urdu keep as="dd" className="mt-1 text-[15px] leading-[2] text-[#333]">{row.ur}</Urdu>}
          </div>
        ))}
      </dl>
      <div className="mt-auto pt-6">
        <Link href={href} className={`flex min-h-[52px] items-center justify-center rounded-xl px-5 text-[15.5px] font-bold text-white no-underline shadow-[0_8px_18px_#00000026] transition-colors hover:text-white ${colour.button}`}>{t(cta)}</Link>
      </div>
    </article>
  );
}

import Link from 'next/link';

// Card colours when the administrator has not chosen one, in the reference's order.
const DEFAULT_COLORS = ['#b08d57', '#a9a9a9', '#e0b400', '#4fb8d0', '#747068', '#ca3b11', '#597696', '#f09400'];

// A slightly darker shade of the card colour, for the second half of the split badge.
function darker(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.slice(0, 6);
  const n = parseInt(full, 16);
  const shade = (part) => Math.max(0, Math.round(part * 0.9)).toString(16).padStart(2, '0');
  return `#${shade((n >> 16) & 255)}${shade((n >> 8) & 255)}${shade(n & 255)}`;
}

export const packageColor = (pack, index) => pack.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

/**
 * One package card, built like the reference's: the "% OFF" corner ribbon, the split-colour name badge,
 * the crossed-out price before discount, the price, each fact with its Urdu line, and the button.
 * `rows` are { label, value, ur }.
 */
export function RishtaPackageCard({ name, color, discount = 0, was = null, price, rows, cta = 'Register Now', href, t, children = null }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#f0f0f0] bg-white px-5 py-[30px] text-center shadow-[0_10px_30px_#0000000d] transition-[transform,box-shadow] duration-300 hover:-translate-y-2.5 hover:shadow-[0_20px_40px_#0000001a] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {discount > 0 && (
        <span className="absolute -right-[35px] top-[15px] rotate-45 px-10 py-[5px] text-[12px] font-bold text-white shadow-[0_2px_5px_#0000001a]" style={{ background: color }} dir="ltr">
          {discount}% {t('OFF')}
        </span>
      )}
      <div>
        <span className="mb-5 inline-block rounded-full px-5 py-2 text-[14px] font-extrabold uppercase tracking-[2px] text-white" style={{ background: `linear-gradient(300deg, ${color} 50%, ${darker(color)} 50%)` }}>{t(name)}</span>
      </div>
      <div className="my-2" dir="ltr">
        {was > 0 && <span className="mb-[5px] block text-[14px] text-[#a0a0a0] line-through">{t('Was')} Rs. {Number(was).toLocaleString('en-PK')}</span>}
        <span className="block text-[32px] font-extrabold leading-tight" style={{ color }}><small className="text-[18px]">Rs. </small>{Number(price).toLocaleString('en-PK')}</span>
      </div>
      <ul className="my-[30px] border-t border-[#eee]">
        {rows.map((row) => (
          <li key={row.label} className="border-b border-[#fafafa] py-3">
            <span className="mb-0.5 block text-[15px] text-[#4a3f3f]">{t(row.label)}</span>
            <span className="mb-2.5 block text-[16px] font-semibold text-[#333]">{t(row.value)}</span>
            {row.ur && <span lang="ur" dir="rtl" className="mt-1 block font-urdu text-[16px] leading-[2] text-[#666]">{row.ur}</span>}
          </li>
        ))}
        {children}
      </ul>
      <div className="mt-auto">
        <Link href={href} className="block w-full rounded-xl p-[15px] text-[16px] font-bold text-white no-underline transition-opacity hover:text-white hover:opacity-90" style={{ background: color }}>{t(cta)}</Link>
      </div>
    </article>
  );
}

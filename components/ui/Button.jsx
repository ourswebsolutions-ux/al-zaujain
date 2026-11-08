import Link from 'next/link';

const base = 'inline-flex items-center justify-center rounded-[var(--btn-radius,9px)] text-center font-[var(--btn-weight,800)] tracking-[var(--btn-track,normal)] no-underline transition duration-200 ease-out hover:-translate-y-[var(--btn-lift,2px)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none';

const tones = {
  navy: 'bg-navy text-white hover:bg-[var(--btn-hover,#15456e)] hover:text-white',
  gold: 'bg-gold-soft text-dark hover:bg-champagne hover:text-dark',
  deepGold: 'bg-gold text-dark hover:bg-champagne hover:text-dark',
  outline: 'border border-line bg-white text-navy hover:bg-cream',
  danger: 'bg-[#a33a2c] text-[#fff] hover:bg-[#872c20] hover:text-[#fff]',
};

const sizes = {
  lg: 'gap-5 px-[21px] py-[14px] text-[13px] leading-[19.5px] max-m:px-[17px] max-m:py-3 max-m:text-xs max-m:leading-[18px]',
  md: 'gap-2.5 px-[21px] py-[14px] text-[11px] leading-[16.5px]',
  sm: 'gap-2 px-[14px] py-2 text-[11px] leading-[16.5px]',
};

export const buttonClass = (tone = 'navy', size = 'lg', extra = '') => `${base} ${tones[tone]} ${sizes[size]} ${extra}`;

export function Button({ tone, size, className = '', children, ...props }) {
  return <button className={buttonClass(tone, size, className)} {...props}>{children}</button>;
}

export function ButtonLink({ tone, size, className = '', external, href, children, ...props }) {
  if (external) {
    return <a href={href} target="_blank" rel="noopener" className={buttonClass(tone, size, className)} {...props}>{children}</a>;
  }
  return <Link href={href} className={buttonClass(tone, size, className)} {...props}>{children}</Link>;
}

export const Arrow = () => <span className="text-lg leading-none">→</span>;

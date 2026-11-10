import Link from 'next/link';

// Shared pieces of the homepage design: the two-tone gradient heading, the gold ornament divider,
// the small label with lines either side, and the round button with a light running around its edge.

export const sectionX = 'px-[5%] max-sm:px-4';
export const container = 'mx-auto w-full max-w-[1296px]';

export function GradientHeading({ as: Tag = 'h2', children, className = '' }) {
  return (
    <Tag className={`bg-[linear-gradient(135deg,#062b4e_30%,#c99432_100%)] bg-clip-text font-bold tracking-[1px] text-transparent [-webkit-text-fill-color:transparent] ${className}`}>
      {children}
    </Tag>
  );
}

export function Ornament({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="h-px w-[60px] bg-[linear-gradient(90deg,transparent,#c99432)]" />
      <span className="size-[9px] rotate-45 bg-gold" />
      <span className="h-px w-[60px] bg-[linear-gradient(90deg,#c99432,transparent)]" />
    </div>
  );
}

export function Label({ children, className = '' }) {
  return (
    <p className={`flex items-center justify-center gap-3 text-[15px] font-semibold capitalize tracking-[.5px] text-[#a17a33] max-sm:text-[13px] ${className}`}>
      <span aria-hidden="true" className="h-px w-10 shrink-0 bg-[#c99432] max-sm:hidden" />
      <span className="text-center">{children}</span>
      <span aria-hidden="true" className="h-px w-10 shrink-0 bg-[#c99432] max-sm:hidden" />
    </p>
  );
}

export function SectionHeader({ title, label, sub, className = '' }) {
  return (
    <header className={`mb-10 text-center max-sm:mb-7 ${className}`}>
      {label && <Label className="mb-3">{label}</Label>}
      <GradientHeading className="text-[40px] leading-[1.2] max-p:text-[34px] max-sm:text-[27px]">{title}</GradientHeading>
      <Ornament className="mb-3 mt-4" />
      {sub && <p className="mx-auto max-w-[760px] text-[22px] font-semibold leading-snug text-[#a17a33] max-p:text-lg max-sm:text-[15px]">{sub}</p>}
    </header>
  );
}

const glowButton = 'relative z-[1] inline-flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-full px-[30px] py-3 text-center text-[17px] font-bold text-navy no-underline shadow-[0_4px_15px_#062b4e40] transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:text-navy hover:shadow-[0_6px_20px_#062b4e66] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold max-sm:min-h-11 max-sm:px-6 max-sm:text-[15px]';

function Glow() {
  return (
    <>
      <span aria-hidden="true" className="absolute start-1/2 top-1/2 -z-[2] aspect-square w-[max(200%,300px)] -translate-x-1/2 -translate-y-1/2 animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(transparent,#ffffff_10%,#c99432_40%,transparent_40%)] motion-reduce:animate-none rtl:translate-x-1/2" />
      <span aria-hidden="true" className="absolute inset-[3px] -z-[1] rounded-full bg-white" />
    </>
  );
}

/** The homepage's call-to-action button: white, rounded, with a gold light circling its border. */
export function GlowButton({ href, external, children, className = '' }) {
  if (external) {
    return <a href={href} target="_blank" rel="noopener" className={`${glowButton} ${className}`}><Glow />{children}</a>;
  }
  return <Link href={href} className={`${glowButton} ${className}`}><Glow />{children}</Link>;
}

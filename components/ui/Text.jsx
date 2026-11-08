export function SectionTag({ children, className = '' }) {
  return (
    <span className={`mb-[17px] block text-[10px] font-bold leading-[15px] tracking-[1.6px] text-bronze max-m:mb-[13px] max-m:text-[8px] max-m:leading-3 max-m:tracking-[1.1px] ${className}`}>
      {children}
    </span>
  );
}

// A decorative Urdu line beside English text. Urdu mode hides it, because the main text is then Urdu.
export function Urdu({ as: Tag = 'p', className = '', keep, children }) {
  return <Tag lang="ur" dir="rtl" className={`font-urdu ${keep ? '' : 'ur:hidden'} ${className}`}>{children}</Tag>;
}

// The two heading scales used by the reference: Quicksand sections and Nunito sections.
export const headingQuicksand = 'text-[43px] font-bold leading-[53.75px] tracking-[-1.2px] max-b:text-[32px] max-b:leading-10 max-m:text-[29px] max-m:leading-[36.25px] max-m:tracking-[-0.8px]';
export const headingNunito = 'my-[14px] text-[46px] font-extrabold leading-[55.2px] max-b:text-[30px] max-b:leading-9';

const URDU_SCRIPT = /[؀-ۿ]/;

// Renders user text line by line, so Urdu lines read right to left and English left to right.
export function BidiText({ text, className = '', englishClass = 'text-[15px] leading-[1.9]', urduClass = 'text-[17px] leading-[2.5]' }) {
  if (!text) return null;
  return (
    <div className={className}>
      {text.split(/\n+/).filter((line) => line.trim()).map((line, index) => (URDU_SCRIPT.test(line)
        ? <p key={index} lang="ur" dir="rtl" className={`font-urdu ${urduClass}`}>{line}</p>
        : <p key={index} className={englishClass}>{line}</p>))}
    </div>
  );
}

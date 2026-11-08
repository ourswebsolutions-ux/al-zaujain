import Image from 'next/image';

export function AuthCard({ title, text, children, footer }) {
  return (
    <main className="grid grid-cols-[minmax(0,1fr)] place-items-center bg-cream px-[5%] py-16">
      <div className="w-full max-w-[440px] rounded-[20px] border border-line bg-white p-[35px] shadow-[0_12px_35px_#03223f08] max-m:p-6">
        <Image src="/images/logo.png" alt="" width={64} height={64} className="mx-auto mb-3 rounded-full" />
        <h1 className="text-center font-quicksand text-2xl font-bold text-navy">{title}</h1>
        {text && <p className="mb-2 mt-1.5 text-center text-xs leading-5 text-muted">{text}</p>}
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-5 text-center text-xs text-muted">{footer}</div>}
      </div>
    </main>
  );
}

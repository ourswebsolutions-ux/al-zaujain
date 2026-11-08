const block = 'animate-pulse rounded-2xl bg-[var(--d-hover,#e7e9ee)]';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className={`${block} h-44`} />
      <div className="mt-6 grid grid-cols-4 gap-4 max-p:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className={`${block} h-32`} />)}
      </div>
      <div className={`${block} mt-6 h-72`} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useLang, useT } from '@/components/i18n/LanguageProvider';

const WIDTH = 700;
const HEIGHT = 150;

// A top-rounded bar anchored to the baseline.
const barPath = (x, width, height) => {
  const radius = Math.min(4, height, width / 2);
  const top = HEIGHT - height;
  return `M${x},${HEIGHT}V${top + radius}Q${x},${top} ${x + radius},${top}H${x + width - radius}Q${x + width},${top} ${x + width},${top + radius}V${HEIGHT}Z`;
};

// The readout sits above the plot rather than floating, so it also works on touch screens.
export function ViewsChart({ daily }) {
  const t = useT();
  const lang = useLang();
  const [active, setActive] = useState(null);
  const label = (date) => new Date(date).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const plural = (count) => t(count === 1 ? '{count} view' : '{count} views', { count });
  const max = Math.max(1, ...daily.map((day) => day.count));
  const slot = WIDTH / daily.length;
  const barWidth = Math.min(24, slot - 6);
  const total = daily.reduce((sum, day) => sum + day.count, 0);
  const shown = active === null ? t('{views} in the last {days} days', { views: plural(total), days: daily.length }) : `${label(daily[active].date)}: ${plural(daily[active].count)}`;

  return (
    <figure>
      <figcaption aria-live="polite" className="mb-3 text-[13px] font-medium text-navy">{shown}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 1}`} aria-hidden="true" className="h-[170px] w-full! max-m:h-[130px]" preserveAspectRatio="none">
        {daily.map((day, index) => {
          const height = day.count ? Math.max(3, (day.count / max) * (HEIGHT - 8)) : 0;
          const x = index * slot + (slot - barWidth) / 2;
          return (
            <g key={index} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onClick={() => setActive(index)}>
              <rect x={index * slot} y="0" width={slot} height={HEIGHT} fill="transparent" />
              {height > 0 && <path d={barPath(x, barWidth, height)} fill={active === index ? '#c99432' : '#062b4e'} />}
            </g>
          );
        })}
        <line x1="0" x2={WIDTH} y1={HEIGHT + 0.5} y2={HEIGHT + 0.5} stroke="#dfe2e8" strokeWidth="1" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted"><span>{label(daily[0].date)}</span><span>{label(daily.at(-1).date)}</span></div>
      <table className="sr-only">
        <caption>{t('Profile views per day')}</caption>
        <thead><tr><th scope="col">{t('Date')}</th><th scope="col">{t('Views')}</th></tr></thead>
        <tbody>{daily.map((day, index) => <tr key={index}><td>{label(day.date)}</td><td>{day.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

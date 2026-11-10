'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FaGripVertical } from 'react-icons/fa6';
import { reorderBanners } from '@/app/actions/homepage';
import { useT } from '@/components/i18n/LanguageProvider';

/**
 * Drag the banners into the order they should rotate in. Works with a mouse or a finger; the order
 * is saved as soon as a banner is dropped. The Move up / Move down buttons below do the same.
 */
export function BannerOrder({ banners }) {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState(banners);
  const [dragging, setDragging] = useState(null);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const moveOver = (overId) => {
    if (!dragging || dragging === overId) return;
    setItems((list) => {
      const from = list.findIndex((item) => item.id === dragging);
      const to = list.findIndex((item) => item.id === overId);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };
  const save = () => {
    setDragging(null);
    if (items.map((item) => item.id).join() === banners.map((item) => item.id).join()) return;
    startSaving(async () => {
      await reorderBanners(items.map((item) => item.id));
      setSaved(true);
      router.refresh();
    });
  };

  if (items.length < 2) return null;
  return (
    <div className="mb-5 rounded-xl border border-[var(--d-line,#e6e8ee)] bg-[var(--d-card,#fff)] p-4">
      <p className="mb-3 text-[13px] font-medium text-navy">{t('Drag to change the order')} {saving ? `· ${t('Saving…')}` : saved ? `· ${t('Order saved.')}` : ''}</p>
      <ol className="flex flex-wrap gap-3">
        {items.map((banner, index) => (
          <li
            key={banner.id}
            draggable
            onDragStart={(event) => { setDragging(banner.id); event.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(event) => { event.preventDefault(); moveOver(banner.id); }}
            onDrop={(event) => { event.preventDefault(); save(); }}
            onDragEnd={save}
            onPointerDown={(event) => { if (event.pointerType !== 'mouse') { setDragging(banner.id); event.currentTarget.releasePointerCapture?.(event.pointerId); } }}
            onPointerMove={(event) => {
              if (event.pointerType === 'mouse' || !dragging) return;
              const over = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-banner]');
              if (over) moveOver(over.dataset.banner);
            }}
            onPointerUp={(event) => { if (event.pointerType !== 'mouse') save(); }}
            data-banner={banner.id}
            className={`relative w-[170px] cursor-grab touch-none select-none overflow-hidden rounded-lg border-2 bg-white shadow-[0_3px_10px_#062b4e1f] transition-[opacity,border-color] active:cursor-grabbing ${dragging === banner.id ? 'border-gold opacity-60' : 'border-transparent'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.src} alt="" draggable={false} className="pointer-events-none aspect-[1440/520] w-full object-cover" />
            <span className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-navy"><FaGripVertical aria-hidden="true" className="text-muted" /> {index + 1}. {banner.heading || t('Image banner')}</span>
            {!banner.active && <span className="absolute end-1.5 top-1.5 rounded bg-[#000000a6] px-1.5 py-0.5 text-[10px] text-white">{t('Hidden')}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

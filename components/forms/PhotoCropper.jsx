'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaMagnifyingGlassMinus, FaMagnifyingGlassPlus, FaXmark } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const MAX_ZOOM = 4;

/**
 * Choose the part of a photo shown on proposal cards, like setting a WhatsApp picture: drag the photo
 * inside the circle, zoom with the slider, the mouse wheel or two fingers. The result is the chosen
 * square as fractions of the photo ({ x, y, w, h }), which the server cuts from the original.
 */
export function PhotoCropper({ src, initial, onDone, onCancel, title = 'Adjust card photo' }) {
  const t = useT();
  // The circle is 300px, or narrower on small phones. The modal only opens after a tap, so window exists.
  const [STAGE] = useState(() => Math.min(300, (typeof window === 'undefined' ? 340 : window.innerWidth) - 72));
  const [size, setSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map());
  const last = useRef(null);
  const pinch = useRef(null);
  const dialog = useRef(null);

  const base = size ? STAGE / Math.min(size.w, size.h) : 1;
  const scale = base * zoom;
  const shown = size ? { w: size.w * scale, h: size.h * scale } : { w: STAGE, h: STAGE };
  const clamp = (next, dims = shown) => ({ x: Math.min(0, Math.max(STAGE - dims.w, next.x)), y: Math.min(0, Math.max(STAGE - dims.h, next.y)) });

  const onLoad = (event) => {
    const w = event.currentTarget.naturalWidth;
    const h = event.currentTarget.naturalHeight;
    setSize({ w, h });
    const fit = STAGE / Math.min(w, h);
    if (initial) {
      const z = Math.min(MAX_ZOOM, Math.max(1, STAGE / (initial.w * w * fit)));
      setZoom(z);
      setOffset({ x: -initial.x * w * fit * z, y: -initial.y * h * fit * z });
    } else {
      // Start centred on the upper part, where faces usually are.
      setOffset({ x: (STAGE - w * fit) / 2, y: Math.min(0, Math.max(STAGE - h * fit, -(h * fit - STAGE) * 0.2)) });
    }
  };

  // Zooming keeps the point under the centre of the circle where it is.
  const zoomTo = (value) => {
    if (!size) return;
    const next = Math.min(MAX_ZOOM, Math.max(1, value));
    const cx = (STAGE / 2 - offset.x) / shown.w;
    const cy = (STAGE / 2 - offset.y) / shown.h;
    const dims = { w: size.w * base * next, h: size.h * base * next };
    setZoom(next);
    setOffset(clamp({ x: STAGE / 2 - cx * dims.w, y: STAGE / 2 - cy * dims.h }, dims));
  };

  const down = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    last.current = { x: event.clientX, y: event.clientY };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const move = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      zoomTo(pinch.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance));
      return;
    }
    const dx = event.clientX - last.current.x;
    const dy = event.clientY - last.current.y;
    last.current = { x: event.clientX, y: event.clientY };
    setOffset((current) => clamp({ x: current.x + dx, y: current.y + dy }));
  };
  const up = (event) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const rest = [...pointers.current.values()][0];
    if (rest) last.current = rest;
  };

  useEffect(() => {
    dialog.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const nudge = (event) => {
    const step = event.shiftKey ? 20 : 6;
    const delta = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key];
    if (delta) { event.preventDefault(); setOffset((current) => clamp({ x: current.x + delta[0], y: current.y + delta[1] })); }
    if (event.key === '+' || event.key === '=') zoomTo(zoom + 0.2);
    if (event.key === '-') zoomTo(zoom - 0.2);
  };

  const done = () => {
    if (!size) return;
    onDone({ x: -offset.x / shown.w, y: -offset.y / shown.h, w: STAGE / shown.w, h: STAGE / shown.h });
  };

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-[#03223fcc] p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(title)} className="w-full max-w-[380px] rounded-[22px] bg-white p-5 text-navy shadow-[0_30px_80px_#00000066] outline-none">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">{t(title)}</h2>
          <button type="button" onClick={onCancel} aria-label={t('Close')} className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-[#f2f3f6] hover:text-navy"><FaXmark aria-hidden="true" /></button>
        </div>
        <p className="mb-3 text-[13px] leading-5 text-muted">{t('Drag the photo and zoom so the face sits inside the circle. This is how it appears on proposal cards; the full photo stays on the profile.')}</p>
        <div
          tabIndex={0}
          role="application"
          aria-label={t('Photo position. Use the arrow keys to move and + or - to zoom.')}
          onKeyDown={nudge}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onWheel={(event) => zoomTo(zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08))}
          style={{ width: STAGE, height: STAGE }}
          className="relative mx-auto max-w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-[#1c2733] outline-none active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-gold"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            onLoad={onLoad}
            style={{ width: shown.w, height: shown.h, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            className="pointer-events-none absolute start-0 top-0 max-w-none origin-top-left rtl:start-auto rtl:left-0"
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_#03223f99] ring-2 ring-white/90" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => zoomTo(zoom - 0.25)} aria-label={t('Zoom out')} className="grid size-9 cursor-pointer place-items-center rounded-full bg-cream text-navy"><FaMagnifyingGlassMinus aria-hidden="true" /></button>
          <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={(event) => zoomTo(Number(event.target.value))} aria-label={t('Zoom')} className="w-full accent-gold" />
          <button type="button" onClick={() => zoomTo(zoom + 0.25)} aria-label={t('Zoom in')} className="grid size-9 cursor-pointer place-items-center rounded-full bg-cream text-navy"><FaMagnifyingGlassPlus aria-hidden="true" /></button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-full border border-line font-semibold text-navy hover:bg-[#f6f5f0]">{t('Cancel')}</button>
          <button type="button" onClick={done} disabled={!size} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-navy font-bold text-white hover:bg-dark disabled:opacity-50"><FaCheck aria-hidden="true" /> {t('Use this photo')}</button>
        </div>
      </div>
    </div>
  );
}

/** A small round preview of the chosen part of a photo. */
export function CropPreview({ src, crop, size = 96, className = '' }) {
  if (!crop) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={{ width: size, height: size }} className={`rounded-full object-cover ${className}`} />;
  }
  const width = size / crop.w;
  const height = size / crop.h;
  return (
    <span style={{ width: size, height: size }} className={`relative block overflow-hidden rounded-full bg-[#e9e1d1] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ width, height, left: -crop.x * width, top: -crop.y * height }} className="absolute max-w-none" />
    </span>
  );
}

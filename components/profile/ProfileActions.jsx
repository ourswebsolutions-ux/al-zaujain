'use client';

import { useRef, useState } from 'react';
import { FaCopy, FaFileImage, FaFilePdf, FaFileZipper } from 'react-icons/fa6';
import { Button } from '@/components/ui/Button';
import { ExportPart, ExportSheet, exportParts } from './ExportSheet';
import { useT } from '@/components/i18n/LanguageProvider';

const A4_RATIO = 297 / 210;

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new window.Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

function triggerDownload(href, fileName) {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

// Cut pages at section boundaries so a block of details is never split in two.
function pageBreaks(sheet, pageHeight) {
  const top = sheet.getBoundingClientRect().top;
  const blocks = [...sheet.querySelectorAll('[data-block]')].map((block) => {
    const rect = block.getBoundingClientRect();
    return { start: rect.top - top, end: rect.bottom - top };
  });
  const breaks = [0];
  for (const block of blocks) {
    if (block.end - breaks.at(-1) > pageHeight && block.start > breaks.at(-1)) breaks.push(block.start);
  }
  breaks.push(sheet.offsetHeight);
  return breaks;
}

export function ProfileActions({ text, sheet, code, compact }) {
  const t = useT();
  const size = compact ? 'md' : 'lg';
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const sheetRef = useRef(null);
  const partsRef = useRef(null);
  const parts = exportParts(sheet.data);

  const say = (message, ok = true) => {
    setNotice({ message, ok });
    setTimeout(() => setNotice(null), 3500);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      say('Complete profile copied to your clipboard.');
    } catch {
      say('Your browser blocked copying. Please try again.', false);
    }
  };

  const render = async () => {
    const { toPng } = await import('html-to-image');
    await document.fonts.ready;
    await Promise.all([...sheetRef.current.querySelectorAll('img')].map((image) => image.decode().catch(() => {})));
    return toPng(sheetRef.current, { pixelRatio: 2, cacheBust: false, backgroundColor: '#ffffff' });
  };

  const downloadImage = async () => {
    setBusy('image');
    try {
      triggerDownload(await render(), `al-zaujain-${code}.png`);
      say('Your profile image has been downloaded.');
    } catch {
      say('The image could not be created. Please try again.', false);
    } finally {
      setBusy(null);
    }
  };

  // For phones: one picture per section (profile, personal, education, residence…), in one ZIP.
  const downloadZip = async () => {
    setBusy('zip');
    try {
      const { toPng } = await import('html-to-image');
      const { zipSync } = await import('fflate');
      await document.fonts.ready;
      const nodes = [...partsRef.current.querySelectorAll('[data-part]')];
      await Promise.all([...partsRef.current.querySelectorAll('img')].map((image) => image.decode().catch(() => {})));
      const files = {};
      for (const node of nodes) {
        const png = await toPng(node, { pixelRatio: 2, cacheBust: false, backgroundColor: '#ffffff' });
        const bytes = Uint8Array.from(atob(png.split(',')[1]), (c) => c.charCodeAt(0));
        files[`al-zaujain-${code}-${node.dataset.part}.png`] = [bytes, { level: 0 }];
      }
      const url = URL.createObjectURL(new Blob([zipSync(files)], { type: 'application/zip' }));
      triggerDownload(url, `al-zaujain-${code}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      say('Your profile images have been downloaded (ZIP).');
    } catch {
      say('The images could not be created. Please try again.', false);
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    setBusy('pdf');
    try {
      const png = await render();
      const image = await loadImage(png);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      const element = sheetRef.current;
      const scale = image.width / element.offsetWidth;
      const breaks = pageBreaks(element, element.offsetWidth * A4_RATIO);
      for (let index = 0; index < breaks.length - 1; index += 1) {
        const startY = breaks[index] * scale;
        const height = (breaks[index + 1] - breaks[index]) * scale;
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, startY, image.width, height, 0, 0, image.width, height);
        if (index > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, (height / image.width) * 210);
      }
      pdf.save(`al-zaujain-${code}.pdf`);
      say('Your profile PDF has been downloaded.');
    } catch {
      say('The PDF could not be created. Please try again.', false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" size={size} onClick={copy} className="cursor-pointer"><FaCopy aria-hidden="true" /> {t(compact ? 'Copy profile' : 'Copy complete profile')}</Button>
        <Button type="button" size={size} tone="gold" disabled={!!busy} onClick={downloadImage} className="cursor-pointer"><FaFileImage aria-hidden="true" /> {t(busy === 'image' ? 'Creating…' : 'Download image (desktop)')}</Button>
        <Button type="button" size={size} tone="gold" disabled={!!busy} onClick={downloadZip} className="cursor-pointer"><FaFileZipper aria-hidden="true" /> {t(busy === 'zip' ? 'Creating…' : 'Download for mobile (ZIP)')}</Button>
        <Button type="button" size={size} tone="gold" disabled={!!busy} onClick={downloadPdf} className="cursor-pointer"><FaFilePdf aria-hidden="true" /> {t(busy === 'pdf' ? 'Creating…' : 'Download PDF')}</Button>
      </div>
      {notice && <p role="status" className={`mt-3 w-fit rounded-md px-3 py-2 text-xs font-semibold ${notice.ok ? 'bg-[#eef4ef] text-[#3d6b4a]' : 'bg-[#fbeeec] text-[#a33a2c]'}`}>{notice.message}</p>}
      <div aria-hidden="true" className="pointer-events-none fixed -start-[10000px] top-0">
        <div ref={sheetRef}><ExportSheet {...sheet} /></div>
        <div ref={partsRef} className="mt-10 grid gap-10">
          {parts.map((part, index) => <ExportPart key={part.file} part={part} index={index + 1} total={parts.length} {...sheet} />)}
        </div>
      </div>
    </div>
  );
}

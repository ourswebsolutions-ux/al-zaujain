'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';
import { Urdu } from '@/components/ui/Text';

export function FaqList({ faqs }) {
  const t = useT();
  const [openId, setOpenId] = useState(faqs[0]?.id ?? null);
  return (
    <div>
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} className="border-b border-line">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : faq.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-5 py-6 text-start text-lg font-extrabold leading-[27px] focus-visible:outline-3 focus-visible:outline-offset-[5px] focus-visible:outline-gold"
              >
                <span>{t(faq.question)}</span>
                <FaPlus aria-hidden="true" className={`shrink-0 text-[13px] transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                  <div className="pb-5 text-[#536471]">
                    <p className="mb-4 text-base leading-[28.8px]">{t(faq.answer)}</p>
                    {faq.answer_ur && <Urdu className="mb-4 text-[17px] leading-[42.5px] max-m:text-[15px] max-m:leading-[37.5px]">{faq.answer_ur}</Urdu>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

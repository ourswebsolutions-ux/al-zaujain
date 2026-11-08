'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaRobot, FaWhatsapp, FaXmark } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

// Guided assistant: prepared answers only, nothing is sent to a server.
const answers = (t, phone, location) => [
  [t('How do I get started?'), t('Start by submitting your profile on this website, no account needed. You can also tell our team your city, age range, and what matters to you. Call {phone} or use WhatsApp to discuss the next steps.', { phone })],
  [t('Can I enquire for my family?'), t('Yes. You can enquire for yourself, your son, daughter, or another adult family member. Involve the person concerned and share their preferences with our team.')],
  [t('What are your charges?'), t('Please contact our team for current service charges, what is included, and the terms before deciding. We do not publish a fixed package price here yet.')],
  [t('When can I use the app?'), t('The Al Zaujain Android app is available now. Download it from the Android app section on our homepage. Your login, profile, matches and messages are the same in the app and on this website.')],
  [t('How is my information shared?'), t('Public proposals show a first name and general details only. Your full name, contact details and CNIC stay private. Ask our team if you would like to know how consent is handled.')],
  [t('How can I contact your team?'), t('We are based in {location}. Call {phone} or tap “Speak with our team” below to open WhatsApp. Our team can guide you about proposals and the next steps.', { location: t(location), phone })],
];

export function Assistant({ phone, whatsapp, location }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(null);
  const launcher = useRef(null);
  const conversation = useRef(null);
  const options = answers(t, phone, location);

  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (!typing || typing.position >= typing.text.length) {
      if (typing) {
        setMessages((list) => [...list, { role: 'assistant', text: typing.text }]);
        setTyping(null);
      }
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setTyping({ ...typing, position: reduced ? typing.text.length : typing.position + 5 }), 25);
    return () => clearTimeout(timer);
  }, [typing]);

  const ask = ([question, answer]) => {
    setMessages((list) => [...list, { role: 'user', text: question }]);
    setTyping({ text: answer, position: 0 });
  };

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('Open Al Zaujain AI chat')}
        aria-expanded={open}
        className="fixed bottom-[22px] left-[22px] z-[1000] size-[54px] cursor-pointer rounded-full border border-gold bg-navy text-[23px] text-champagne shadow-[0_5px_18px_#03223f2b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-gold max-g:bottom-3 max-g:left-3 max-g:text-xl"
      >
        <FaRobot aria-hidden="true" className="mx-auto" />
        <span className="absolute -right-1 -top-[5px] rounded-md bg-gold-soft px-[5px] py-[3px] font-nunito text-[10px] font-extrabold leading-none text-dark">AI</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            data-native-scroll
            aria-label={t('Al Zaujain AI assistant')}
            onKeyDown={(event) => event.key === 'Escape' && close()}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-[90px] left-[22px] z-[1001] flex h-[min(610px,calc(100dvh-115px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden  border border-line bg-paper text-navy rounded-[22px] shadow-[0_18px_65px_#03223f30] max-g:bottom-[74px] max-g:left-3 max-g:h-[min(600px,calc(100dvh-90px))]"
          >
            <header className="flex items-center gap-3 bg-navy p-[17px] text-white">
              <span className="grid size-[39px] place-items-center rounded-xl bg-white/8 text-xl text-champagne"><FaRobot aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm">{t('Al Zaujain AI')}</strong>
                <small className="block text-[11px] leading-[17.6px] text-[#dfd6c4]">{t('Your guided rishta assistant')}</small>
              </div>
              <button type="button" onClick={close} aria-label={t('Close AI chat')} className="cursor-pointer px-1.5 text-xl text-white"><FaXmark aria-hidden="true" /></button>
            </header>

            <div ref={conversation} tabIndex={0} aria-label={t('Conversation')} className="min-h-[90px] flex-1 overflow-y-auto p-[18px] text-[13px] leading-[21px]">
              <div className="mb-[17px] max-w-[94%] border-l-2 border-gold py-[3px] pl-3">
                <span className="text-[9px] font-black leading-[14.4px] tracking-[1px] text-[#8d682a]">{t('AL ZAUJAIN AI')}</span>
                <p className="my-1.5">{t('Assalam-o-Alaikum! How can I help you today?')}</p>
              </div>
              {messages.map((message, index) => message.role === 'user' ? (
                <div key={index} className="mb-[17px] ml-auto w-fit max-w-[85%] rounded-[14px_14px_3px_14px] bg-navy px-3.5 py-2.5 text-white">{message.text}</div>
              ) : (
                <div key={index} className="mb-[17px] max-w-[94%] border-l-2 border-gold py-[3px] pl-3">
                  <span className="text-[9px] font-black leading-[14.4px] tracking-[1px] text-[#8d682a]">{t('AL ZAUJAIN AI')}</span>
                  <p className="my-1.5">{message.text}</p>
                </div>
              ))}
              {typing && (
                <div className="mb-[17px] max-w-[94%] border-l-2 border-gold py-[3px] pl-3">
                  <span className="text-[9px] font-black leading-[14.4px] tracking-[1px] text-[#8d682a]">{t('AL ZAUJAIN AI')}</span>
                  <p className="my-1.5">{typing.text.slice(0, typing.position)}</p>
                </div>
              )}
            </div>

            <div className="border-t border-[#e6ddcc] bg-white px-4 py-[13px]">
              <span className="text-[9px] font-extrabold leading-[14.4px] tracking-[1px] text-muted">{t('CHOOSE A QUESTION')}</span>
              <div className="my-2.5 flex max-h-[132px] flex-wrap gap-[7px] overflow-y-auto">
                {options.map((option) => (
                  <button key={option[0]} type="button" disabled={!!typing} onClick={() => ask(option)} className="cursor-pointer rounded-[10px] border border-line bg-paper px-2.5 py-2 text-left text-xs font-bold leading-[16.8px] hover:bg-[#f4e8ce] disabled:cursor-wait disabled:opacity-55">
                    {option[0]}
                  </button>
                ))}
              </div>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="text-xs font-extrabold leading-[19.2px] text-[#126d3c] no-underline">
                <FaWhatsapp aria-hidden="true" className="inline-block" /> {t('Speak with our team')}
              </a>
              <small className="mt-[7px] block text-[10px] leading-4 text-muted">{t('Guided answers · Choose a question above')}</small>
            </div>
            <span className="sr-only" role="status" aria-live="polite">{typing ? t('Al Zaujain AI is replying.') : ''}</span>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

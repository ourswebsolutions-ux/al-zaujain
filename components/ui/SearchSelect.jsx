'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaXmark } from 'react-icons/fa6';
import { useT } from '@/components/i18n/LanguageProvider';

const URDU_SCRIPT = /[؀-ۿ]/;
const MAX_SHOWN = 80;

const normalise = (options) => options.map((option) => (typeof option === 'object' ? { ...option, value: String(option.value) } : { value: String(option) }));
const fold = (text = '') => text.toString().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

// A dropdown you can type into: the list narrows as you type, and arrow keys, Enter and Escape work.
// With `allowCustom` the typed text is kept even when it is not in the list (castes, cities).
// Margins belong on `className` (the wrapper), so the icons stay centred on the input.
// The chosen value travels in a hidden input, so it works inside ordinary GET and server-action forms.
export function SearchSelect({
  name, id, options, value, defaultValue = '', onChange, placeholder, anyLabel, allowCustom = false,
  translate = false, className = '', inputClassName = '', invalid, maxLength = 80, label,
}) {
  const t = useT();
  const auto = useId();
  const inputId = id ?? `${auto}-input`;
  const listId = `${auto}-list`;
  const input = useRef(null);
  const [own, setOwn] = useState(String(defaultValue ?? ''));
  const current = value !== undefined ? String(value ?? '') : own;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(0);

  const items = useMemo(() => normalise(options).map((option) => ({ ...option, text: option.label ?? (translate ? t(option.value) : option.value) })), [options, translate, t]);
  const selected = items.find((item) => item.value === current);
  const display = selected ? selected.text : current;

  const matches = useMemo(() => {
    if (!typed || !query.trim()) return items;
    const needle = fold(query.trim());
    const starts = [];
    const contains = [];
    for (const item of items) {
      const haystacks = [item.text, item.value, item.alt].filter(Boolean).map(fold);
      if (haystacks.some((text) => text.startsWith(needle))) starts.push(item);
      else if (haystacks.some((text) => text.includes(needle))) contains.push(item);
    }
    return [...starts, ...contains];
  }, [items, query, typed]);

  const exact = typed && items.some((item) => fold(item.text) === fold(query.trim()) || fold(item.value) === fold(query.trim()));
  const custom = allowCustom && typed && query.trim() && !exact ? { value: query.trim(), text: t('Use “{text}”', { text: query.trim() }), custom: true } : null;
  const list = [
    ...(anyLabel && !typed ? [{ value: '', text: t(anyLabel), any: true }] : []),
    ...matches.slice(0, MAX_SHOWN),
    ...(custom ? [custom] : []),
  ];

  const commit = (next) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const close = () => { setOpen(false); setTyped(false); };
  const choose = (item) => { commit(item.value); close(); };

  const openList = () => {
    setQuery(display);
    setTyped(false);
    setActive(Math.max(0, list.findIndex((item) => item.value === current)));
    setOpen(true);
  };

  const onBlur = () => {
    if (!open) return;
    if (typed) {
      const text = query.trim();
      const match = items.find((item) => fold(item.text) === fold(text) || fold(item.value) === fold(text));
      if (match) commit(match.value);
      else if (allowCustom || !text) commit(text);
    }
    close();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return openList();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (list.length ? (index + step + list.length) % list.length : 0));
    } else if (event.key === 'Enter' && open && list[active]) {
      event.preventDefault();
      choose(list[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  };

  const clear = () => { commit(''); close(); input.current?.focus(); };

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}
      <input
        ref={input}
        id={inputId}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && list[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        maxLength={maxLength}
        placeholder={placeholder ? t(placeholder) : undefined}
        value={open ? query : display}
        onFocus={(event) => { openList(); event.target.select(); }}
        onClick={() => { if (!open) openList(); }}
        onChange={(event) => { setQuery(event.target.value); setTyped(true); setActive(0); setOpen(true); }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`${inputClassName} mt-0! pe-9! text-ellipsis`}
      />
      {current && !open ? (
        <button type="button" tabIndex={-1} onClick={clear} aria-label={t('Clear')} className="absolute end-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[11px] text-muted hover:bg-cream hover:text-navy">
          <FaXmark aria-hidden="true" />
        </button>
      ) : (
        <FaChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-muted" />
      )}
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className="absolute start-0 top-full z-40 mt-1 max-h-64 w-full min-w-[200px] overflow-auto rounded-lg border border-line bg-white py-1 text-[13px] text-navy shadow-[0_18px_40px_#03223f24]">
          {list.length === 0 && <li className="px-3 py-2.5 text-muted">{t('No matches. Try another spelling.')}</li>}
          {list.map((item, index) => (
            <li
              key={`${item.custom ? 'custom' : item.any ? 'any' : 'item'}-${item.value}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={item.value === current}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => { event.preventDefault(); choose(item); }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 ${index === active ? 'bg-cream' : ''} ${item.value === current && !item.custom ? 'font-bold' : ''} ${item.any || item.custom ? 'text-muted' : ''}`}
            >
              <span className="min-w-0 truncate">{item.text}</span>
              {item.alt && <span className={`shrink-0 text-[11px] text-muted ${URDU_SCRIPT.test(item.alt) ? 'font-urdu text-[13px] leading-6' : ''}`}>{translate || !URDU_SCRIPT.test(item.alt) ? t(item.alt) : item.alt}</span>}
            </li>
          ))}
          {matches.length > MAX_SHOWN && <li className="px-3 py-2 text-[11px] text-muted">{t('Keep typing to see more')}</li>}
        </ul>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

// Scroll reveal matching the reference timing: each item animates once as it enters view.
export function Reveal({ as = 'div', y = 0, x = 0, scale = 1, duration = 0.45, className, children, ...props }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  );
}

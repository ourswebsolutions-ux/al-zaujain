'use client';

/**
 * The card picture: the square the owner chose when uploading (like a WhatsApp picture), so it
 * fills the frame without stretching. The full photo is shown on the profile page.
 */
export function CardPhoto({ profile, alt, className = '' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/media/photos/${profile.photo}`} alt={alt} loading="lazy" className={`absolute inset-0 size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04] ${className}`} />
  );
}

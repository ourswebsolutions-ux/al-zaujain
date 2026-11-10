'use client';

/**
 * A profile picture shown whole inside any frame (oval, circle or square): never cropped and never
 * stretched. The space the picture does not fill is covered by a soft, blurred copy of it, so the
 * frame always looks full. Both images come from /media/photos, which applies the privacy rules.
 */
export function CardPhoto({ profile, alt, className = '' }) {
  const full = profile.photoFull ?? profile.photo;
  return (
    <span className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/media/photos/${profile.photo}`} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 size-full scale-110 object-cover opacity-80 blur-xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/media/photos/${full}`} alt={alt} loading="lazy" className="absolute inset-0 size-full object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
    </span>
  );
}

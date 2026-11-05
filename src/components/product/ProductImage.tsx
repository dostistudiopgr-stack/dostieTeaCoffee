import { useEffect, useState } from 'react';
import { getProductImage } from '../../utils/imageDb';

export default function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    if (!src || /^(https?:|data:|blob:|\/)/i.test(src)) return;
    let active = true;
    let objectUrl = '';
    getProductImage(src).then((record) => {
      if (record) { objectUrl = URL.createObjectURL(record.file); if (active) setLoaded({ source: src, url: objectUrl }); }
    }).catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  const resolved = src && /^(https?:|data:|blob:|\/)/i.test(src) ? src : loaded?.source === src ? loaded.url : '';
  return resolved ? <img src={resolved} alt={alt} className={className} /> : <div role="img" aria-label={alt || 'Product image unavailable'} className={`flex items-center justify-center bg-[var(--brand-background)] text-xs text-[#73786F] ${className}`}>Image unavailable</div>;
}

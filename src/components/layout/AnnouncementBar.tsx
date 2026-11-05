import { usePublicSettings } from '../../hooks/usePublicSettings';

export default function AnnouncementBar() {
  const { store } = usePublicSettings();
  const tagline = store.tagline.trim();
  if (!tagline) return null;
  return <div role="region" aria-label="Store announcement" className="bg-[var(--brand-dark)] px-4 py-2 text-center text-xs text-white">{tagline}</div>;
}

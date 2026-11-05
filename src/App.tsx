import AppRoutes from './routes/AppRoutes';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { usePublicSettings } from './hooks/usePublicSettings';

const App = () => {
  const { branding, store } = usePublicSettings();
  useEffect(() => {
    document.title = store.name || 'Store';
    const root = document.documentElement.style;
    root.setProperty('--brand-primary', branding.primary);
    root.setProperty('--brand-dark', branding.dark);
    root.setProperty('--brand-background', branding.background);
    root.setProperty('--brand-accent', branding.accent);
  }, [store.name, branding]);
  const brandStyle = {
    '--brand-primary': branding.primary,
    '--brand-dark': branding.dark,
    '--brand-background': branding.background,
    '--brand-accent': branding.accent,
  } as CSSProperties;
  return <div style={brandStyle}><AppRoutes /></div>;
};

export default App;

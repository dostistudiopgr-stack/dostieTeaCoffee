import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }      from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider }      from './context/CartContext';
import './index.css';
import App from './App';
import { migrateLocalData } from './utils/migrations';
import { validatePublicConfig } from './config/env';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found in the DOM.');

const root = createRoot(rootElement);
validatePublicConfig();
void migrateLocalData().then(() => {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Local data migration failed.';
  root.render(<main role="alert" style={{ maxWidth: 640, margin: '10vh auto', padding: 24, fontFamily: 'system-ui' }}>
    <h1>Saved data needs attention</h1><p>{message}</p>
    <p>Your browser data has not been cleared. Keep this tab open and export a backup before trying again.</p>
  </main>);
});

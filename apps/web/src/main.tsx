import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './app/styles.css';
import { resolveApiBaseUrl } from './shared/services/apiBaseUrl';
import { registerServiceWorker } from './sw/register';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker(resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL));

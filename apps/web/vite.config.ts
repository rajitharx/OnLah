import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { offlineWorker } from './scripts/offlineWorkerPlugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (mode === 'production' && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error('VITE_API_BASE_URL must be set for production builds. See .env.example.');
  }
  return { plugins: [react(), offlineWorker()] };
});

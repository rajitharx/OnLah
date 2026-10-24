import { WORKER_PATH } from './policy';

export interface RegistrationContext {
  isProduction: boolean;
  protocol: string;
  hostname: string;
  supported: boolean;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function shouldRegisterWorker(context: RegistrationContext): boolean {
  if (!context.isProduction || !context.supported) return false;
  return context.protocol === 'https:' || LOCAL_HOSTS.has(context.hostname);
}

export function workerUrl(apiBaseUrl: string): string {
  let apiOrigin = '';
  try {
    apiOrigin = new URL(apiBaseUrl).origin;
  } catch {
    apiOrigin = '';
  }
  return apiOrigin === '' ? WORKER_PATH : `${WORKER_PATH}?api=${encodeURIComponent(apiOrigin)}`;
}

export function registerServiceWorker(apiBaseUrl: string): void {
  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const allowed = shouldRegisterWorker({
    isProduction: import.meta.env.PROD,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    supported,
  });
  if (!allowed) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(workerUrl(apiBaseUrl)).catch(() => undefined);
  });
}

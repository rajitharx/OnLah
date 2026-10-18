const LOCAL_BACKEND = 'http://localhost:5050';

export function resolveApiBaseUrl(configured: string | undefined): string {
  const trimmed = configured?.trim();
  if (!trimmed) return LOCAL_BACKEND;
  return trimmed.replace(/\/+$/, '');
}

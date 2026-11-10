/**
 * API CONFIGURATION
 *
 * In local development: defaults to relative '/api' (proxied by Vite).
 * In production (Vercel): uses VITE_API_URL if configured, otherwise falls back to the production Render backend.
 */
function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host === 'roarextreme.com' || host === 'www.roarextreme.com') {
      return 'https://roar-extreme-3.onrender.com';
    }
  }

  return '';
}

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}


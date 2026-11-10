/**
 * API CONFIGURATION
 *
 * In local development: defaults to relative '/api' (proxied by Vite).
 * In production (Vercel): uses VITE_API_URL if configured, otherwise falls back to relative '/api'.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}


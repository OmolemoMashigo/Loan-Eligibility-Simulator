export const API_ORIGIN = 'http://localhost';
export const API_BASE_PATH = '/api';

export function apiPath(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;

  return `${API_BASE_PATH}${normalised}`;
}

export function apiUrl(path: string): string {
  return `${API_ORIGIN}${apiPath(path)}`;
}

/** Match the same /api path on any origin (tests, Vite, Docker). */
export function apiMatch(path: string): RegExp {
  return new RegExp(`${escapeRegExp(apiPath(path))}(?:\\?|$)`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

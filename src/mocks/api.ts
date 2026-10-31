export const API_ORIGIN = 'http://localhost';
export const API_BASE_PATH = '/api';

export function apiUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;

  return `${API_ORIGIN}${API_BASE_PATH}${normalised}`;
}

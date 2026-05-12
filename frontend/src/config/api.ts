export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '/api';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

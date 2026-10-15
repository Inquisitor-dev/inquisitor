import { apiUrl } from '@/config/api';
import { useGameStore } from '@/store/useGameStore';

/**
 * Tüm backend çağrıları için merkezi tip-güvenli HTTP istemcisi.
 * - Oturum token'ı useGameStore'dan otomatik eklenir (veya çağrı bazında ezilebilir)
 * - JSON dönüştürme ve hata yönetimi tek merkezdedir
 * - Başarısız isteklerde anlamlı ApiError fırlatır
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  /** Store'daki token yerine bu kullanılır; `null` verilirse Authorization başlığı gönderilmez. */
  token?: string | null;
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

function resolveToken(token: RequestOptions['token']): string | null {
  if (token !== undefined) return token;
  if (typeof window === 'undefined') return null;
  try {
    return useGameStore.getState().authToken;
  } catch {
    return null;
  }
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return `İstek başarısız oldu (HTTP ${status})`;
}

async function executeRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  const token = resolveToken(options.token);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
    cache: options.cache ?? (method === 'GET' ? 'no-store' : undefined),
  });

  const parsed = await parseResponseBody(res);
  if (!res.ok) {
    throw new ApiError(res.status, parsed, extractErrorMessage(parsed, res.status));
  }
  return parsed as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    executeRequest<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    executeRequest<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    executeRequest<T>('PATCH', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    executeRequest<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    executeRequest<T>('DELETE', path, undefined, options),
};

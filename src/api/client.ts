import { API_BASE_URL } from '@/config';

/** Error de la API ya listo para mostrar: `message` viene del backend (en catalán). */
export class ApiError extends Error {
  status?: number;
  /** Código funcional del backend (p. ej. `pass_required`, `session_full`). */
  code?: string;
  fieldErrors: Record<string, string[]>;
  isNetwork: boolean;

  constructor(
    message: string,
    opts: { status?: number; code?: string; fieldErrors?: Record<string, string[]>; isNetwork?: boolean } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.fieldErrors = opts.fieldErrors ?? {};
    this.isNetwork = opts.isNetwork ?? false;
  }

  get isUnauthorized() { return this.status === 401; }

  firstError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

export type Query = Record<string, string | number | undefined | null>;

export interface ApiClientOptions {
  readToken: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  private base: string;
  constructor(private opts: ApiClientOptions) {
    const baseUrl = (opts.baseUrl ?? API_BASE_URL).replace(/\/+$/, '');
    this.base = /\/api\/v1(?:\/public)?$/.test(baseUrl) ? baseUrl : `${baseUrl}/api/v1`;
  }

  get = (path: string, query?: Query) => this.send('GET', path, undefined, query);
  post = (path: string, body?: unknown) => this.send('POST', path, body);
  patch = (path: string, body?: unknown) => this.send('PATCH', path, body);
  put = (path: string, body?: unknown) => this.send('PUT', path, body);
  delete = (path: string, body?: unknown) => this.send('DELETE', path, body);

  private async send(method: string, path: string, body?: unknown, query?: Query): Promise<any> {
    let url = `${this.base}/${path.replace(/^\/+/, '')}`;
    if (query) {
      const qs = Object.entries(query)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = await this.opts.readToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 20000);
    let response: Response;
    try {
      response = await (this.opts.fetchImpl ?? fetch)(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError('No hem pogut connectar amb el servidor.', { isNetwork: true });
    } finally {
      clearTimeout(timer);
    }

    let data: any = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (response.ok) return data && typeof data === 'object' && !Array.isArray(data) ? data : {};

    if (response.status === 401) this.opts.onUnauthorized?.();
    const fieldErrors: Record<string, string[]> = {};
    if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries<any>(data.errors)) fieldErrors[k] = (Array.isArray(v) ? v : [v]).map(String);
    }
    throw new ApiError(
      (data && typeof data.message === 'string' && data.message) || `S'ha produït un error (${response.status}).`,
      { status: response.status, code: data?.code, fieldErrors },
    );
  }
}

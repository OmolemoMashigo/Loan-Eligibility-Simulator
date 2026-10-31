import { type ZodType } from 'zod';
import { ApiError } from './errors';
import { apiErrorBodySchema } from './schemas';

export const DEFAULT_API_BASE_URL = '/api';
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  searchParams?: Record<string, string>;
};

type RequestConfig<T> = RequestOptions & {
  method?: 'GET' | 'POST';
  body?: unknown;
  schema: ZodType<T>;
};

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (typeof configured === 'string' && configured.trim().length > 0) {
    return stripTrailingSlash(configured.trim());
  }

  return DEFAULT_API_BASE_URL;
}

export function buildApiUrl(
  path: string,
  searchParams?: Record<string, string>,
): string {
  const base = getApiBaseUrl();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const href = `${base}${suffix}`;
  const url = isAbsoluteUrl(href)
    ? new URL(href)
    : new URL(href, getRuntimeOrigin());

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export async function request<T>(
  path: string,
  config: RequestConfig<T>,
): Promise<T> {
  const timeoutMs = config.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeout = startTimeout(timeoutMs);
  const userAbort = watchAbort(config.signal);
  const fetchSignal = mergeAbortSignals([config.signal, timeout.signal]);

  try {
    const response = await raceDefined([
      fetch(buildApiUrl(path, config.searchParams), {
        method: config.method ?? 'GET',
        headers: buildHeaders(config.body),
        body:
          config.body === undefined ? undefined : JSON.stringify(config.body),
        // jsdom's AbortSignal is a different realm from the Node fetch MSW patches.
        signal: shouldPassSignalToFetch() ? fetchSignal : undefined,
      }),
      timeout.expired,
      userAbort.promise,
    ]);

    return await parseResponse(response, config.schema);
  } catch (error) {
    throw toNetworkError(error, timeout.didTimeout(), config.signal);
  } finally {
    timeout.cleanup();
    userAbort.cleanup();
  }
}

function buildHeaders(body: unknown): Headers {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

async function parseResponse<T>(
  response: Response,
  schema: ZodType<T>,
): Promise<T> {
  const payload = await readJsonPayload(response);

  if (!response.ok) {
    throw toHttpError(response.status, payload);
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError({
      kind: 'schema',
      status: response.status,
      message: 'The server returned an unexpected response.',
      cause: parsed.error,
    });
  }

  return parsed.data;
}

async function readJsonPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (response.ok) {
      throw new ApiError({
        kind: 'schema',
        status: response.status,
        message: 'The server returned an unexpected response.',
        cause: error,
      });
    }

    throw new ApiError({
      kind: 'server',
      status: response.status,
      message: 'Something went wrong. Please try again.',
      cause: error,
    });
  }
}

function toHttpError(status: number, payload: unknown): ApiError {
  const parsed = apiErrorBodySchema.safeParse(payload);

  if (parsed.success && parsed.data.error.code === 'VALIDATION_ERROR') {
    return new ApiError({
      kind: 'validation',
      status,
      code: parsed.data.error.code,
      message: parsed.data.error.message,
      fieldErrors: parsed.data.error.fieldErrors,
    });
  }

  if (parsed.success) {
    return new ApiError({
      kind: 'server',
      status,
      code: parsed.data.error.code,
      message: parsed.data.error.message,
    });
  }

  return new ApiError({
    kind: 'server',
    status,
    message: 'Something went wrong. Please try again.',
  });
}

function toNetworkError(
  error: unknown,
  timedOut: boolean,
  userSignal: AbortSignal | undefined,
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (timedOut) {
    return new ApiError({
      kind: 'network',
      message: 'The request timed out. Please try again.',
      cause: error,
    });
  }

  if (userSignal?.aborted || isAbortError(error)) {
    return new ApiError({
      kind: 'network',
      message: 'The request was cancelled.',
      cause: error,
    });
  }

  return new ApiError({
    kind: 'network',
    message: 'Unable to reach the server. Please try again.',
    cause: error,
  });
}

function startTimeout(timeoutMs: number): {
  signal: AbortSignal | undefined;
  expired: Promise<never> | undefined;
  cleanup: () => void;
  didTimeout: () => boolean;
} {
  if (timeoutMs <= 0) {
    return {
      signal: undefined,
      expired: undefined,
      cleanup: () => undefined,
      didTimeout: () => false,
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  let rejectExpired: ((error: Error) => void) | undefined;
  const expired = new Promise<never>((_, reject) => {
    rejectExpired = reject;
  });
  void expired.catch(() => undefined);

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
    rejectExpired?.(createAbortError());
  }, timeoutMs);

  return {
    signal: controller.signal,
    expired,
    cleanup: () => {
      clearTimeout(timeoutId);
    },
    didTimeout: () => timedOut,
  };
}

function watchAbort(signal: AbortSignal | undefined): {
  promise: Promise<never> | undefined;
  cleanup: () => void;
} {
  if (!signal) {
    return { promise: undefined, cleanup: () => undefined };
  }

  if (signal.aborted) {
    const promise = Promise.reject(createAbortError());
    void promise.catch(() => undefined);

    return { promise, cleanup: () => undefined };
  }

  let onAbort: (() => void) | undefined;
  const promise = new Promise<never>((_, reject) => {
    onAbort = () => {
      reject(createAbortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
  void promise.catch(() => undefined);

  return {
    promise,
    cleanup: () => {
      if (onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
    },
  };
}

function mergeAbortSignals(
  signals: readonly (AbortSignal | undefined)[],
): AbortSignal | undefined {
  const active = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined,
  );

  if (active.length === 0) {
    return undefined;
  }

  const [onlySignal] = active;

  if (active.length === 1 && onlySignal) {
    return onlySignal;
  }

  const controller = new AbortController();
  const onAbort = (): void => {
    controller.abort();
  };

  for (const signal of active) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener('abort', onAbort, { once: true });
  }

  return controller.signal;
}

function raceDefined<T>(promises: Array<Promise<T> | undefined>): Promise<T> {
  return Promise.race(
    promises.filter((promise): promise is Promise<T> => promise !== undefined),
  );
}

function shouldPassSignalToFetch(): boolean {
  return import.meta.env.MODE !== 'test';
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isAbsoluteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getRuntimeOrigin(): string {
  if (import.meta.env.MODE === 'test') {
    return 'http://localhost';
  }

  if (
    typeof globalThis.location?.origin === 'string' &&
    globalThis.location.origin !== 'null' &&
    globalThis.location.origin.length > 0
  ) {
    return globalThis.location.origin;
  }

  return 'http://localhost';
}

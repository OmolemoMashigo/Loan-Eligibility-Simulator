/** SI-10: every failed request becomes one ApiError the UI can switch on. */

export type ApiErrorKind = 'network' | 'validation' | 'server' | 'schema';

export type ApiErrorCode = 'VALIDATION_ERROR' | 'INTERNAL_ERROR';

export type FieldErrorMap = Record<string, string>;

export type ApiErrorInit = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: ApiErrorCode;
  fieldErrors?: FieldErrorMap;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly code: ApiErrorCode | undefined;
  readonly fieldErrors: FieldErrorMap | undefined;

  constructor(init: ApiErrorInit) {
    super(
      init.message,
      init.cause === undefined ? undefined : { cause: init.cause },
    );
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

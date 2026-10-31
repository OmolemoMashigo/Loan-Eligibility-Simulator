export { ApiError, isApiError } from './errors';
export type { ApiErrorCode, ApiErrorKind, FieldErrorMap } from './errors';
export {
  DEFAULT_API_BASE_URL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  getApiBaseUrl,
} from './client';
export type { RequestOptions } from './client';
export {
  useCalculateRate,
  useCheckEligibility,
  useLoanProducts,
  useValidationRules,
} from './hooks';
export {
  calculateRate,
  checkEligibility,
  fetchLoanProducts,
  fetchValidationRules,
} from './loans';
export { createQueryClient } from './queryClient';
export { loanQueryKeys } from './queryKeys';
export type {
  ApiErrorBody,
  CalculateRateRequest,
  CalculateRateResponse,
  EligibilityRequest,
  EligibilityResponse,
  EmploymentStatus,
  LoanPurpose,
  LoanType,
  ProductsResponse,
  ValidationRulesResponse,
} from './schemas';

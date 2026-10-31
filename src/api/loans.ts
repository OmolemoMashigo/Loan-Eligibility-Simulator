import { request, type RequestOptions } from './client';
import {
  calculateRateResponseSchema,
  eligibilityResponseSchema,
  productsResponseSchema,
  validationRulesResponseSchema,
  type CalculateRateRequest,
  type CalculateRateResponse,
  type EligibilityRequest,
  type EligibilityResponse,
  type ProductsResponse,
  type ValidationRulesResponse,
} from './schemas';

export function fetchLoanProducts(
  options?: RequestOptions,
): Promise<ProductsResponse> {
  return request('/loans/products', {
    ...options,
    schema: productsResponseSchema,
  });
}

export function fetchValidationRules(
  options?: RequestOptions,
): Promise<ValidationRulesResponse> {
  return request('/loans/validation-rules', {
    ...options,
    schema: validationRulesResponseSchema,
  });
}

export function checkEligibility(
  body: EligibilityRequest,
  options?: RequestOptions,
): Promise<EligibilityResponse> {
  return request('/loans/eligibility', {
    ...options,
    method: 'POST',
    body,
    schema: eligibilityResponseSchema,
  });
}

export function calculateRate(
  body: CalculateRateRequest,
  options?: RequestOptions,
): Promise<CalculateRateResponse> {
  return request('/loans/calculate-rate', {
    ...options,
    method: 'POST',
    body,
    schema: calculateRateResponseSchema,
  });
}

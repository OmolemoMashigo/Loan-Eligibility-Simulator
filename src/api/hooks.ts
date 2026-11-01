import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import {
  calculateRate,
  checkEligibility,
  fetchLoanProducts,
  fetchValidationRules,
} from './loans';
import { loanQueryKeys } from './queryKeys';
import type { CalculateRateRequest, EligibilityRequest } from './schemas';

export function useLoanProducts() {
  return useQuery({
    queryKey: loanQueryKeys.products(),
    queryFn: ({ signal }) => fetchLoanProducts({ signal }),
    staleTime: Infinity,
  });
}

export function useValidationRules() {
  return useQuery({
    queryKey: loanQueryKeys.validationRules(),
    queryFn: ({ signal }) => fetchValidationRules({ signal }),
    staleTime: Infinity,
  });
}

export function useCheckEligibility() {
  return useMutation({
    mutationFn: (body: EligibilityRequest) => checkEligibility(body),
  });
}

/**
 * The repayment schedule for one amount and term. Waits while there is no
 * request, and keeps showing the previous schedule while the next one loads.
 */
export function useRepaymentSchedule(body: CalculateRateRequest | undefined) {
  return useQuery({
    queryKey: loanQueryKeys.schedule(body),
    queryFn: body ? ({ signal }) => calculateRate(body, { signal }) : skipToken,
    placeholderData: keepPreviousData,
  });
}

export function useCalculateRate() {
  return useMutation({
    mutationFn: (body: CalculateRateRequest) => calculateRate(body),
  });
}

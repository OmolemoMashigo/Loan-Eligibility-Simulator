import type { CalculateRateRequest, EligibilityRequest } from '@/api';
import { SIMULATED_LOAN_PRODUCT_ID } from './loanProduct';

/**
 * SI-14: the eligibility response has no schedule, so it is loaded from
 * calculate-rate for the recommended amount over the requested term.
 * Returns nothing when no amount is affordable.
 */
export function buildScheduleRequest(
  request: EligibilityRequest,
  recommendedAmount: number,
): CalculateRateRequest | undefined {
  if (recommendedAmount <= 0) {
    return undefined;
  }

  const { creditScore } = request.financialInfo;

  return {
    loanAmount: recommendedAmount,
    loanTerm: request.loanDetails.loanTerm,
    loanType: SIMULATED_LOAN_PRODUCT_ID,
    ...(creditScore === undefined ? {} : { creditScore }),
  };
}

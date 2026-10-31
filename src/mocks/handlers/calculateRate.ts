import { HttpResponse, http } from 'msw';
import { apiMatch } from '@/mocks/api';
import {
  calculateAmortisationSchedule,
  selectAnnualInterestRate,
  validateCalculateRateRequest,
} from '@/mocks/engine';
import { applyMockLatency } from '@/mocks/latency';
import type { CalculateRateResponse } from '@/mocks/engine';
import {
  internalErrorResponse,
  isSimulatedServerError,
  readJsonBody,
  validationErrorResponse,
} from './errors';

export const calculateRateHandlers = [
  http.post(apiMatch('/loans/calculate-rate'), async ({ request }) => {
    await applyMockLatency();

    if (isSimulatedServerError(request)) {
      return internalErrorResponse();
    }

    const parsed = validateCalculateRateRequest(await readJsonBody(request));

    if (!parsed.ok) {
      return validationErrorResponse(parsed.error);
    }

    const interestRate = selectAnnualInterestRate(parsed.value.creditScore);
    const schedule = calculateAmortisationSchedule({
      principal: parsed.value.loanAmount,
      annualRatePercent: interestRate,
      termMonths: parsed.value.loanTerm,
    });

    const body: CalculateRateResponse = {
      interestRate,
      monthlyPayment: schedule.monthlyPayment,
      totalInterest: schedule.totalInterest,
      totalRepayment: schedule.totalRepayment,
      paymentSchedule: schedule.paymentSchedule,
    };

    return HttpResponse.json(body);
  }),
];

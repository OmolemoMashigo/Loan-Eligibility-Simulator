import type { PaymentScheduleEntry } from './types';

const CENTS = 100;

export interface AmortisationInput {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
}

export interface AmortisationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleEntry[];
}

export function toCents(amount: number): number {
  return Math.round(amount * CENTS);
}

export function fromCents(cents: number): number {
  return cents / CENTS;
}

export function roundToCents(amount: number): number {
  return fromCents(toCents(amount));
}

export function monthlyRateFromAnnualPercent(
  annualRatePercent: number,
): number {
  return annualRatePercent / 100 / 12;
}

function assertValidInput({
  principal,
  annualRatePercent,
  termMonths,
}: AmortisationInput): void {
  if (principal < 0) {
    throw new RangeError('Principal must be zero or positive');
  }

  if (annualRatePercent < 0) {
    throw new RangeError('Annual rate must be zero or positive');
  }

  if (!Number.isInteger(termMonths) || termMonths < 1) {
    throw new RangeError('Term must be an integer of at least 1 month');
  }
}

/**
 * Standard monthly annuity payment, rounded to cents (SI-6).
 * Monthly rate is annual percent / 100 / 12. Zero-rate loans split equally.
 */
export function calculateMonthlyPayment(input: AmortisationInput): number {
  assertValidInput(input);

  const { principal, annualRatePercent, termMonths } = input;

  if (principal === 0) {
    return 0;
  }

  const monthlyRate = monthlyRateFromAnnualPercent(annualRatePercent);

  if (monthlyRate === 0) {
    return roundToCents(principal / termMonths);
  }

  const growth = (1 + monthlyRate) ** termMonths;
  const payment = (principal * monthlyRate * growth) / (growth - 1);

  return roundToCents(payment);
}

/**
 * Full amortisation table. Each period rounds interest to cents.
 * The final payment absorbs leftover rand so the closing balance is 0.
 */
export function calculateAmortisationSchedule(
  input: AmortisationInput,
): AmortisationResult {
  assertValidInput(input);

  const { principal, annualRatePercent, termMonths } = input;
  const monthlyRate = monthlyRateFromAnnualPercent(annualRatePercent);
  const monthlyPayment = calculateMonthlyPayment(input);
  const regularPaymentCents = toCents(monthlyPayment);

  let balanceCents = toCents(principal);
  const paymentSchedule: PaymentScheduleEntry[] = [];

  for (let month = 1; month <= termMonths; month += 1) {
    const isLast = month === termMonths;
    const interestCents = Math.round(balanceCents * monthlyRate);

    let paymentCents: number;
    let principalCents: number;

    if (isLast) {
      principalCents = balanceCents;
      paymentCents = principalCents + interestCents;
      balanceCents = 0;
    } else {
      paymentCents = regularPaymentCents;
      principalCents = paymentCents - interestCents;

      if (principalCents > balanceCents) {
        principalCents = balanceCents;
        paymentCents = principalCents + interestCents;
        balanceCents = 0;
      } else {
        balanceCents -= principalCents;
      }
    }

    paymentSchedule.push({
      month,
      payment: fromCents(paymentCents),
      principal: fromCents(principalCents),
      interest: fromCents(interestCents),
      balance: fromCents(balanceCents),
    });
  }

  const totalRepayment = roundToCents(
    paymentSchedule.reduce((sum, row) => sum + row.payment, 0),
  );
  const totalInterest = roundToCents(totalRepayment - principal);

  return {
    monthlyPayment,
    totalInterest,
    totalRepayment,
    paymentSchedule,
  };
}

import type { EligibilityRequest } from '@/api';

/** SI-3: duration is collected only for these statuses. */
export const EMPLOYMENT_STATUSES_REQUIRING_DURATION = [
  'employed',
  'self_employed',
] as const;

export type EmploymentStatusRequiringDuration =
  (typeof EMPLOYMENT_STATUSES_REQUIRING_DURATION)[number];

export type FormNumericRule = {
  min?: number;
  max?: number;
  required: boolean;
  errorMessage: string;
};

export type FormEnumRule = {
  required: boolean;
  options: readonly string[];
  errorMessage: string;
};

/**
 * SI-9: the validation-rules endpoint omits existing debt, purpose,
 * and upper bounds for income, expenses, and duration.
 */
export type FormValidationDefaults = {
  existingDebt: FormNumericRule;
  loanPurpose: FormEnumRule;
  monthlyIncomeMax: number;
  monthlyExpensesMax: number;
  employmentDurationMax: number;
};

export const FORM_VALIDATION_DEFAULTS: FormValidationDefaults = {
  existingDebt: {
    min: 0,
    max: 10_000_000,
    required: true,
    errorMessage:
      'Please enter your total existing debt. Use 0 if you have none',
  },
  loanPurpose: {
    required: true,
    options: [
      'debt_consolidation',
      'home_improvement',
      'education',
      'medical',
      'other',
    ],
    errorMessage: 'Please select a loan purpose',
  },
  monthlyIncomeMax: 10_000_000,
  monthlyExpensesMax: 10_000_000,
  employmentDurationMax: 600,
};

export type EligibilityFormValues = {
  personalInfo: {
    age: string;
    employmentStatus: string;
    employmentDuration: string;
  };
  financialInfo: {
    monthlyIncome: string;
    monthlyExpenses: string;
    existingDebt: string;
    creditScore: string;
  };
  loanDetails: {
    requestedAmount: string;
    loanTerm: string;
    loanPurpose: string;
  };
};

export function emptyEligibilityFormValues(): EligibilityFormValues {
  return {
    personalInfo: {
      age: '',
      employmentStatus: '',
      employmentDuration: '',
    },
    financialInfo: {
      monthlyIncome: '',
      monthlyExpenses: '',
      existingDebt: '',
      creditScore: '',
    },
    loanDetails: {
      requestedAmount: '',
      loanTerm: '',
      loanPurpose: '',
    },
  };
}

export function requiresEmploymentDuration(status: string): boolean {
  return (EMPLOYMENT_STATUSES_REQUIRING_DURATION as readonly string[]).includes(
    status,
  );
}

export function eligibilityFormValuesFromRequest(
  request: EligibilityRequest,
): EligibilityFormValues {
  return {
    personalInfo: {
      age: String(request.personalInfo.age),
      employmentStatus: request.personalInfo.employmentStatus,
      employmentDuration:
        request.personalInfo.employmentDuration === undefined
          ? ''
          : String(request.personalInfo.employmentDuration),
    },
    financialInfo: {
      monthlyIncome: String(request.financialInfo.monthlyIncome),
      monthlyExpenses: String(request.financialInfo.monthlyExpenses),
      existingDebt: String(request.financialInfo.existingDebt),
      creditScore:
        request.financialInfo.creditScore === undefined
          ? ''
          : String(request.financialInfo.creditScore),
    },
    loanDetails: {
      requestedAmount: String(request.loanDetails.requestedAmount),
      loanTerm: String(request.loanDetails.loanTerm),
      loanPurpose: request.loanDetails.loanPurpose,
    },
  };
}

import { PERSONAL_LOAN_ID, PERSONAL_LOAN_PRODUCT } from './config';
import type {
  ApiErrorBody,
  CalculateRateRequest,
  EligibilityRequest,
  EmploymentStatus,
  FieldErrorMap,
  LoanType,
} from './types';
import {
  EMPLOYMENT_STATUS_OPTIONS,
  LOCAL_VALIDATION_DEFAULTS,
  VALIDATION_RULES_RESPONSE,
} from './validationRules';

export type ValidationSuccess<T> = { ok: true; value: T };
export type ValidationFailure = { ok: false; error: ApiErrorBody };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const STATUSES_REQUIRING_DURATION: readonly EmploymentStatus[] = [
  'employed',
  'self_employed',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmploymentStatus(value: unknown): value is EmploymentStatus {
  return (
    typeof value === 'string' &&
    (EMPLOYMENT_STATUS_OPTIONS as readonly string[]).includes(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function addError(errors: FieldErrorMap, path: string, message: string): void {
  if (!(path in errors)) {
    errors[path] = message;
  }
}

function checkRequiredNumber(
  errors: FieldErrorMap,
  path: string,
  value: unknown,
  message: string,
): value is number {
  if (value === undefined || value === null) {
    addError(errors, path, message);
    return false;
  }

  if (!isFiniteNumber(value)) {
    addError(errors, path, message);
    return false;
  }

  return true;
}

function checkRange(
  errors: FieldErrorMap,
  path: string,
  value: number,
  min: number | undefined,
  max: number | undefined,
  message: string,
  integer = false,
): void {
  if (integer && !Number.isInteger(value)) {
    addError(errors, path, message);
    return;
  }

  if (min !== undefined && value < min) {
    addError(errors, path, message);
  }

  if (max !== undefined && value > max) {
    addError(errors, path, message);
  }
}

function failure(fieldErrors: FieldErrorMap): ValidationFailure {
  return {
    ok: false,
    error: {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields',
        fieldErrors,
      },
    },
  };
}

export function validateEligibilityRequest(
  body: unknown,
): ValidationResult<EligibilityRequest> {
  const errors: FieldErrorMap = {};
  const rules = VALIDATION_RULES_RESPONSE;

  if (!isRecord(body)) {
    addError(errors, 'body', 'Request body must be an object');
    return failure(errors);
  }

  const personalInfo = body['personalInfo'];
  const financialInfo = body['financialInfo'];
  const loanDetails = body['loanDetails'];

  if (!isRecord(personalInfo)) {
    addError(errors, 'personalInfo', 'Personal details are required');
  }

  if (!isRecord(financialInfo)) {
    addError(errors, 'financialInfo', 'Financial details are required');
  }

  if (!isRecord(loanDetails)) {
    addError(errors, 'loanDetails', 'Loan details are required');
  }

  if (
    !isRecord(personalInfo) ||
    !isRecord(financialInfo) ||
    !isRecord(loanDetails)
  ) {
    return failure(errors);
  }

  const ageValue = personalInfo['age'];
  if (
    checkRequiredNumber(
      errors,
      'personalInfo.age',
      ageValue,
      rules.personalInfo.age.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'personalInfo.age',
      ageValue,
      rules.personalInfo.age.min,
      rules.personalInfo.age.max,
      rules.personalInfo.age.errorMessage,
      true,
    );
  }

  const statusValue = personalInfo['employmentStatus'];
  if (statusValue === undefined || statusValue === null) {
    addError(
      errors,
      'personalInfo.employmentStatus',
      rules.personalInfo.employmentStatus.errorMessage,
    );
  } else if (!isEmploymentStatus(statusValue)) {
    addError(
      errors,
      'personalInfo.employmentStatus',
      rules.personalInfo.employmentStatus.errorMessage,
    );
  }

  const durationRequired =
    isEmploymentStatus(statusValue) &&
    STATUSES_REQUIRING_DURATION.includes(statusValue);
  const durationValue = personalInfo['employmentDuration'];

  if (durationRequired) {
    if (
      checkRequiredNumber(
        errors,
        'personalInfo.employmentDuration',
        durationValue,
        rules.personalInfo.employmentDuration.errorMessage,
      )
    ) {
      checkRange(
        errors,
        'personalInfo.employmentDuration',
        durationValue,
        rules.personalInfo.employmentDuration.min,
        LOCAL_VALIDATION_DEFAULTS.employmentDurationMax,
        rules.personalInfo.employmentDuration.errorMessage,
        true,
      );
    }
  }

  const incomeValue = financialInfo['monthlyIncome'];
  if (
    checkRequiredNumber(
      errors,
      'financialInfo.monthlyIncome',
      incomeValue,
      rules.financialInfo.monthlyIncome.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'financialInfo.monthlyIncome',
      incomeValue,
      rules.financialInfo.monthlyIncome.min,
      LOCAL_VALIDATION_DEFAULTS.monthlyIncomeMax,
      rules.financialInfo.monthlyIncome.errorMessage,
    );
  }

  const expensesValue = financialInfo['monthlyExpenses'];
  if (
    checkRequiredNumber(
      errors,
      'financialInfo.monthlyExpenses',
      expensesValue,
      rules.financialInfo.monthlyExpenses.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'financialInfo.monthlyExpenses',
      expensesValue,
      rules.financialInfo.monthlyExpenses.min,
      LOCAL_VALIDATION_DEFAULTS.monthlyExpensesMax,
      rules.financialInfo.monthlyExpenses.errorMessage,
    );
  }

  const debtValue = financialInfo['existingDebt'];
  if (
    checkRequiredNumber(
      errors,
      'financialInfo.existingDebt',
      debtValue,
      LOCAL_VALIDATION_DEFAULTS.existingDebt.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'financialInfo.existingDebt',
      debtValue,
      LOCAL_VALIDATION_DEFAULTS.existingDebt.min,
      LOCAL_VALIDATION_DEFAULTS.existingDebt.max,
      LOCAL_VALIDATION_DEFAULTS.existingDebt.errorMessage,
    );
  }

  const scoreValue = financialInfo['creditScore'];
  if (scoreValue !== undefined && scoreValue !== null) {
    if (!isFiniteNumber(scoreValue)) {
      addError(
        errors,
        'financialInfo.creditScore',
        rules.financialInfo.creditScore.errorMessage,
      );
    } else {
      checkRange(
        errors,
        'financialInfo.creditScore',
        scoreValue,
        rules.financialInfo.creditScore.min,
        rules.financialInfo.creditScore.max,
        rules.financialInfo.creditScore.errorMessage,
        true,
      );
    }
  }

  const amountValue = loanDetails['requestedAmount'];
  if (
    checkRequiredNumber(
      errors,
      'loanDetails.requestedAmount',
      amountValue,
      rules.loanDetails.requestedAmount.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'loanDetails.requestedAmount',
      amountValue,
      rules.loanDetails.requestedAmount.min,
      rules.loanDetails.requestedAmount.max,
      rules.loanDetails.requestedAmount.errorMessage,
    );
  }

  const termValue = loanDetails['loanTerm'];
  if (
    checkRequiredNumber(
      errors,
      'loanDetails.loanTerm',
      termValue,
      rules.loanDetails.loanTerm.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'loanDetails.loanTerm',
      termValue,
      rules.loanDetails.loanTerm.min,
      rules.loanDetails.loanTerm.max,
      rules.loanDetails.loanTerm.errorMessage,
      true,
    );
  }

  const purposeValue = loanDetails['loanPurpose'];
  if (purposeValue === undefined || purposeValue === null) {
    addError(
      errors,
      'loanDetails.loanPurpose',
      LOCAL_VALIDATION_DEFAULTS.loanPurpose.errorMessage,
    );
  } else if (
    typeof purposeValue !== 'string' ||
    !LOCAL_VALIDATION_DEFAULTS.personalLoanPurposes.includes(
      purposeValue as (typeof LOCAL_VALIDATION_DEFAULTS.personalLoanPurposes)[number],
    )
  ) {
    addError(
      errors,
      'loanDetails.loanPurpose',
      LOCAL_VALIDATION_DEFAULTS.loanPurpose.errorMessage,
    );
  }

  if (Object.keys(errors).length > 0) {
    return failure(errors);
  }

  const request: EligibilityRequest = {
    personalInfo: {
      age: ageValue as number,
      employmentStatus: statusValue as EmploymentStatus,
      ...(durationRequired
        ? { employmentDuration: durationValue as number }
        : {}),
    },
    financialInfo: {
      monthlyIncome: incomeValue as number,
      monthlyExpenses: expensesValue as number,
      existingDebt: debtValue as number,
      ...(isFiniteNumber(scoreValue) ? { creditScore: scoreValue } : {}),
    },
    loanDetails: {
      requestedAmount: amountValue as number,
      loanTerm: termValue as number,
      loanPurpose:
        purposeValue as EligibilityRequest['loanDetails']['loanPurpose'],
    },
  };

  return { ok: true, value: request };
}

export function validateCalculateRateRequest(
  body: unknown,
): ValidationResult<CalculateRateRequest> {
  const errors: FieldErrorMap = {};
  const rules = VALIDATION_RULES_RESPONSE;

  if (!isRecord(body)) {
    addError(errors, 'body', 'Request body must be an object');
    return failure(errors);
  }

  const amountValue = body['loanAmount'];
  if (
    checkRequiredNumber(
      errors,
      'loanAmount',
      amountValue,
      rules.loanDetails.requestedAmount.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'loanAmount',
      amountValue,
      PERSONAL_LOAN_PRODUCT.minAmount,
      PERSONAL_LOAN_PRODUCT.maxAmount,
      rules.loanDetails.requestedAmount.errorMessage,
    );
  }

  const termValue = body['loanTerm'];
  if (
    checkRequiredNumber(
      errors,
      'loanTerm',
      termValue,
      rules.loanDetails.loanTerm.errorMessage,
    )
  ) {
    checkRange(
      errors,
      'loanTerm',
      termValue,
      PERSONAL_LOAN_PRODUCT.minTerm,
      PERSONAL_LOAN_PRODUCT.maxTerm,
      rules.loanDetails.loanTerm.errorMessage,
      true,
    );
  }

  const scoreValue = body['creditScore'];
  if (scoreValue !== undefined && scoreValue !== null) {
    if (!isFiniteNumber(scoreValue)) {
      addError(
        errors,
        'creditScore',
        rules.financialInfo.creditScore.errorMessage,
      );
    } else {
      checkRange(
        errors,
        'creditScore',
        scoreValue,
        rules.financialInfo.creditScore.min,
        rules.financialInfo.creditScore.max,
        rules.financialInfo.creditScore.errorMessage,
        true,
      );
    }
  }

  const typeValue = body['loanType'];
  if (typeValue !== PERSONAL_LOAN_ID) {
    addError(errors, 'loanType', 'Only personal_loan is supported');
  }

  if (Object.keys(errors).length > 0) {
    return failure(errors);
  }

  const request: CalculateRateRequest = {
    loanAmount: amountValue as number,
    loanTerm: termValue as number,
    loanType: typeValue as LoanType,
    ...(isFiniteNumber(scoreValue) ? { creditScore: scoreValue } : {}),
  };

  return { ok: true, value: request };
}

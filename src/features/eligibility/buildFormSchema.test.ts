import { describe, expect, it } from 'vitest';
import { SPEC_SAMPLE_REQUEST, VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import {
  buildEligibilityFormSchema,
  type EligibilityFormRules,
  buildFormFieldMeta,
  formFieldErrors,
  parseNumericInput,
} from './buildFormSchema';
import {
  eligibilityFormValuesFromRequest,
  emptyEligibilityFormValues,
  FORM_VALIDATION_DEFAULTS,
} from './formDefaults';

function errorsOf(rules: EligibilityFormRules, values: unknown) {
  const result = buildEligibilityFormSchema(rules).safeParse(values);

  if (result.success) {
    return {};
  }

  return formFieldErrors(result.error);
}

describe('parseNumericInput', () => {
  it('treats blank text as missing and keeps 0', () => {
    expect(parseNumericInput('')).toBeUndefined();
    expect(parseNumericInput('   ')).toBeUndefined();
    expect(parseNumericInput(undefined)).toBeUndefined();
    expect(parseNumericInput(0)).toBe(0);
    expect(parseNumericInput('0')).toBe(0);
  });

  it('accepts spaced thousands and a decimal comma', () => {
    expect(parseNumericInput('25 000')).toBe(25_000);
    expect(parseNumericInput('15000,50')).toBe(15000.5);
  });
});

describe('buildEligibilityFormSchema', () => {
  it('accepts the spec sample typed as form strings', () => {
    const schema = buildEligibilityFormSchema(VALIDATION_RULES_RESPONSE);
    const result = schema.safeParse(
      eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(SPEC_SAMPLE_REQUEST);
    }
  });

  it('uses the validation-rules messages and bounds, not hardcoded ages', () => {
    const customRules: EligibilityFormRules = {
      ...VALIDATION_RULES_RESPONSE,
      personalInfo: {
        ...VALIDATION_RULES_RESPONSE.personalInfo,
        age: {
          min: 21,
          max: 40,
          required: true,
          errorMessage: 'Age must be between 21 and 40',
        },
      },
    };
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);

    expect(
      errorsOf(customRules, {
        ...values,
        personalInfo: { ...values.personalInfo, age: '20' },
      }),
    ).toEqual({
      'personalInfo.age': 'Age must be between 21 and 40',
    });
    expect(
      errorsOf(VALIDATION_RULES_RESPONSE, {
        ...values,
        personalInfo: { ...values.personalInfo, age: '20' },
      }),
    ).toEqual({});
  });

  it('requires employment duration only for employed and self-employed (SI-3)', () => {
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);
    const employed = errorsOf(VALIDATION_RULES_RESPONSE, {
      ...values,
      personalInfo: {
        ...values.personalInfo,
        employmentStatus: 'employed',
        employmentDuration: '',
      },
    });
    const unemployed = buildEligibilityFormSchema(
      VALIDATION_RULES_RESPONSE,
    ).safeParse({
      ...values,
      personalInfo: {
        ...values.personalInfo,
        employmentStatus: 'unemployed',
        employmentDuration: '99',
      },
    });

    expect(employed['personalInfo.employmentDuration']).toBe(
      VALIDATION_RULES_RESPONSE.personalInfo.employmentDuration.errorMessage,
    );
    expect(unemployed.success).toBe(true);
    if (unemployed.success) {
      expect(unemployed.data.personalInfo.employmentDuration).toBeUndefined();
    }
  });

  it('omits a blank credit score and never treats it as 0 (SI-8)', () => {
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);
    const schema = buildEligibilityFormSchema(VALIDATION_RULES_RESPONSE);
    const blank = schema.safeParse({
      ...values,
      financialInfo: { ...values.financialInfo, creditScore: '' },
    });
    const zero = errorsOf(VALIDATION_RULES_RESPONSE, {
      ...values,
      financialInfo: { ...values.financialInfo, creditScore: '0' },
    });

    expect(blank.success).toBe(true);
    if (blank.success) {
      expect('creditScore' in blank.data.financialInfo).toBe(false);
    }

    expect(zero['financialInfo.creditScore']).toBe(
      VALIDATION_RULES_RESPONSE.financialInfo.creditScore.errorMessage,
    );
  });

  it('validates existing debt and purpose from local defaults (SI-9)', () => {
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);
    const missingDebt = errorsOf(VALIDATION_RULES_RESPONSE, {
      ...values,
      financialInfo: { ...values.financialInfo, existingDebt: '' },
    });
    const zeroDebt = buildEligibilityFormSchema(
      VALIDATION_RULES_RESPONSE,
    ).safeParse({
      ...values,
      financialInfo: { ...values.financialInfo, existingDebt: '0' },
    });
    const badPurpose = errorsOf(VALIDATION_RULES_RESPONSE, {
      ...values,
      loanDetails: { ...values.loanDetails, loanPurpose: 'new_vehicle' },
    });

    expect(missingDebt['financialInfo.existingDebt']).toBe(
      FORM_VALIDATION_DEFAULTS.existingDebt.errorMessage,
    );
    expect(zeroDebt.success).toBe(true);
    expect(badPurpose['loanDetails.loanPurpose']).toBe(
      FORM_VALIDATION_DEFAULTS.loanPurpose.errorMessage,
    );
  });

  it('applies local upper bounds when the API omits a max', () => {
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);
    const tooMuchIncome = errorsOf(VALIDATION_RULES_RESPONSE, {
      ...values,
      financialInfo: {
        ...values.financialInfo,
        monthlyIncome: String(FORM_VALIDATION_DEFAULTS.monthlyIncomeMax + 1),
      },
    });

    expect(tooMuchIncome['financialInfo.monthlyIncome']).toBe(
      VALIDATION_RULES_RESPONSE.financialInfo.monthlyIncome.errorMessage,
    );
  });

  it('rejects an empty form with the API required-field messages', () => {
    const errors = errorsOf(
      VALIDATION_RULES_RESPONSE,
      emptyEligibilityFormValues(),
    );

    expect(errors['personalInfo.age']).toBe(
      VALIDATION_RULES_RESPONSE.personalInfo.age.errorMessage,
    );
    expect(errors['personalInfo.employmentStatus']).toBe(
      VALIDATION_RULES_RESPONSE.personalInfo.employmentStatus.errorMessage,
    );
    expect(errors['financialInfo.monthlyIncome']).toBe(
      VALIDATION_RULES_RESPONSE.financialInfo.monthlyIncome.errorMessage,
    );
    expect(errors['loanDetails.requestedAmount']).toBe(
      VALIDATION_RULES_RESPONSE.loanDetails.requestedAmount.errorMessage,
    );
  });
});

describe('buildFormFieldMeta', () => {
  it('exposes API bounds plus local defaults for omitted fields', () => {
    const meta = buildFormFieldMeta(VALIDATION_RULES_RESPONSE);

    expect(meta.personalInfo.age).toMatchObject({ min: 18, max: 65 });
    expect(meta.financialInfo.existingDebt).toEqual(
      FORM_VALIDATION_DEFAULTS.existingDebt,
    );
    expect(meta.financialInfo.monthlyIncome.max).toBe(
      FORM_VALIDATION_DEFAULTS.monthlyIncomeMax,
    );
    expect(meta.loanDetails.loanPurpose.options).toEqual(
      FORM_VALIDATION_DEFAULTS.loanPurpose.options,
    );
  });
});

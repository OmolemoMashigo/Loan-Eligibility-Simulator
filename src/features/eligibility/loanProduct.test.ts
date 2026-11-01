import { describe, expect, it } from 'vitest';
import { PRODUCTS_RESPONSE } from '@/mocks/fixtures/products';
import { VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { buildEligibilityFormSchema, formFieldErrors } from './buildFormSchema';
import {
  eligibilityFormValuesFromRequest,
  FORM_VALIDATION_DEFAULTS,
} from './formDefaults';
import {
  applyProductToDefaults,
  applyProductToRules,
  selectPersonalLoanProduct,
} from './loanProduct';
import { SPEC_SAMPLE_REQUEST } from '@/mocks/engine';

const personalLoan = selectPersonalLoanProduct(PRODUCTS_RESPONSE.products);

function requirePersonalLoan() {
  if (!personalLoan) {
    throw new Error('Personal loan product missing from the fixture');
  }

  return personalLoan;
}

describe('selectPersonalLoanProduct', () => {
  it('picks the personal loan and ignores vehicle finance (SI-1)', () => {
    expect(personalLoan).toMatchObject({
      id: 'personal_loan',
      name: 'Personal Loan',
    });
    expect(
      selectPersonalLoanProduct(
        PRODUCTS_RESPONSE.products.filter((p) => p.id === 'vehicle_loan'),
      ),
    ).toBeUndefined();
  });
});

describe('applyProductToRules', () => {
  it('keeps the rule messages and takes the stricter bound', () => {
    const product = {
      ...requirePersonalLoan(),
      minAmount: 10_000,
      maxTerm: 48,
    };
    const rules = applyProductToRules(VALIDATION_RULES_RESPONSE, product);

    expect(rules.loanDetails.requestedAmount).toMatchObject({
      min: 10_000,
      max: 300_000,
      errorMessage:
        VALIDATION_RULES_RESPONSE.loanDetails.requestedAmount.errorMessage,
    });
    expect(rules.loanDetails.loanTerm).toMatchObject({ min: 6, max: 48 });
  });

  it('does not loosen a bound the rules already set tighter', () => {
    const product = requirePersonalLoan();
    const rules = applyProductToRules(
      {
        ...VALIDATION_RULES_RESPONSE,
        loanDetails: {
          ...VALIDATION_RULES_RESPONSE.loanDetails,
          requestedAmount: {
            min: 20_000,
            max: 100_000,
            required: true,
            errorMessage: 'Between R20,000 and R100,000',
          },
        },
      },
      product,
    );

    expect(rules.loanDetails.requestedAmount).toMatchObject({
      min: 20_000,
      max: 100_000,
    });
  });
});

describe('applyProductToDefaults', () => {
  it('takes purposes from the product and rejects vehicle purposes', () => {
    const product = requirePersonalLoan();
    const defaults = applyProductToDefaults(product);
    const schema = buildEligibilityFormSchema(
      VALIDATION_RULES_RESPONSE,
      defaults,
    );
    const values = eligibilityFormValuesFromRequest(SPEC_SAMPLE_REQUEST);
    const result = schema.safeParse({
      ...values,
      loanDetails: { ...values.loanDetails, loanPurpose: 'new_vehicle' },
    });

    expect(defaults.loanPurpose.options).toEqual(product.purposes);
    expect(defaults.existingDebt).toEqual(
      FORM_VALIDATION_DEFAULTS.existingDebt,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formFieldErrors(result.error)['loanDetails.loanPurpose']).toBe(
        FORM_VALIDATION_DEFAULTS.loanPurpose.errorMessage,
      );
    }
  });
});

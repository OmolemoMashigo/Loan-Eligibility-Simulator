import { describe, expect, it } from 'vitest';
import { SPEC_SAMPLE_REQUEST, VALIDATION_RULES_RESPONSE } from '@/mocks/engine';
import { buildEligibilityFormSchema } from './buildFormSchema';
import { parseWhatIf, sameLoan } from './whatIf';

const schema = buildEligibilityFormSchema(VALIDATION_RULES_RESPONSE);

describe('parseWhatIf', () => {
  it('changes only the amount and the term of the request', () => {
    const result = parseWhatIf(schema, SPEC_SAMPLE_REQUEST, {
      amount: '80 000',
      term: '36',
    });

    expect(result).toEqual({
      ok: true,
      request: {
        ...SPEC_SAMPLE_REQUEST,
        loanDetails: {
          ...SPEC_SAMPLE_REQUEST.loanDetails,
          requestedAmount: 80_000,
          loanTerm: 36,
        },
      },
    });
  });

  it('uses the validation-rules message for an amount out of range', () => {
    const result = parseWhatIf(schema, SPEC_SAMPLE_REQUEST, {
      amount: '1000',
      term: '24',
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        amount:
          VALIDATION_RULES_RESPONSE.loanDetails.requestedAmount.errorMessage,
        term: undefined,
      },
    });
  });

  it('rejects a blank amount and a term that is not a whole number', () => {
    const result = parseWhatIf(schema, SPEC_SAMPLE_REQUEST, {
      amount: '',
      term: '12.5',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBeDefined();
      expect(result.errors.term).toBe(
        VALIDATION_RULES_RESPONSE.loanDetails.loanTerm.errorMessage,
      );
    }
  });
});

describe('sameLoan', () => {
  it('compares the amount and term only', () => {
    const changedPurpose = {
      ...SPEC_SAMPLE_REQUEST,
      loanDetails: {
        ...SPEC_SAMPLE_REQUEST.loanDetails,
        loanPurpose: 'education' as const,
      },
    };
    const changedTerm = {
      ...SPEC_SAMPLE_REQUEST,
      loanDetails: { ...SPEC_SAMPLE_REQUEST.loanDetails, loanTerm: 12 },
    };

    expect(sameLoan(SPEC_SAMPLE_REQUEST, changedPurpose)).toBe(true);
    expect(sameLoan(SPEC_SAMPLE_REQUEST, changedTerm)).toBe(false);
  });
});

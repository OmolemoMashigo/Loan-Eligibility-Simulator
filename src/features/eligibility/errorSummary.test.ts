import { describe, expect, it } from 'vitest';
import {
  isFormFieldPath,
  summariseFieldMessages,
  summariseFormErrors,
} from './errorSummary';

describe('summariseFormErrors', () => {
  it('lists nested form errors in form order with field labels', () => {
    const items = summariseFormErrors({
      loanDetails: {
        loanTerm: { type: 'custom', message: 'Term is wrong' },
      },
      personalInfo: {
        age: { type: 'custom', message: 'Age is wrong' },
      },
      financialInfo: {
        creditScore: { type: 'custom', message: 'Score is wrong' },
      },
    });

    expect(items).toEqual([
      { path: 'personalInfo.age', label: 'Age', message: 'Age is wrong' },
      {
        path: 'financialInfo.creditScore',
        label: 'Credit score',
        message: 'Score is wrong',
      },
      {
        path: 'loanDetails.loanTerm',
        label: 'Repayment period',
        message: 'Term is wrong',
      },
    ]);
  });

  it('returns nothing when there are no errors', () => {
    expect(summariseFormErrors({})).toEqual([]);
  });
});

describe('summariseFieldMessages', () => {
  it('drops paths that are not form fields', () => {
    const items = summariseFieldMessages({
      body: 'Request body must be an object',
      'personalInfo.age': 'Age is wrong',
    });

    expect(items.map((item) => item.path)).toEqual(['personalInfo.age']);
    expect(isFormFieldPath('body')).toBe(false);
    expect(isFormFieldPath('personalInfo.age')).toBe(true);
  });
});

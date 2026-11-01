import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AffordabilityBreakdown } from './AffordabilityBreakdown';

function valueOf(label: string): string {
  const row = screen.getByText(label).parentElement;

  return row?.querySelector('dd')?.textContent ?? '';
}

function hintOf(label: string): string {
  const row = screen.getByText(label).parentElement;

  return row?.querySelectorAll('dd')[1]?.textContent ?? '';
}

describe('AffordabilityBreakdown', () => {
  afterEach(cleanup);

  it('labels each figure and shows its value', () => {
    render(
      <AffordabilityBreakdown
        analysis={{
          disposableIncome: 10_000,
          debtToIncomeRatio: 20,
          loanToIncomeRatio: 50,
          affordabilityScore: 'good',
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your affordability' }),
    ).toBeVisible();
    expect(valueOf('Disposable income')).toMatch(/^R\s10\s000$/);
    expect(valueOf('Debt-to-income ratio')).toBe('20%');
    expect(valueOf('Loan-to-income ratio')).toBe('50%');
    expect(valueOf('Affordability rating')).toBe('Good');
  });

  it('explains every figure in plain language', () => {
    render(
      <AffordabilityBreakdown
        analysis={{
          disposableIncome: 10_000,
          debtToIncomeRatio: 20,
          loanToIncomeRatio: 50,
          affordabilityScore: 'good',
        }}
      />,
    );

    expect(hintOf('Disposable income')).toBe(
      'What is left each month after your expenses.',
    );
    expect(hintOf('Debt-to-income ratio')).toBe(
      'Your existing debt as a percentage of your monthly income.',
    );
    expect(hintOf('Loan-to-income ratio')).toBe(
      'The amount you asked for as a percentage of your yearly income.',
    );
    expect(hintOf('Affordability rating')).toMatch(/repayment/i);
  });

  it('shows decimals and a negative disposable income as they are', () => {
    render(
      <AffordabilityBreakdown
        analysis={{
          disposableIncome: -5_000,
          debtToIncomeRatio: 12.5,
          loanToIncomeRatio: 33.3,
          affordabilityScore: 'poor',
        }}
      />,
    );

    expect(valueOf('Disposable income')).toMatch(/^-R\s5\s000$/);
    expect(valueOf('Debt-to-income ratio')).toMatch(/^12[,.]5%$/);
    expect(valueOf('Loan-to-income ratio')).toMatch(/^33[,.]3%$/);
    expect(valueOf('Affordability rating')).toBe('Poor');
  });

  it('names every rating in words', () => {
    for (const [score, label] of [
      ['excellent', 'Excellent'],
      ['good', 'Good'],
      ['fair', 'Fair'],
      ['poor', 'Poor'],
    ] as const) {
      const { unmount } = render(
        <AffordabilityBreakdown
          analysis={{
            disposableIncome: 1,
            debtToIncomeRatio: 0,
            loanToIncomeRatio: 0,
            affordabilityScore: score,
          }}
        />,
      );

      expect(valueOf('Affordability rating')).toBe(label);
      unmount();
    }
  });
});

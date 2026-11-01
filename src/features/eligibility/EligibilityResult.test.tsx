import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { EligibilityResponse } from '@/api';
import { EligibilityResult } from './EligibilityResult';

const eligible: EligibilityResponse = {
  eligibilityResult: {
    isEligible: true,
    approvalLikelihood: 85,
    riskCategory: 'low',
    decisionReason:
      'Strong income-to-expense ratio and manageable existing debt',
  },
  recommendedLoan: {
    maxAmount: 180_000,
    recommendedAmount: 150_000,
    interestRate: 12.5,
    monthlyPayment: 7_089.5,
    totalRepayment: 170_148,
  },
  affordabilityAnalysis: {
    disposableIncome: 10_000,
    debtToIncomeRatio: 20,
    loanToIncomeRatio: 60,
    affordabilityScore: 'good',
  },
};

const declinedWithAnOption: EligibilityResponse = {
  ...eligible,
  eligibilityResult: {
    isEligible: false,
    approvalLikelihood: 32,
    riskCategory: 'high',
    decisionReason:
      'The monthly repayment would take more than 85% of your disposable income',
  },
  recommendedLoan: {
    maxAmount: 95_000,
    recommendedAmount: 95_000,
    interestRate: 14.5,
    monthlyPayment: 4_560.25,
    totalRepayment: 109_446,
  },
};

const declinedWithNothingAffordable: EligibilityResponse = {
  ...declinedWithAnOption,
  eligibilityResult: {
    ...declinedWithAnOption.eligibilityResult,
    decisionReason: 'Monthly expenses leave no income for a loan repayment',
  },
  recommendedLoan: {
    maxAmount: 0,
    recommendedAmount: 0,
    interestRate: 14.5,
    monthlyPayment: 0,
    totalRepayment: 0,
  },
};

function valueOf(label: string): string {
  const row = screen.getByText(label).parentElement;

  return row?.querySelector('dd')?.textContent ?? '';
}

describe('EligibilityResult', () => {
  afterEach(cleanup);

  it('announces an eligible result in a banner that takes focus', () => {
    render(<EligibilityResult response={eligible} loanTerm={24} />);

    const banner = screen.getByRole('status', {
      name: /you are likely eligible for this loan/i,
    });

    expect(banner).toHaveFocus();
    expect(banner).toHaveTextContent('Success:');
    expect(banner).toHaveTextContent(
      'Strong income-to-expense ratio and manageable existing debt',
    );
    expect(within(banner).getByText('Approval likelihood')).toBeVisible();
    expect(valueOf('Approval likelihood')).toBe('85%');
    expect(valueOf('Risk level')).toBe('Low');
  });

  it('shows the rand figures for the recommended loan', () => {
    render(<EligibilityResult response={eligible} loanTerm={24} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your estimate' }),
    ).toBeVisible();
    expect(valueOf('Recommended amount')).toMatch(/^R\s150\s000$/);
    expect(valueOf('Maximum affordable amount')).toMatch(/^R\s180\s000$/);
    expect(valueOf('Interest rate')).toMatch(/^12[,.]5% a year$/);
    expect(valueOf('Repayment period')).toBe('24 months = 2 years');
    expect(valueOf('Monthly repayment')).toMatch(/^R\s7\s090$/);
    expect(valueOf('Total repayment')).toMatch(/^R\s170\s148$/);
  });

  it('explains a decline with a warning, the reason, and what would fit', () => {
    render(<EligibilityResult response={declinedWithAnOption} loanTerm={24} />);

    const banner = screen.getByRole('status', {
      name: /you are unlikely to be eligible for this loan as requested/i,
    });

    expect(banner).toHaveFocus();
    expect(banner).toHaveTextContent('Warning:');
    expect(banner).toHaveTextContent(
      'The monthly repayment would take more than 85% of your disposable income',
    );
    expect(valueOf('Approval likelihood')).toBe('32%');
    expect(valueOf('Risk level')).toBe('High');
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What would fit your budget',
      }),
    ).toBeVisible();
    expect(valueOf('Recommended amount')).toMatch(/^R\s95\s000$/);
    expect(valueOf('Monthly repayment')).toMatch(/^R\s4\s560$/);
  });

  it('says so, with no R 0 figures, when no amount is affordable', () => {
    render(
      <EligibilityResult
        response={declinedWithNothingAffordable}
        loanTerm={12}
      />,
    );

    expect(
      screen.getByText(
        'We could not find a loan amount that fits your budget over this repayment period.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Recommended amount')).not.toBeInTheDocument();
    expect(screen.queryByText(/^R\s0$/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: /unlikely to be eligible/i }),
    ).toHaveTextContent(
      'Monthly expenses leave no income for a loan repayment',
    );
  });

  it('shows the affordability breakdown for eligible and declined results', () => {
    const { rerender } = render(
      <EligibilityResult response={eligible} loanTerm={24} />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your affordability' }),
    ).toBeVisible();
    expect(valueOf('Disposable income')).toMatch(/^R\s10\s000$/);
    expect(valueOf('Debt-to-income ratio')).toBe('20%');
    expect(valueOf('Loan-to-income ratio')).toBe('60%');
    expect(valueOf('Affordability rating')).toBe('Good');

    rerender(
      <EligibilityResult
        response={declinedWithNothingAffordable}
        loanTerm={12}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your affordability' }),
    ).toBeVisible();
    expect(valueOf('Disposable income')).toMatch(/^R\s10\s000$/);
  });

  it('names the result region for screen readers', () => {
    render(<EligibilityResult response={eligible} loanTerm={24} />);

    expect(
      screen.getByRole('region', { name: 'Eligibility result' }),
    ).toBeInTheDocument();
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BalanceChart } from './BalanceChart';
import { LikelihoodRing } from './LikelihoodRing';

describe('BalanceChart', () => {
  afterEach(cleanup);

  it('describes the whole story in words, for anyone who cannot see it', () => {
    render(<BalanceChart loanAmount={150_000} balances={[75_000, 0]} />);

    const chart = screen.getByRole('img', { name: /remaining balance/i });

    expect(chart).toHaveAccessibleName(
      /starts at R\s150\s000 and falls to R\s0 after 2 months/,
    );
  });

  it('draws the line and its end points', () => {
    const { container } = render(
      <BalanceChart loanAmount={1000} balances={[500, 0]} />,
    );

    expect(container.querySelector('path[d^="M0 8"]')).not.toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('shows its captions but leaves them out of the reading order', () => {
    render(<BalanceChart loanAmount={1000} balances={[500, 0]} />);

    expect(screen.getByText('Start').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByText('Month 2').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('draws nothing when there is nothing to show', () => {
    const { container } = render(<BalanceChart loanAmount={0} balances={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('LikelihoodRing', () => {
  afterEach(cleanup);

  it('is decorative and fills in proportion to the percentage', () => {
    const { container } = render(
      <LikelihoodRing percent={85} tone="success" />,
    );
    const ring = container.querySelector('svg');

    expect(ring).toHaveAttribute('aria-hidden', 'true');
    expect(ring?.style.getPropertyValue('--filled')).toBe('85');
  });

  it('never fills past the ends', () => {
    const { container, rerender } = render(
      <LikelihoodRing percent={140} tone="success" />,
    );

    expect(
      container.querySelector('svg')?.style.getPropertyValue('--filled'),
    ).toBe('100');

    rerender(<LikelihoodRing percent={-5} tone="warning" />);

    expect(
      container.querySelector('svg')?.style.getPropertyValue('--filled'),
    ).toBe('0');
  });
});

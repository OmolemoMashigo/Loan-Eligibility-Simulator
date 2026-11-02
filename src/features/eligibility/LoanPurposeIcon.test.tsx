import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PERSONAL_LOAN_PURPOSES } from '@/mocks/engine/config';
import { LoanPurposeIcon } from './LoanPurposeIcon';

function drawing(purpose: string): string {
  const { container } = render(<LoanPurposeIcon purpose={purpose} />);

  return container.querySelector('svg')?.innerHTML ?? '';
}

describe('LoanPurposeIcon', () => {
  afterEach(cleanup);

  it('draws an icon for every loan purpose the API offers', () => {
    for (const purpose of PERSONAL_LOAN_PURPOSES) {
      expect(drawing(purpose), purpose).not.toBe('');
      cleanup();
    }
  });

  it('gives the named purposes different pictures', () => {
    const named = [
      'debt_consolidation',
      'home_improvement',
      'education',
      'medical',
    ].map((purpose) => {
      const picture = drawing(purpose);
      cleanup();

      return picture;
    });

    expect(new Set(named).size).toBe(named.length);
  });

  it('falls back to a generic icon for a purpose it does not know', () => {
    expect(drawing('something_new')).toBe(drawing('other'));
  });
});

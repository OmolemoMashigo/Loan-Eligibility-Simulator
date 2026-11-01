import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '@/App';
import { renderWithProviders } from '@/test/renderWithProviders';

afterEach(cleanup);

describe('page layout', () => {
  it('offers a skip link that points at the main landmark', () => {
    renderWithProviders(<App />);

    const skip = screen.getByRole('link', { name: /skip to main content/i });
    const main = screen.getByRole('main');

    expect(skip).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('keeps the estimate disclaimer in the main content', () => {
    renderWithProviders(<App />);

    const disclaimer = screen.getByRole('note', {
      name: /estimate disclaimer/i,
    });

    expect(disclaimer).toHaveTextContent(/estimate, not a credit offer/i);
    expect(disclaimer).toHaveTextContent(/nothing you enter is stored/i);
    expect(screen.getByRole('main')).toContainElement(disclaimer);
  });

  it('does not keep the sample form gallery', () => {
    renderWithProviders(<App />);

    expect(
      screen.queryByRole('form', { name: /sample form controls/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /crash the preview/i }),
    ).not.toBeInTheDocument();
  });
});

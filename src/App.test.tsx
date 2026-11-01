import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { App } from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the product name in the header', () => {
    renderWithProviders(<App />);

    expect(
      screen.getByRole('heading', { name: /loan eligibility simulator/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

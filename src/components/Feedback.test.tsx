import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert/Alert';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
import { LoadingBlock } from './LoadingBlock/LoadingBlock';
import { Spinner } from './Spinner/Spinner';

afterEach(cleanup);

describe('Alert', () => {
  it('uses icon and text, not colour alone', () => {
    const { container } = render(
      <Alert tone="success" title="Eligible" live="off">
        <p>This is an estimate, not a credit offer.</p>
      </Alert>,
    );

    expect(
      screen.getByRole('region', { name: /eligible/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });

  it('announces a danger alert assertively', () => {
    render(<Alert tone="danger" title="Not eligible" />);

    expect(
      screen.getByRole('alert', { name: /not eligible/i }),
    ).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('Spinner', () => {
  it('exposes a loading status', () => {
    render(<Spinner label="Loading products" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });
});

describe('LoadingBlock', () => {
  it('shows a busy status with visible text', () => {
    render(<LoadingBlock label="Checking eligibility" />);

    const status = screen.getByRole('status', {
      name: 'Checking eligibility',
    });
    expect(status).toHaveAttribute('aria-busy', 'true');
  });
});

describe('ErrorBoundary', () => {
  it('recovers after a render crash', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashOnDemand />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: /crash/i }));

    expect(
      screen.getByRole('alert', { name: /something went wrong/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByRole('button', { name: /crash/i })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});

function CrashOnDemand() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('test crash');
  }

  return (
    <button type="button" onClick={() => setShouldCrash(true)}>
      Crash
    </button>
  );
}

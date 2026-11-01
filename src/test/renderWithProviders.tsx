import { render, type RenderOptions } from '@testing-library/react';
import { type ReactNode } from 'react';
import { createQueryClient } from '@/api/queryClient';
import { AppProviders } from '@/app/providers';

export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createQueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(ui, {
      ...options,
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      ),
    }),
  };
}

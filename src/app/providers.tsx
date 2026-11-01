import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createQueryClient } from '@/api/queryClient';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

type AppProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [defaultClient] = useState(() => createQueryClient());
  const client = queryClient ?? defaultClient;

  return (
    <QueryClientProvider client={client}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </QueryClientProvider>
  );
}

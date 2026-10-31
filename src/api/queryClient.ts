import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { isApiError } from './errors';

export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config.defaultOptions,
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        ...config.defaultOptions?.queries,
      },
      mutations: {
        retry: false,
        ...config.defaultOptions?.mutations,
      },
    },
  });
}

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (isApiError(error) && error.kind !== 'network') {
    return false;
  }

  return failureCount < 1;
}

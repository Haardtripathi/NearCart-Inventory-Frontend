import { QueryClient } from '@tanstack/react-query'

import { parseApiError } from './utils'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        const { statusCode } = parseApiError(error)

        if (statusCode && statusCode >= 400 && statusCode < 500) {
          return false
        }

        return failureCount < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

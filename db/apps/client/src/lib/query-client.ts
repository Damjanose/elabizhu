import { QueryClient } from "@tanstack/react-query"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { isPersistedQueryKey } from "./query-keys"

const ONE_MINUTE = 60_000
const FIVE_MINUTES = 5 * ONE_MINUTE
const FIFTEEN_MINUTES = 15 * ONE_MINUTE
const ONE_DAY = 24 * 60 * ONE_MINUTE

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: ONE_DAY,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const queryPersister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "aurelia-rq",
})

export const persistQueryClientOptions = {
  persister: queryPersister,
  maxAge: ONE_DAY,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      isPersistedQueryKey(query.queryKey),
  },
} as const

export const queryTiming = {
  catalogueStaleTime: FIFTEEN_MINUTES,
  sessionStaleTime: ONE_MINUTE,
} as const

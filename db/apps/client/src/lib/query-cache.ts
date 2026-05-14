import type { QueryClient } from "@tanstack/react-query"
import { PRIVATE_QUERY_ROOTS } from "./query-keys"

export const clearPrivateQueryCache = (client: QueryClient) => {
  for (const root of PRIVATE_QUERY_ROOTS) {
    client.removeQueries({ queryKey: [root] })
  }
}

export const invalidateAuthenticatedQueryCache = async (client: QueryClient) => {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["cart"] }),
    client.invalidateQueries({ queryKey: ["orders"] }),
    client.invalidateQueries({ queryKey: ["notifications"] }),
    client.invalidateQueries({ queryKey: ["me"] }),
    client.invalidateQueries({ queryKey: ["account"] }),
  ])
}

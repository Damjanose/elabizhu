type QueryLoadInput = {
  isPending: boolean
  isFetching: boolean
  data: unknown
}

export const useQueryLoadState = ({ isPending, isFetching, data }: QueryLoadInput) => ({
  showSkeleton: isPending && data === undefined,
  isRefreshing: isFetching && data !== undefined,
})

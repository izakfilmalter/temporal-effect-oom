import type { Schema } from 'effect'

export type GetTotalPages<D> = (data: D) => number

export type GetCurrentPageQuery<D, Q> = (params: {
  response: D
  querySchema: Schema.Schema<Q, Q>
}) => Q

export type MakePageQuery<D, Q> = (params: {
  data: D
  baseQuery: Q
  page: number
}) => Q

export type MakePageQueryNew<Q> = (params: {
  count: number
  baseQuery: Q
  page: number
}) => Q

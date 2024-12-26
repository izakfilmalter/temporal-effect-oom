import { Array, Effect, Number, Option, pipe } from 'effect'

import type { MakePageQueryNew } from '@if/workers/helpers/api/importerTypes'

export const getQueryChunksE = <Q, P>(
  params:
    | {
        passedQueryChunksOpt: Option.Option<ReadonlyArray<ReadonlyArray<Q>>>
        getAndSave: (params: { query?: Q }) => Effect.Effect<
          {
            query: Q
            pagination: {
              totalCount: number
              count: number
            }
            ids: ReadonlyArray<string>
          },
          unknown,
          never
        >
        makePageQuery: MakePageQueryNew<Q>
        params?: P
      }
    | {
        passedQueryChunksOpt: Option.Option<ReadonlyArray<ReadonlyArray<Q>>>
        getAndSave: (params: { query?: Q; params: P }) => Effect.Effect<
          {
            query: Q
            pagination: {
              totalCount: number
              count: number
            }
            ids: ReadonlyArray<string>
          },
          unknown,
          never
        >
        makePageQuery: MakePageQueryNew<Q>
        params?: P
      },
): Effect.Effect<ReadonlyArray<ReadonlyArray<Q>>, unknown, never> => {
  const { passedQueryChunksOpt, getAndSave, makePageQuery, ...rest } = params

  return pipe(
    passedQueryChunksOpt,
    Option.match({
      // 4. Get data from API.
      onNone: () =>
        pipe(
          // 4b1. Get the first page of data.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          getAndSave(rest),
          // Save the first page of data so we can ignore it later on.
          Effect.map((y) => {
            // 4b2. Calculate the total pages of data.

            const totalPages = pipe(
              Number.divide(y.pagination.totalCount, y.pagination.count),
              Option.getOrElse(() => 0),
              Math.ceil,
            )

            // 4b4. Create queries for each page of data.
            return pipe(
              Array.makeBy(totalPages, (i) =>
                makePageQuery({
                  count: y.pagination.count,
                  baseQuery: y.query,
                  page: i,
                }),
              ),
              Array.tail,
              Option.getOrElse(() => []),
              Array.chunksOf(10),
            )
          }),
        ),
      onSome: (x) => Effect.succeed(x),
    }),
  )
}

import type { ClientError } from '@steepleinc/effect-http'
import { Array, Effect, pipe } from 'effect'
import type { UnknownException } from 'effect/Cause'

import type { APICollection } from '@if/api-client'
import { apiReturn } from '@if/workers/helpers/api/handleAPIErrors'

export const apiGetAndSaveCache = async <Q, D extends APICollection, P>(
  params:
    | {
        query: Q
        path: P
        get: (params: {
          path: P
          query: Q
        }) => Effect.Effect<D, ClientError.ClientError, never>
      }
    | {
        query: Q
        get: (params: {
          query: Q
        }) => Effect.Effect<D, ClientError.ClientError, never>
      },
) => {
  const { query, get, ...rest } = params

  const resultE = await Effect.runPromiseExit(
    pipe(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      get({
        query,
        ...rest,
      }),
      Effect.map((x) => ({
        query,
        pagination: {
          totalCount: x.meta.total_count,
          count: x.meta.count,
        },
        ids: pipe(
          x.data,
          Array.map((y) => y.id),
        ),
      })),
    ),
  )

  return apiReturn({
    exit: resultE,
    defaultError: `Failed to get API.`,
    extra: {
      query,
      ...rest,
    },
  })
}

export const apiGetAndSaveDb = async <Q, D extends APICollection, P>(
  params:
    | {
        query: Q
        path: P
        get: (params: {
          path: P
          query: Q
        }) => Effect.Effect<D, ClientError.ClientError, never>
        save: (
          response: D,
        ) => Effect.Effect<Array<void>, UnknownException, never>
      }
    | {
        query: Q
        resourceType: string
        get: (params: {
          query: Q
        }) => Effect.Effect<D, ClientError.ClientError, never>
        save: (
          response: D,
        ) => Effect.Effect<Array<void>, UnknownException, never>
      },
) => {
  const { query, get, save, ...rest } = params

  const resultE = await Effect.runPromiseExit(
    pipe(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      get({
        query,
        ...rest,
      }),
      Effect.tap(save),
      Effect.map((x) => ({
        query,
        pagination: {
          totalCount: x.meta.total_count,
          count: x.meta.count,
        },
        ids: pipe(
          x.data,
          Array.map((y) => y.id),
        ),
      })),
    ),
  )

  return apiReturn({
    exit: resultE,
    defaultError: `Failed to get API.`,
    extra: {
      query,
      ...rest,
    },
  })
}

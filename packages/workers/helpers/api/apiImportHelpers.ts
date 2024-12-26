// Check if we have a next page, if so parse it, so it can be passed to the

// repeat function.
import { log } from '@temporalio/workflow'
import { Array, Either, pipe, Schema, String } from 'effect'
import qs from 'qs'

import type { APICollection } from '@if/api-client'
import type {
  GetCurrentPageQuery,
  GetTotalPages,
  MakePageQuery,
  MakePageQueryNew,
} from '@if/workers/helpers/api/importerTypes'

export const getCurrentAPIPageQuery = <
  D extends APICollection,
  Q extends {
    per_page?: number
    offset?: number
  },
>(
  params: Parameters<GetCurrentPageQuery<D, Q>>[0],
): ReturnType<GetCurrentPageQuery<D, Q>> => {
  const { response, querySchema } = params

  return pipe(
    response.links.self,
    String.split('?'),
    Array.lastNonEmpty,
    // qs doesn't parse encoded commas. We need to de encode them.
    String.replaceAll('%2C', ','),
    (x) =>
      qs.parse(x, {
        comma: true,
        parseArrays: true,
        decoder: (
          str: string,
          defaultDecoder: qs.defaultDecoder,
          charset: string,
          type: 'key' | 'value',
        ) => {
          if (
            type === 'value' &&
            /^(?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/.test(
              str,
            )
          ) {
            return parseFloat(str)
          }

          const keywords = {
            true: true,
            false: false,
            null: null,
            undefined: undefined,
          }
          if (type === 'value' && str in keywords) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return keywords[str]
          }

          return defaultDecoder(str, defaultDecoder, charset)
        },
      }),

    Schema.decodeUnknownEither(querySchema),
    Either.match({
      onLeft: (z) => {
        log.info('apiImporterE parse error:', {
          parseError: z,
        })

        return {} as Q
      },
      onRight: (x) => x,
    }),
  )
}

export const getAPITotalPages = <D extends APICollection>(
  data: Parameters<GetTotalPages<D>>[0],
): ReturnType<GetTotalPages<D>> =>
  Math.ceil(data.meta.total_count / data.meta.count)

export const makeAPIPageQuery = <
  D extends APICollection,
  Q extends {
    per_page?: number
    offset?: number
  },
>(
  params: Parameters<MakePageQuery<D, Q>>[0],
): ReturnType<MakePageQuery<D, Q>> => {
  const { data, baseQuery, page } = params

  return {
    ...baseQuery,
    offset: page * data.meta.count,
    per_page: data.meta.count,
  }
}

export const makeAPIPageQueryNew = <
  Q extends {
    per_page?: number
    offset?: number
  },
>(
  params: Parameters<MakePageQueryNew<Q>>[0],
): ReturnType<MakePageQueryNew<Q>> => {
  const { count, baseQuery, page } = params

  return {
    ...baseQuery,
    offset: page * count,
    per_page: count,
  }
}

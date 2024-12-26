import { log } from '@temporalio/workflow'
import { Effect, Option, pipe } from 'effect'

import { makeAPIPageQueryNew } from '@if/workers/helpers/api/apiImportHelpers'
import { getAndSaveQueryChunksE } from '@if/workers/helpers/api/getAndSaveQueryChunksE'
import { getQueryChunksE } from '@if/workers/helpers/api/getQueryChunksE'

// Welcome to the land of hacks. This is a mega pipe like no other. Basically we
// want to get all of something from api, save it, and work around all the
// issues that come with temporal. We have a size limits of data that can be
// passed between the workflow and an activity, 4mb. We have a max of 2000
// concurrent incomplete Activities, Signals, Child Workflows, or external
// Workflow Cancellation requests.
// This code could get better. In the future we should look into Continue as
// New, but for now this will do.

// So what does the pipe actually do?
// We get the first page of data. This tells us how many pages of data there is.
// We then create queries for each page of data. This leads to a fork in the
// road. We need to create a new workflow for chunks of queries. This is due to
// the 4mb limit. Buttttt we just got a page of data, and we don't want to waste
// it. We spin off all the workflows for the remaining data and fetch n - 1
// chunks for the first run.
// The next set of workflows is going to call this same function again. But this
// time we have an array of queries passed in. Instead of fetching the first
// page, we will skip to the second half of the pipe and loop through our
// queries.
// Both of these branches reduce all their data into a single save functions.
// This allows us to reduce the db transaction errors.

export function apiImporterE<
  Q extends {
    per_page?: number
    offset?: number
  },
  P,
>(
  params:
    | {
        queryChunks?: ReadonlyArray<ReadonlyArray<Q>>
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
        repeat: (params: {
          args: [{ queryChunks: ReadonlyArray<ReadonlyArray<Q>> }]
        }) => Effect.Effect<unknown, unknown, never>
        afterAll?: () => Effect.Effect<unknown, unknown, never>
        onFail?: () => Effect.Effect<unknown, unknown, never>
      }
    | {
        // This is the optional query. When we want the next page of a resource,
        // it is passed in here as the query.
        queryChunks?: ReadonlyArray<ReadonlyArray<Q>>
        // These are the url params for the api we are hitting.
        params: P
        // This is the effect to get the data from the api.
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
        // This is the effect to run a new instance of the workflow when we
        // loop through the chunked queries.
        repeat: (params: {
          args: [
            {
              queryChunks: ReadonlyArray<ReadonlyArray<Q>>
              params: P
            },
          ]
        }) => Effect.Effect<unknown, unknown, never>
        // This is the effect to run when something in the importer fails.
        onFail?: () => Effect.Effect<unknown, unknown, never>
        // This is the effect to call after we have successfully synced all the
        // data.
        afterAll?: () => Effect.Effect<unknown, unknown, never>
      },
) {
  const {
    queryChunks: passedQueryChunks,
    getAndSave,
    afterAll = () => Effect.succeed(null),
    onFail = () => Effect.succeed(null),
    repeat,
    ...rest
  } = params

  const passedQueryChunksOpt = pipe(passedQueryChunks, Option.fromNullable)

  log.info(`Starting fetching`, {
    queryChunks: passedQueryChunks,
  })

  return pipe(
    pipe(
      // 4. Get chunks.
      getQueryChunksE({
        passedQueryChunksOpt,
        getAndSave,
        makePageQuery: makeAPIPageQueryNew,
        ...rest,
      }),

      // 5. Iterate through chunks, and run save. Kick off continueAsNew when
      // we get close to worker history limit.
      Effect.flatMap((y) =>
        getAndSaveQueryChunksE({
          queryChunks: y,
          getAndSave,
          repeat,
          ...rest,
        }),
      ),
    ),

    // 5. Run after all and update sync status. We only want this to run for the first one.
    Effect.flatMap(() =>
      pipe(
        passedQueryChunksOpt,
        Option.match({
          onNone: () => afterAll(),
          onSome: () => Effect.succeed(null),
        }),
      ),
    ),
    Effect.tapDefect(onFail),
    Effect.map(() => ({ result: 'success' as const })),
  )
}

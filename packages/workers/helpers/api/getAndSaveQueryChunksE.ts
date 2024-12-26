import { log, sleep, workflowInfo } from '@temporalio/workflow'
import { Array, Boolean, Effect, pipe } from 'effect'

export const getAndSaveQueryChunksE = <D, Q, P>(
  params:
    | {
        queryChunks: ReadonlyArray<ReadonlyArray<Q>>
        getAndSave: (params: { query?: Q }) => Effect.Effect<D, unknown, never>
        repeat: (params: {
          args: [{ queryChunks: ReadonlyArray<ReadonlyArray<Q>> }]
          workflowId?: string
        }) => Effect.Effect<unknown, unknown, never>
        params?: P
      }
    | {
        queryChunks: ReadonlyArray<ReadonlyArray<Q>>
        getAndSave: (params: {
          query?: Q
          params: P
        }) => Effect.Effect<D, unknown, never>
        repeat: (params: {
          args: [
            {
              queryChunks: ReadonlyArray<ReadonlyArray<Q>>
              params: P
            },
          ]
          workflowId?: string
        }) => Effect.Effect<unknown, unknown, never>
        params?: P
      },
) => {
  const { queryChunks, getAndSave, repeat, ...rest } = params

  return Effect.all(
    pipe(
      // 4b5. Fetch the first set of queries in the current
      // workflow.
      queryChunks,
      Array.map((x, i) =>
        pipe(
          Effect.sync(() => {
            const { historyLength, historySize, continueAsNewSuggested } =
              workflowInfo()

            console.log({
              historyLength,
              historySize,
              continueAsNewSuggested,
            })

            return {
              historyLength,
              historySize,
              continueAsNewSuggested,
            }
          }),
          Effect.flatMap(
            ({ historyLength, historySize, continueAsNewSuggested }) =>
              pipe(
                !continueAsNewSuggested,
                Boolean.match({
                  onFalse: () => {
                    const remainingQueryChunks = pipe(
                      queryChunks,
                      Array.takeRight(queryChunks.length - i),
                    )

                    log.info('Skipping remaining queries.', {
                      historyLength,
                      historySize,
                      continueAsNewSuggested,
                      remainingPages: pipe(
                        remainingQueryChunks,
                        Array.flatten,
                        Array.length,
                      ),
                    })

                    return pipe(
                      Effect.tryPromise(async () => await sleep(5 * 1000)),
                      Effect.flatMap(() =>
                        repeat({
                          args: [
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            {
                              queryChunks: remainingQueryChunks,
                              ...rest,
                            },
                          ],
                        }),
                      ),
                      Effect.flatMap(() => Effect.interrupt),
                    )
                  },
                  onTrue: () =>
                    pipe(
                      Effect.all(
                        pipe(
                          x,
                          Array.map((query) =>
                            pipe(
                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                              // @ts-ignore
                              getAndSave({
                                query,
                                ...rest,
                              }),
                              // ),
                              Effect.tap(() => {
                                log.info(`Finished saving.`, { query })
                              }),
                            ),
                          ),
                        ),
                        { concurrency: 'unbounded' },
                      ),
                    ),
                }),
              ),
          ),
        ),
      ),
    ),
  )
}

import { ApplicationFailure } from '@temporalio/workflow'
import { Effect, Either, Exit, Option, pipe, Record, Schema } from 'effect'

import { ErrorTypes } from '@if/workers/helpers/errors'

export const safeWorkflow =
  <I, IA, O, OA>(
    inputSchema: Schema.Schema<I, IA>,
    outputSchema: Schema.Schema<O, OA>,
    name: string,
  ) =>
  (workflow: (params: I) => Effect.Effect<O, unknown, never>) => {
    const workflowObj = {
      [name]: async (params: I) => {
        const resultE = await Effect.runPromiseExit(
          pipe(
            params,
            Schema.decodeUnknownEither(inputSchema),
            Either.match({
              onLeft: (x) => {
                throw ApplicationFailure.nonRetryable(
                  x.message,
                  ErrorTypes.Validation,
                  {
                    error: x,
                  },
                )
              },
              onRight: (x) =>
                pipe(
                  workflow(x),
                  Effect.flatMap((y) =>
                    pipe(
                      y,
                      Schema.decodeUnknownEither(outputSchema),
                      Either.match({
                        onLeft: (z) => {
                          throw ApplicationFailure.nonRetryable(
                            z.message,
                            ErrorTypes.Validation,
                            {
                              error: z,
                            },
                          )
                        },
                        onRight: (z) => Effect.succeed(z),
                      }),
                    ),
                  ),
                ),
            }),
          ),
        )

        // Temporal needs to be thrown an error for it to fail workflows. Here
        // we map through all the errors and pass them outside of effect to the
        // workflow.
        return pipe(
          resultE,
          Exit.match({
            onFailure: (cause) => {
              switch (cause._tag) {
                case 'Fail':
                  console.log(`Fail in safeWorkflow:`, cause)

                  // For some reason, child workflows have the error deeper than what we expect.
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  if (cause.error.error) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    throw cause.error.error
                  }

                  throw cause.error
                case 'Die':
                  console.log(`Die in safeWorkflow:`, cause)

                  throw cause.defect
                case 'Interrupt':
                  // This happens when we want to stop a workflow when deeply
                  // nested due to resource constraints around workflow history.
                  // We typically start a new one right before interrupting.
                  console.log(`Interrupt in safeWorkflow:`, cause)
                  return
                case 'Sequential':
                  console.log(`Sequential in safeWorkflow:`, cause)

                  throw ApplicationFailure.nonRetryable(
                    'Unknown error',
                    ErrorTypes.Sequential,
                    {
                      cause,
                    },
                  )
                case 'Parallel':
                  console.log(`Parallel in safeWorkflow:`, cause)

                  throw ApplicationFailure.nonRetryable(
                    'Unknown error',
                    ErrorTypes.Parallel,
                    {
                      cause,
                    },
                  )
                case 'Empty':
                  console.log(`Empty in safeWorkflow:`, cause)

                  throw ApplicationFailure.nonRetryable(
                    'Unknown error',
                    ErrorTypes.Empty,
                    {
                      cause,
                    },
                  )
              }
            },
            onSuccess: (x) => x,
          }),
        )
      },
    }

    return pipe(
      workflowObj,
      Record.get(name),
      // eslint-disable-next-line @typescript-eslint/require-await
      Option.getOrElse(() => async () => ({ result: 'success' })),
    )
  }

import type { Extras } from '@sentry/types'
import type { ClientError } from '@steepleinc/effect-http'
import { log } from '@temporalio/activity'
import { ApplicationFailure } from '@temporalio/workflow'
import { Cause, Exit, Number, Option, pipe } from 'effect'
import { UnknownException } from 'effect/Cause'

import { ErrorTypes } from '@if/workers/helpers/errors'

export const captureException = (error: unknown, extra?: Extras): void => {
  console.log(error)

  log.error('error', { ...extra, error })
  log.info('error', {
    ...extra,
    error,
  })
}

export const apiReturn = <T>(params: {
  exit: Exit.Exit<T, ClientError.ClientError | UnknownException>
  defaultError: string
  extra?: Extras
}) => {
  const { exit, defaultError, extra } = params

  return pipe(
    exit as Exit.Exit<T, ClientError.ClientErrorServerSide | UnknownException>,
    Exit.match({
      onFailure: (x) => {
        if (x instanceof UnknownException) {
          console.log('yeet throw UnknownException', x)

          throw ApplicationFailure.retryable(defaultError, ErrorTypes.Unknown, {
            error: x,
          })
        } else {
          console.log('yeet throw ClientError', x)

          throw pipe(
            x as Cause.Cause<ClientError.ClientErrorServerSide>,
            Cause.match<ApplicationFailure, ClientError.ClientErrorServerSide>({
              onEmpty: ApplicationFailure.nonRetryable(
                defaultError,
                ErrorTypes.Empty,
                {
                  error: 'Empty response',
                },
              ),
              onFail: (y) => handleAPIErrors({ error: y, extra, defaultError }),

              onDie: () =>
                ApplicationFailure.nonRetryable(defaultError, ErrorTypes.Die, {
                  error: 'Die',
                }),
              onInterrupt: () =>
                ApplicationFailure.nonRetryable(
                  defaultError,
                  ErrorTypes.Interrupt,
                  {
                    error: 'Interrupt',
                  },
                ),
              onSequential: () =>
                ApplicationFailure.nonRetryable(
                  defaultError,
                  ErrorTypes.Sequential,
                  {
                    error: 'Sequential',
                  },
                ),
              onParallel: () =>
                ApplicationFailure.nonRetryable(
                  defaultError,
                  ErrorTypes.Parallel,
                  {
                    error: 'Parallel',
                  },
                ),
            }),
          )
        }
      },
      onSuccess: (x) => x,
    }),
  )
}

export const handleAPIErrors = (params: {
  error: ClientError.ClientErrorServerSide
  defaultError: string
  extra?: Extras
}) => {
  const { error, defaultError, extra = {} } = params

  const errorMessage = pipe(
    (error.error as { error_description?: string }).error_description,
    Option.fromNullable,
    Option.getOrElse(() => error.message),
  )

  const nextRetryDelay = pipe(
    error.headers,
    Option.fromNullable,
    Option.flatMapNullable((x) => x['x-api-api-request-rate-count']),
    Option.flatMap(Number.parse),
    Option.getOrElse(() => 100),
    (x) => x / 100,
    Math.ceil,
    (x) => x * 20,
  )

  switch (error.status) {
    case 401:
      // Unauthorized
      // You did not use the proper API token and/or secret.

      return ApplicationFailure.nonRetryable(
        'User does not have access to resource.',
        ErrorTypes.Unauthorized,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 403:
      // Forbidden
      // You tried to view a resource you don't have access to
      // You tried to create a resource, but your user has an insufficient role.
      return ApplicationFailure.nonRetryable(
        "User isn't authorized to access this in API.",
        ErrorTypes.Forbidden,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 404:
      // Not Found
      // You’ve tried to access a URL or resource ID that doesn't exist.
      captureException(errorMessage, {
        error: 'Item not found in API.',
        status: error.status,
        ...extra,
      })

      return ApplicationFailure.nonRetryable(
        'Item not found in API.',
        ErrorTypes.NotFound,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 409:
      // Conflict
      // A conflict occurs when creating a resource encounters a uniqueness validation error.
      // Normally uniqueness errors will be returned in a 422 Validation Error.
      // There are some cases (a multi-threaded application) where multiple threads will send simultaneous requests to create the same resource.
      // If you are encountering this error, please make sure that you're app is only sending a single create request for a resource.
      // If there is only one request, please file a bug report by creating an issue on Github
      captureException(errorMessage, {
        error: 'Conflict issue with API.',
        status: error.status,
        ...extra,
      })

      return ApplicationFailure.nonRetryable(
        'Conflict issue with API.',
        ErrorTypes.Conflict,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 422:
      // Validation Error
      // The value you have passed for an attribute isn't valid.
      // The response body will provide the attribute that is invalid.
      // The response body will provide the attribute that is invalid.
      // Note: There can be more than one invalid attribute.
      captureException(errorMessage, {
        error: 'Validation issue with API.',
        status: error.status,
        ...extra,
      })

      return ApplicationFailure.nonRetryable(
        'Validation issue with API.',
        ErrorTypes.Validation,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 429:
      console.log('API Rate Limit ', nextRetryDelay)

      // Rate limit.
      return ApplicationFailure.create({
        message: 'Hit API rate limit for user.',
        type: ErrorTypes.RateLimit,
        nonRetryable: false,
        nextRetryDelay,
      })
    case 500:
      // Internal Server Error
      // We had a problem with our server. Try again later.
      return ApplicationFailure.retryable(
        'Internal server error with API',
        ErrorTypes.InternalServerError,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    case 503:
      // Service Unavailable
      // We’re temporarily offline for maintenance. Please try again later.
      return ApplicationFailure.retryable(
        'API is Unavailable.',
        ErrorTypes.ServiceUnavailable,
        {
          error: errorMessage,
          status: error.status,
        },
      )
    // Sometimes we can get a 504 from axios if the request takes to long.
    case 504:
    default:
      captureException(errorMessage, {
        error: defaultError,
        status: error.status,
        ...extra,
      })

      return ApplicationFailure.retryable(defaultError, ErrorTypes.Unknown, {
        error: errorMessage,
        status: error.status,
        ...extra,
      })
  }
}

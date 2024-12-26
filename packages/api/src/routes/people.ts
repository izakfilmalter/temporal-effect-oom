import { Array, Option, pipe } from 'effect'
import type { Request, Response } from 'express'

import type { GetPeopleResponse, Person } from '@if/api-client'

const totalPeople = 78903

/**
 * Handles GET requests for '/', responding with a JSON message.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A JSON object if the request is valid, or a 405 status if the
 *   method is not allowed.
 */
export const get = async (
  req: Request<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    {
      per_page?: string
      offset?: string
    }
  >,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  if (req.method !== 'GET') return res.status(405)

  const perPage = parseInt(
    pipe(
      req.query.per_page,
      Option.fromNullable,
      Option.getOrElse(() => '100'),
    ),
  )
  const offset = parseInt(
    pipe(
      req.query.offset,
      Option.fromNullable,
      Option.getOrElse(() => '0'),
    ),
  )

  const people = Array.makeBy(
    Math.min(totalPeople - offset, perPage),
    (i): Person => ({
      id: `person_${offset + i + 1}`,
      type: 'person',
      attributes: {
        first_name: `First Name ${offset + i + 1}`,
        last_name: `Last Name ${offset + i + 1}`,
      },
    }),
  )

  const response: GetPeopleResponse = {
    links: {
      self: `http://localhost:3002/people?per_page=${perPage}&offset=${offset}`,
      next: `http://localhost:3002/people?per_page=${perPage}&offset=${
        offset + perPage
      }`,
    },
    data: people,
    meta: {
      total_count: totalPeople,
      count: perPage,
    },
  }

  return res.json(response)
}

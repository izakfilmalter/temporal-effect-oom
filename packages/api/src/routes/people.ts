import { Array } from 'effect'
import type { Request, Response } from 'express'

import type {
  GetPeopleQuery,
  GetPeopleResponse,
} from '~/helpers/apiPeopleTypes'

const totalPeople = 78903

/**
 * Handles GET requests for '/', responding with a JSON message.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A JSON object if the request is valid, or a 405 status if the
 *   method is not allowed.
 */
export const get = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<any, any, any, GetPeopleQuery>,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  if (req.method !== 'GET') return res.status(405)

  const { per_page = 100, offset = 0 } = req.query

  const people = Array.makeBy(
    Math.min(totalPeople - parseInt(offset), parseInt(per_page)),
    (i): Person => ({
      id: `person_${parseInt(offset) + i + 1}`,
    }),
  )

  const response: GetPeopleResponse = {
    data: people,
    meta: {
      total_count: totalPeople,
      count: per_page,
    },
  }

  return res.json(response)
}

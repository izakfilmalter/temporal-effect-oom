import { Array, pipe } from 'effect'
import type { Request, Response } from 'express'
import { nanoid } from 'nanoid'

import { getWorkflowClient } from '@if/api/src/helpers/getWorkflowClient'

/**
 * Handles GET requests for '/', responding with a JSON message.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A JSON object if the request is valid, or a 405 status if the
 *   method is not allowed.
 */
export const get = async (req: Request, res: Response) => {
  if (req.method !== 'GET') return res.status(405)

  const client = await getWorkflowClient()

  await Promise.all(
    pipe(
      Array.makeBy(4000, () =>
        client.start('importAPIPeople', {
          args: [{}],
          taskQueue: 'Main',
          workflowId: nanoid(),
        }),
      ),
    ),
  )

  return res.json({ message: 'Started workflow' })
}

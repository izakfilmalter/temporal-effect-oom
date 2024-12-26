import { proxyActivities } from '@temporalio/workflow'
import { Effect } from 'effect'

import type { createActivities } from '@if/workers/activities/activities'

const { apiGetAndSavePeople } = proxyActivities<
  ReturnType<typeof createActivities>
>({
  startToCloseTimeout: '5m', // recommended
  // The below is a Retry Policy. It is used to retry the Activity if it fails.
  retry: {
    // These are the values of the Default Retry Policy
    initialInterval: '20s',
    backoffCoefficient: 1,
    nonRetryableErrorTypes: [],
  },
})

export const apiGetAndSavePeopleE = (
  params: Parameters<typeof apiGetAndSavePeople>[0],
) => Effect.promise(async () => apiGetAndSavePeople(params))

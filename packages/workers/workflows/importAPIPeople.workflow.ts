import type { ChildWorkflowOptions } from '@temporalio/workflow'
import { executeChild, ParentClosePolicy } from '@temporalio/workflow'
import { Effect, Schema } from 'effect'

import { GetPeopleQuery } from '@if/api-client'
import { apiGetAndSavePeopleE } from '@if/workers/activities/activityProxies'
import { apiImporterE } from '@if/workers/helpers/api/apiImporterE'
import { safeWorkflow } from '@if/workers/helpers/safeWorkflow'

export const ImportAPIPeopleInput = Schema.Struct({
  queryChunks: Schema.optional(Schema.Array(Schema.Array(GetPeopleQuery))),
})
export type ImportAPIPeopleInput = Schema.Schema.Type<
  typeof ImportAPIPeopleInput
>

export const ImportAPIPeopleOutput = Schema.Struct({
  result: Schema.Literal('success'),
})
export type ImportAPIPeopleOutput = Schema.Schema.Type<
  typeof ImportAPIPeopleOutput
>

export const importAPIPeople = safeWorkflow(
  ImportAPIPeopleInput,
  ImportAPIPeopleOutput,
  'importAPIPeople',
)((params) => {
  const { queryChunks } = params

  return apiImporterE({
    queryChunks,
    getAndSave: apiGetAndSavePeopleE,
    repeat: importAPIPeopleExecuteChildE,
  })
})

const importAPIPeopleExecuteChildE = (
  params: ChildWorkflowOptions & { args: Parameters<typeof importAPIPeople> },
) =>
  Effect.tryPromise(async () =>
    executeChild(importAPIPeople, {
      parentClosePolicy: ParentClosePolicy.ABANDON,
      ...params,
    }),
  )

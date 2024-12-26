import { log } from '@temporalio/workflow'
import { Effect, Schema } from 'effect'

import { safeWorkflow } from '@if/workers/helpers/safeWorkflow'

export const TestWorkflowInput = Schema.Struct({})
export type TestWorkflowInput = Schema.Schema.Type<typeof TestWorkflowInput>

export const TestWorkflowOutput = Schema.Struct({
  result: Schema.Literal('success'),
})
export type TestWorkflowOutput = Schema.Schema.Type<typeof TestWorkflowOutput>

export const testWorkflow = safeWorkflow(
  TestWorkflowInput,
  TestWorkflowOutput,
  'testWorkflow',
)((_params) => {
  log.info('Starting testWorkflow.')

  log.info('Finished testWorkflow.')

  return Effect.succeed({ result: 'success' })
})

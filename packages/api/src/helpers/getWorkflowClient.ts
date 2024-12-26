import { Connection, WorkflowClient } from '@temporalio/client'

export const getWorkflowClient = async () => {
  const connection = await Connection.connect()

  return new WorkflowClient({
    connection,
    namespace: 'pro',
  })
}

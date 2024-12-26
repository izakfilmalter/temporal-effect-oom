import 'dotenv/config'

import type { ResourceBasedTunerOptions, WorkerTuner } from '@temporalio/worker'
import {
  makeTelemetryFilterString,
  NativeConnection,
  Runtime,
  Worker,
} from '@temporalio/worker'
import { Array, pipe } from 'effect'

import { createActivities } from '@if/workers/activities/activities'
import { TaskQueue } from '@if/workers/helpers/workflowHelpers.temporal'

const workflowOption = (path: string) => ({
  workflowsPath: require.resolve(path),
})

function getProcessMemoryUsage() {
  const usage = process.memoryUsage()
  const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100

  return {
    heapTotal: {
      mb: toMB(usage.heapTotal),
    },
    heapUsed: {
      mb: toMB(usage.heapUsed),
    },
    rss: {
      mb: toMB(usage.rss),
    },
    external: {
      mb: toMB(usage.external),
    },
  }
}

function printMemoryUsage() {
  const usage = getProcessMemoryUsage()
  const timestamp = new Date().toISOString()

  console.log(`\n=== Memory Usage at ${timestamp} ===`)
  console.log(`Heap Total: ${usage.heapTotal.mb} MB`)
  console.log(`Heap Used: ${usage.heapUsed.mb} MB`)
  console.log(`RSS: ${usage.rss.mb} MB`)
  console.log(`External: ${usage.external.mb} MB`)
  console.log('=====================================\n')
}

// Set up interval (20 seconds = 20000 milliseconds)
const memoryInterval = setInterval(printMemoryUsage, 1000)

async function run() {
  Runtime.install({
    // Telemetry options control how logs, metrics and traces are exported out of Rust Core
    telemetryOptions: {
      // To export metrics and traces using the OpenTelemetry Collector, use `oTelCollectorUrl`.
      // see https://opentelemetry.io/docs/collector/getting-started/ for more information.
      //
      // To expose a port for Prometheus to collect metrics from Core, use `prometheusMetricsBindAddress`
      // You can verify metrics are exported with `curl -fail localhost:9464/metrics`
      // metrics: {
      //   prometheus: {
      //     bindAddress: '0.0.0.0:9464',
      //   },
      // },
      // A string in the env filter format specified here:
      // https://docs.rs/tracing-subscriber/0.2.20/tracing_subscriber/struct.EnvFilter.html
      //
      logging: {
        // This filter determines which logs should be forwarded from Rust Core to the Node.js logger. In production, WARN should generally be enough.
        filter: makeTelemetryFilterString({ core: 'WARN' }),
      },
    },
  })

  const connection = await NativeConnection.connect()
  const namespace = `prod`

  const resourceBasedTunerOptions: ResourceBasedTunerOptions = {
    targetMemoryUsage: 0.8,
    targetCpuUsage: 0.9,
  }

  const tuner: WorkerTuner = {
    workflowTaskSlotSupplier: {
      type: 'resource-based',
      tunerOptions: resourceBasedTunerOptions,
      maximumSlots: 10,
    },
    activityTaskSlotSupplier: {
      type: 'resource-based',
      tunerOptions: resourceBasedTunerOptions,
      maximumSlots: 10,
    },
    localActivityTaskSlotSupplier: {
      type: 'resource-based',
      tunerOptions: resourceBasedTunerOptions,
      maximumSlots: 10,
    },
  }

  const workers = await Promise.all([
    Worker.create({
      ...workflowOption('workflows/workflows.ts'),
      reuseV8Context: true,
      namespace,
      connection,
      activities: createActivities(),
      taskQueue: TaskQueue.Main,
      tuner,
      debugMode: true,
    }),
  ])

  const startWorkers = async () =>
    Promise.all(
      pipe(
        workers,
        Array.map(async (x) => x.run()),
      ),
    )

  const shutdownWorkers = () =>
    pipe(
      workers,
      Array.map((x) => x.shutdown()),
    )

  // Step 2: Start accepting tasks in the queue
  await startWorkers()

  process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION', {
      error: err,
    })

    // force shutdown after a graceperiod
    const sixtySeconds = 60000
    const timeout = setTimeout(() => {
      console.error('UNCAUGHT EXCEPTION FORCE SHUTDOWN')
      process.exit(1)
    }, sixtySeconds)

    // tell worker to shutdown gracefully
    shutdownWorkers()

    // wait for graceful shutdown
    const interval = setInterval(() => {
      console.info('Waiting for shutdown')

      console.info('Worker State', {
        status: pipe(
          workers,
          Array.map((x) => x.getState()),
        ),
      })

      const isStopped = workers.every((x) => x.getState() === 'STOPPED')
      if (isStopped) {
        clearTimeout(timeout)
        clearInterval(interval)
        // clearInterval(oomHandler)
        clearInterval(memoryInterval)
        process.exit(1)
      }
    }, 1000)
  })
}

run().catch((err) => {
  console.error(err)
  clearInterval(memoryInterval)
  process.exit(1)
})

process.on('SIGINT', () => {
  clearInterval(memoryInterval)
  process.exit(1)
})

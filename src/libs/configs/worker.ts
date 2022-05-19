import BluebirdPromise from 'bluebird'
import Queue from 'bull'
import * as env from './environment'
import logger from './logger'
import connector from './database'
import RedisCacheManager from '../services/cache/redis'
import QueueManager from '../services/queue/queue-manager'
import EventManager from '../services/event/emitter'
import Shutdown from '../utils/shutdown'
import MetricsCollectionService from '../services/metric/matric-service'
import bugsnag from './bugsnag'
import '../services'

BluebirdPromise.config({
  cancellation: true
})

global.Promise = (BluebirdPromise as any)

env.config()

const { NODE_ENV, REDIS_URL, REDIS_PREFIX } = process.env

const onQueueActive = (queueName: string, job: Queue.Job<any>) => {
  logger.info(`Started processing ${queueName} job #${job.id}`)
}

const onQueueFailed = (queueName: string, job: Queue.Job<any>, err: Error) => {
  logger.info(`Failed processing ${queueName} job #${job.id}. Reason: ${err.message}`)
  if (NODE_ENV === 'production') {
    bugsnag.notify(err)
  }
}

const onQueueCompleted = (queueName: string, job: Queue.Job<any>) => {
  logger.info(`Completed processing ${queueName} job #${job.id}`)
}

const start = async () => {
  await connector.authenticate()
  QueueManager.init(REDIS_URL as string, `${REDIS_PREFIX}_${NODE_ENV || 'development'}_bull`, true)

  for (const entry of QueueManager.getQueueEntries()) {
    const [queueName, queue]: [string, Queue.Queue] = entry
    queue.on('active', onQueueActive.bind(null, queueName))
    queue.on('failed', onQueueFailed.bind(null, queueName))
    queue.on('completed', onQueueCompleted.bind(null, queueName))
  }

  EventManager.init({ isWorker: true })

  const metricsNamespace = `${REDIS_PREFIX}_${NODE_ENV || 'development'}`
  await MetricsCollectionService.init(metricsNamespace)

  logger.info('Worker is active now')
}

start()

Shutdown(async () => {
  await QueueManager.close()
  await connector.close()
  await RedisCacheManager.close()
  await MetricsCollectionService.close()
})

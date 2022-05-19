import 'dotenv/config'
import BluebirdPromise from 'bluebird'
import * as server from './configs/server'
import dbconnector from './libs/configs/database'
import logger from './libs/configs/logger'
import Shutdown from './libs/utils/shutdown'
import QueueManager from './libs/services/queue/queue-manager'
import EventManager from './libs/services/event/emitter'
import MetricsCollectionService from './libs/services/metric/matric-service'
import RedisCacheManager from './libs/services/cache/redis'

BluebirdPromise.config({ cancellation: true })

const { NODE_ENV, REDIS_URL, REDIS_PREFIX } = process.env

const start = async () => {
  try {
    logger.info('Connecting..')
    await dbconnector.authenticate()
    QueueManager.init(REDIS_URL as string, `${REDIS_PREFIX}_${NODE_ENV || 'development'}_bull`, true)
    EventManager.init()
    await MetricsCollectionService.init(`${REDIS_PREFIX}_${NODE_ENV || 'development'}`)
    await server.start()
    logger.info('Connected')
  } catch (error: unknown) {
    logger.error(error)
  }
}
start()

Shutdown(async () => {
  await QueueManager.close()
  await dbconnector.close()
  await RedisCacheManager.close()
  await MetricsCollectionService.close()
  await server.stop()
})
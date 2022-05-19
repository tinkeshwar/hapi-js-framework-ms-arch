import nodeCleanup from 'node-cleanup'
import logger from '../configs/logger'

export const Shutdown = (teardown: () => Promise<void>): void => {
  nodeCleanup((exitCode, signal) => {
    if (!signal) {
      logger.error(`Hard shutdown initiated with code ${exitCode || '[unknown]'}`)
      return
    }
    logger.info(`Graceful shutdown initiated (${signal})`)
    teardown().then(() => process.kill(process.pid, signal))
    nodeCleanup.uninstall()
    return false
  })
}

export default Shutdown
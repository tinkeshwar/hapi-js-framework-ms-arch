import Bugsnag from '@bugsnag/js'
import logger from './logger'

const bugsnag = Bugsnag.createClient({
  apiKey: process.env.BUGSNAG_API_KEY as string || '123456789',
  autoTrackSessions: true,
  enabledReleaseStages: ['production'],
  releaseStage: process.env.NODE_ENV || 'development',
  redactedKeys: ['password', 'newPassword', 'authorization'],
  logger
})

export default bugsnag
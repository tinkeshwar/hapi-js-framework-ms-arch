import { JobOptions } from 'bull'
import { QueueManager, QueueWorker } from '../queue'
import { IJobManager, IJobData } from './job-manager'

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function JobProcessor (opts?: JobOptions) {
  return <T extends IJobManager>(target: T): T => {
    const queueName = `${target.jobName}Queue`
    target = QueueWorker(queueName)(target)

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const schedule = target.schedule

    target.schedule = async function (...args: any[]): Promise<{ data: IJobData; opts?: JobOptions; }> {
      const { data, opts: additionalOpts } = await schedule.apply(this, args)
      const queue = QueueManager.getQueue(queueName)
      const { jobId } = await target.init({ data })
      await queue.add(data, Object.assign({ jobId }, Object.assign({}, opts, additionalOpts || {})))
      return { data, opts }
    }

    QueueManager.once('ready', () => {
      if (!QueueManager.isWorker) {
        return
      }
      const queue = QueueManager.getQueue(queueName)
      queue.process(async (jobManager) => {
        const { id: jobId, data: jobData } = jobManager
        const processor = await target.create({ id: parseInt(jobId.toString(), 10), data: jobData })
        try {
          await processor.update('PROCESSING')
          await processor.process(processor.jobManager.data)
        } catch (error: any) {
          await processor.update('FAILED')
          throw error
        }
        await processor.update('COMPLETED')
      })
    })

    return target
  }
}

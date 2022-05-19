import { EventEmitter } from 'events'
import Queue from 'bull'
import QueueList from './queue-list'

class QueueManager {
  private static queues: { [queueName: string]: Queue.Queue; }
  private static redisUrl: string
  private static prefix: string
  private static isWorkerInternal: boolean
  private static eventEmitter = new EventEmitter()

  public static get isWorker (): boolean {
    return this.isWorkerInternal
  }

  public static init (redisUrl: string, prefix: string, isWorker?: boolean): void {
    this.queues = {}
    this.redisUrl = redisUrl
    this.prefix = prefix

    this.isWorkerInternal = !!(isWorker)

    this.initQueues()
    this.eventEmitter.emit('ready')
  }

  public static on (event: string | symbol, listener: (...args: any[]) => void): EventEmitter {
    return this.eventEmitter.on(event, listener)
  }

  public static once (event: string | symbol, listener: (...args: any[]) => void): EventEmitter {
    return this.eventEmitter.once(event, listener)
  }

  public static registerQueue (queueName: string, bullQueueName?: string): void {
    this.queues[queueName] = new Queue(bullQueueName || queueName, this.redisUrl, { prefix: this.prefix })
  }

  public static getQueue (queueName: string): Queue.Queue {
    const queue = this.queues[queueName]

    if (!queue) {
      throw new Error('Queue is not registered')
    }

    return queue
  }

  public static getQueueEntries (): [string, Queue.Queue][] {
    return Object.entries(this.queues)
  }

  public static async close (): Promise<void> {
    for (const entry of this.getQueueEntries()) {
      const [, queue]: [string, Queue.Queue] = entry
      await queue.clean(1)
      await queue.close()
    }
  }

  protected static initQueues (): void {
    for (const [queueName, bullQueueName] of Object.entries(QueueList)) {
      this.registerQueue(queueName, bullQueueName)
    }
  }
}

export default QueueManager
import { EventEmitter } from 'events'
import { Queue } from 'bull'
import QueueManager from '../queue/queue-manager'
import Listeners, { IDispatchable } from './listner'
import { QueueWorker } from '../queue'

type EventName<T extends string> = T & (T extends '*' ? never : unknown);

@QueueWorker('eventQueue')
class EventManager {
  private static dispatcher = new EventEmitter()
  private static eventQueue: Queue

  public static init (opts?: { isWorker?: boolean; }): void {
    const { isWorker = false } = opts || {}
    this.eventQueue = QueueManager.getQueue('eventQueue')

    if (isWorker) {
      this.register(Listeners)
      this.eventQueue.process('*', (job) => {
        const { data: { eventName, payload } } = job
        this.dispatcher.emit(eventName, ...payload)
        this.dispatcher.emit('*', eventName, payload)
      })
    }
  }

  public static async emit<T extends string> (eventName: EventName<T>, ...data: any[]): Promise<void> {
    await this.eventQueue.add({
      eventName,
      payload: data
    })
  }

  public static register (listeners: IDispatchable[]): void {
    for (const listener of listeners) {
      listener.subscribe(this.dispatcher)
    }
  }
}

export default EventManager

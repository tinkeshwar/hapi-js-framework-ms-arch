import toSnakeCase from 'to-snake-case'
import QueueList from './queue-list'

const QueueWorker = (queueName: string) => <T>(target: T): T => {
  if (!QueueList[queueName]) {
    QueueList[queueName] = toSnakeCase(queueName)
  }

  return target
}

export default QueueWorker

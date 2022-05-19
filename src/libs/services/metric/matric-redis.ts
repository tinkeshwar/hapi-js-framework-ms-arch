import Redis from 'ioredis'

const { REDIS_URL, REDIS_PREFIX } = process.env

const keyPrefix = `${REDIS_PREFIX}_metrics`

class LocalMetricsCollectionService {
  private static redis: any

  public static async init (namespace: string): Promise<void> {
    this.redis = new Redis(REDIS_URL || '', { keyPrefix: `${keyPrefix}:${namespace}:` })
  }

  public static async close (): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }

  public static async increment (name: string, value = 1): Promise<void> {
    await this.redis.incrby(name.replace(/\./g, ':'), value)
  }

  public static async decrement (name: string, value = 1): Promise<void> {
    await this.redis.decrby(name.replace(/\./g, ':'), value)
  }

  public static async counter (name: string, value: number): Promise<void> {
    await this.redis.incrby(name.replace(/\./g, ':'), value)
  }

  public static async set (name: string, value: number | string): Promise<void> {
    await this.redis.sadd(name.replace(/\./g, ':'), value)
  }

  public static async gauge (name: string, value: number): Promise<void> {
    await this.redis.set(name.replace(/\./g, ':'), value)
  }

  public static async gaugeDelta (name: string, value: number): Promise<void> {
    if (!value) {
      return
    }

    await this.redis.incrbyfloat(name.replace(/\./g, ':'), value)
  }

  public static async timing (name: string, timer: Date): Promise<void> {
    const value = Date.now() - timer.getTime()
    await this.redis.set(name.replace(/\./g, ':'), value)
  }

  public static async getLastValue (name: string): Promise<number> {
    const value = await this.redis.get(name.replace(/\./g, ':'))
    return Number(value) || 0
  }
}

export default LocalMetricsCollectionService

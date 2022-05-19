import Redis from 'ioredis'

const { REDIS_URL, REDIS_PREFIX } = process.env

const redisUrl = REDIS_URL || ''
const keyPrefix = REDIS_PREFIX

const connectionPool: Record<string, any> = {}

class RedisCacheManager {
  private redis: any

  public constructor (namespace: string) {
    const key = `${keyPrefix}:${namespace}:`

    if (connectionPool[key]) {
      this.redis = connectionPool[key]
    } else {
      this.redis = new Redis(redisUrl, { keyPrefix: key })
      connectionPool[key] = this.redis
    }
  }

  public static create (namespace: string): RedisCacheManager {
    return new this(namespace)
  }

  public static async close (): Promise<void> {
    for (const key of Object.keys(connectionPool)) {
      await connectionPool[key].quit()
    }
  }

  public async set (key: string | number, value: string | number | boolean, expiresInSeconds?: number): Promise<string|null> {
    if (expiresInSeconds) {
      return this.redis.set(key.toString(), value as any, 'ex', expiresInSeconds)
    }
    return this.redis.set(key.toString(), value as any)
  }

  public get (key: string | number): Promise<string | null> {
    return this.redis.get(key.toString())
  }

  public del (key: string | number): Promise<number> {
    return this.redis.del(key.toString())
  }

  public incr (key: string | number): Promise<number> {
    return this.redis.incr(key.toString())
  }

  public decr (key: string | number): Promise<number> {
    return this.redis.decr(key.toString())
  }
}

export default RedisCacheManager

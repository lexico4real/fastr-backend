import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  logger = new Logger();
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}
  private logName = 'CACHE-SERVICE';
  private logFileName = 'cache-service';

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      await this.redisClient.set(key, value);
      if (ttlSeconds) {
        await this.redisClient.expire(key, ttlSeconds);
      }
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async getList(key: string): Promise<(string | number)[] | null> {
    try {
      return await this.redisClient.lrange(key, 0, -1);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
    }
  }

  async lpush(key: string, data: any): Promise<void> {
    try {
      await this.redisClient.lpush(key, data);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
    }
  }

  async ltrim(key: string): Promise<void> {
    try {
      await this.redisClient.ltrim(key, 1, 0);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.redisClient.llen(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async rpop(key: string): Promise<any> {
    try {
      return await this.redisClient.rpop(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async incr(key: string): Promise<any> {
    try {
      return await this.redisClient.incr(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async del(key: string): Promise<any> {
    try {
      return await this.redisClient.del(key);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async expire(key: string, duration: number): Promise<any> {
    try {
      return await this.redisClient.expire(key, duration);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any> {
    try {
      return await this.redisClient.lrange(key, start, stop);
    } catch (e) {
      this.logger.log(this.logName, 'error', e, this.logFileName);
      return null;
    }
  }
}
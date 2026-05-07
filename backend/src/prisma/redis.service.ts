import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;

  constructor(@Optional() configService: ConfigService) {
    const redisUrl = configService?.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl);
        this.client.on('error', (err) => {
          console.warn('Redis connection error (Redis will be disabled):', err.message);
        });
      } catch (err) {
        console.warn('Failed to initialize Redis (Redis will be disabled):', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (!this.client || ttlSeconds <= 0) {
      return;
    }

    try {
      await this.client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
    } catch (err) {
      console.warn('Failed to blacklist token (Redis error):', err);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const value = await this.client.get(`blacklist:${token}`);
      return value === '1';
    } catch (err) {
      console.warn('Failed to check token blacklist (Redis error):', err);
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        console.warn('Error quitting Redis:', err);
      }
    }
  }
}

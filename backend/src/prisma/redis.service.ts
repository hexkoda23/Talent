import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.get<string>('REDIS_URL', 'redis://localhost:6379'));
  }

  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    await this.client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const value = await this.client.get(`blacklist:${token}`);
    return value === '1';
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

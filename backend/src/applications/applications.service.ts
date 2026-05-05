import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findLatestByUser(userId: string) {
    return this.prisma.application.findFirst({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
    });
  }
}

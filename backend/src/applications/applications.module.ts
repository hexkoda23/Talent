import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ApplicationsService, PrismaService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

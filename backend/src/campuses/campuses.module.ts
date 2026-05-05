import { Module } from '@nestjs/common';
import { CampusesController } from './campuses.controller';
import { CampusesService } from './campuses.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CampusesController],
  providers: [CampusesService, PrismaService],
})
export class CampusesModule {}

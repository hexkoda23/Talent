import { Module } from '@nestjs/common';
import { SelectionGameController } from './selection-game.controller';
import { SelectionGameService } from './selection-game.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SelectionGameController],
  providers: [SelectionGameService, PrismaService],
})
export class SelectionGameModule {}

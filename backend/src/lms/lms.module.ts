import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}

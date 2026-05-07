import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './prisma/redis.service';
import { AuthModule } from './auth/auth.module';
import { CampusesModule } from './campuses/campuses.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { ApplicationsModule } from './applications/applications.module';
import { SelectionGameModule } from './selection-game/selection-game.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';
import { LmsModule } from './lms/lms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    UsersModule,
    ApplicationsModule,
    AuthModule,
    CampusesModule,
    SelectionGameModule,
    OnboardingModule,
    UploadsModule,
    AdminModule,
    LmsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RedisService],
})
export class AppModule {}

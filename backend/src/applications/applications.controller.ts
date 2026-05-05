import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/application')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  current(@CurrentUser() user: AuthUser) {
    return this.service.getCurrentForUser(user.sub);
  }
}

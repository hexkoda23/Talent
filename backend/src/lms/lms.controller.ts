import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LmsLaunchDto } from './dto/lms-launch.dto';
import { LmsService } from './lms.service';

@ApiTags('lms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Post('launch')
  launch(@CurrentUser() user: AuthUser, @Body() body: LmsLaunchDto) {
    return this.lmsService.createLaunchUrl(user, body.next);
  }
}

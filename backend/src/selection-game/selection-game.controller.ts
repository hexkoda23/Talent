import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SelectionGameService } from './selection-game.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';
import { CompleteAttemptDto } from './dto/complete-attempt.dto';

@ApiTags('selection-game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/selection-game')
export class SelectionGameController {
  constructor(private readonly service: SelectionGameService) {}

  @Get()
  current(@CurrentUser() user: AuthUser) {
    return this.service.getCurrent(user);
  }

  @Post('attempts/start')
  start(@CurrentUser() user: AuthUser) {
    return this.service.startAttempt(user);
  }

  @Post('attempts/:attemptId/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() body: CompleteAttemptDto,
  ) {
    return this.service.completeAttempt(user, attemptId, body);
  }

  @Get('attempts/latest')
  latest(@CurrentUser() user: AuthUser) {
    return this.service.getLatestAttempt(user);
  }
}

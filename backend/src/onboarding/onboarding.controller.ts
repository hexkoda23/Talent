import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';
import { SubmitOnboardingDocumentDto } from './dto/submit-document.dto';
import { AcknowledgeOnboardingDto } from './dto/acknowledge.dto';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('onboarding-documents')
  list(@CurrentUser() user: AuthUser) {
    return this.service.listDocuments(user);
  }

  @Post('onboarding-documents')
  submit(@CurrentUser() user: AuthUser, @Body() body: SubmitOnboardingDocumentDto) {
    return this.service.submitDocument(user, body);
  }

  @Post('onboarding/acknowledge')
  acknowledge(@CurrentUser() user: AuthUser, @Body() body: AcknowledgeOnboardingDto) {
    return this.service.acknowledge(user, body);
  }
}

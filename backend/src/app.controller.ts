import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('public')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('public/active-cohort')
  getActiveCohort() {
    return this.appService.getActiveCohort();
  }
}

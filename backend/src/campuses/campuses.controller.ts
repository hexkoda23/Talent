import { Controller, Get } from '@nestjs/common';
import { CampusesService } from './campuses.service';

@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  getCampuses() {
    return this.campusesService.getCampusesForActiveCohort();
  }
}

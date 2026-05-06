import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { CreateCampusDto } from './dto/create-campus.dto';
import { CreateApplicationCohortDto } from './dto/create-application-cohort.dto';
import { CreateSelectionGameDto } from './dto/create-selection-game.dto';
import {
  UpdateOnboardingDocumentStatusDto,
  UpdateRegistrationDocumentStatusDto,
} from './dto/update-document-status.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('roles')
  roles(@CurrentUser() user: AuthUser) {
    return this.adminService.listRoles(user);
  }

  @Get('candidates')
  candidates() {
    return this.adminService.listCandidates();
  }

  @Patch('candidates/:applicationId/status')
  updateCandidateStatus(@Param('applicationId') applicationId: string, @Body() body: UpdateApplicationStatusDto) {
    return this.adminService.updateApplicationStatus(applicationId, body.status);
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(@CurrentUser() user: AuthUser, @Body() body: CreateAdminUserDto) {
    return this.adminService.createUser(user, body);
  }

  @Patch('users/:userId')
  updateUser(@CurrentUser() user: AuthUser, @Param('userId') userId: string, @Body() body: UpdateAdminUserDto) {
    return this.adminService.updateUser(user, userId, body);
  }

  @Patch('users/:userId/roles')
  updateUserRoles(@CurrentUser() user: AuthUser, @Param('userId') userId: string, @Body() body: UpdateUserRolesDto) {
    return this.adminService.updateUserRoles(user, userId, body);
  }

  @Get('campuses')
  campuses() {
    return this.adminService.listCampuses();
  }

  @Post('campuses')
  createCampus(@CurrentUser() user: AuthUser, @Body() body: CreateCampusDto) {
    return this.adminService.createCampus(user, body);
  }

  @Get('cohorts')
  cohorts() {
    return this.adminService.listApplicationCohorts();
  }

  @Post('cohorts')
  createCohort(@Body() body: CreateApplicationCohortDto) {
    return this.adminService.createApplicationCohort(body);
  }

  @Post('cohorts/:cohortId/close')
  closeCohort(@Param('cohortId') cohortId: string) {
    return this.adminService.closeApplicationCohort(cohortId);
  }

  @Post('selection-games')
  createSelectionGame(@Body() body: CreateSelectionGameDto) {
    return this.adminService.createSelectionGame(body);
  }

  @Patch('registration-documents/:documentId/status')
  updateRegistrationDocumentStatus(
    @Param('documentId') documentId: string,
    @Body() body: UpdateRegistrationDocumentStatusDto,
  ) {
    return this.adminService.updateRegistrationDocumentStatus(documentId, body.status);
  }

  @Patch('onboarding-documents/:documentId/status')
  updateOnboardingDocumentStatus(
    @Param('documentId') documentId: string,
    @Body() body: UpdateOnboardingDocumentStatusDto,
  ) {
    return this.adminService.updateOnboardingDocumentStatus(documentId, body.status);
  }
}

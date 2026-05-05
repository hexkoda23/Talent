import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';
import { Request } from 'express';

type RegisterFiles = {
  school_id_card_file?: Express.Multer.File[];
  profile_picture_file?: Express.Multer.File[];
  government_id_file?: Express.Multer.File[];
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-applicant')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'school_id_card_file', maxCount: 1 },
      { name: 'profile_picture_file', maxCount: 1 },
      { name: 'government_id_file', maxCount: 1 },
    ]),
  )
  async registerApplicant(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterApplicantDto,
    @UploadedFiles() files: RegisterFiles,
  ) {
    const schoolId = files.school_id_card_file?.[0];
    const profilePicture = files.profile_picture_file?.[0];
    const governmentId = files.government_id_file?.[0];

    if (!schoolId || !profilePicture || !governmentId) {
      throw new BadRequestException({
        error: {
          code: 'validation_failed',
          message: 'school_id_card_file, profile_picture_file and government_id_file are required',
        },
      });
    }

    return this.authService.registerApplicant(user, body, {
      schoolId,
      profilePicture,
      governmentId,
    });
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('signup')
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: AuthUser,
    @Body() body: LogoutDto,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    return this.authService.logout(user, body.refresh_token, token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('session')
  session(@CurrentUser() user: AuthUser) {
    return this.authService.getSession(user);
  }
}

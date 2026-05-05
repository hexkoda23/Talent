import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UploadsService } from './uploads.service';
import { PresignDto } from './dto/presign.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/dto/auth-user.type';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('presign')
  presign(@CurrentUser() user: AuthUser, @Body() body: PresignDto) {
    return this.service.createPresignedUpload(user, body);
  }

  @Put('local/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async receive(@Param('token') token: string, @Req() request: Request) {
    await this.service.receiveUpload(token, request);
  }
}

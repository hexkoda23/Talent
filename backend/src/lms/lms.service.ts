import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../common/dto/auth-user.type';

@Injectable()
export class LmsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createLaunchUrl(user: AuthUser, next: string) {
    const lmsAppUrl = this.configService.get<string>('LMS_APP_URL', 'http://localhost:3000').replace(/\/+$/, '');
    const secret = this.configService.get<string>(
      'LMS_LAUNCH_SECRET',
      this.configService.get<string>('JWT_ACCESS_SECRET', 'change-this-access-secret'),
    );

    const ticket = await this.jwtService.signAsync(
      {
        sub: user.sub,
        email: user.email,
        organizationId: user.organizationId,
        roles: user.roles,
        purpose: 'lms_launch',
      },
      {
        secret,
        expiresIn: '2m',
        audience: 'talentnation-lms',
        issuer: 'talentnation-api',
      },
    );

    const url = new URL('/sso/consume', lmsAppUrl);
    url.searchParams.set('ticket', ticket);
    url.searchParams.set('next', next);

    return { url: url.toString() };
  }
}

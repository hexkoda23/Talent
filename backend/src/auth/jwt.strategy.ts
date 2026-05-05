import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../common/dto/auth-user.type';

type JwtPayload = AuthUser & { iat: number; exp: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'change-this-access-secret'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      sub: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      roles: payload.roles,
    };
  }
}

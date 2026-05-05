import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../common/dto/auth-user.type';

export const CurrentUser = createParamDecorator((_: never, context: ExecutionContext): AuthUser => {
  const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
  return request.user;
});

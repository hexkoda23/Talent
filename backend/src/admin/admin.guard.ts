import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../common/dto/auth-user.type';
import { isAdminRole } from './role-hierarchy';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user?.roles?.some(isAdminRole)) {
      throw new ForbiddenException({
        error: {
          code: 'admin_required',
          message: 'An administrator role is required',
        },
      });
    }

    return true;
  }
}

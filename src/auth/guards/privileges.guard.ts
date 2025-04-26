import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PRIVILEGES_KEY } from '../decorators/privileges.decorator';

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPrivileges = this.reflector.getAllAndOverride<string[]>(PRIVILEGES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const userPrivileges = user?.role?.privileges?.map((privilege: { name: string }) => privilege.name) || [];

    const hasPrivilege = requiredPrivileges.every(privilege => userPrivileges.includes(privilege));

    if (!hasPrivilege) {
      throw new ForbiddenException('Access denied: insufficient privileges');
    }

    return true;
  }
}

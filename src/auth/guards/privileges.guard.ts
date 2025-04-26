import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PRIVILEGE_KEY } from '../decorators/privileges.decorator';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPrivileges = this.reflector.get<string[]>(
      PRIVILEGE_KEY,
      context.getHandler(),
    );
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const userPrivileges = user.role?.privileges?.map((p: { name: any }) => p.name) ?? [];

    const hasPrivilege = requiredPrivileges.every((p) =>
      userPrivileges.includes(p),
    );

    if (!hasPrivilege) {
      throw new ForbiddenException('Access denied: insufficient privileges');
    }

    return true;
  }
}

import { SetMetadata } from '@nestjs/common';
import { RolesConstant } from 'common/enums/roles';

export const ROLE_KEY = 'roles';
export const Roles = (...roles: RolesConstant[]) => SetMetadata(ROLE_KEY, roles);
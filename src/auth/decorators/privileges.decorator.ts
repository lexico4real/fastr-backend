import { SetMetadata } from '@nestjs/common';
export const PRIVILEGE_KEY = 'privileges';
export const Privileges = (...privileges: string[]) =>
  SetMetadata(PRIVILEGE_KEY, privileges);

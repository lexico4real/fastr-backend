/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserPrivilegeRepository } from './repositories/user-privilege.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { CookieSessionModule } from 'nestjs-cookie-session';
import { UserRepository } from './repositories/user.repository';
import { JwtStrategy } from './jwt-strategy';
import { RolesGuard } from './guards/roles.guard';
import { User } from './entities/user.entity';
import { UserPrivilege } from './entities/user-privilege.entity';
import { UserRole } from './entities/user-role.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: process.env.JWT_SECRET || configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: process.env.EXPIRESIN || '10h',
        },
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      UserPrivilege,
      UserRole,
    ]),
    CookieSessionModule.forRoot({
      session: { secret: 'top secret', maxAge: 60 * 60 * 1000 * 8 },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 30,
        limit: 10,
      },
    ]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    UserRepository,
    UserPrivilegeRepository,
    UserRoleRepository,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, JwtModule, RolesGuard, AuthService, TypeOrmModule],
})
export class AuthModule {}
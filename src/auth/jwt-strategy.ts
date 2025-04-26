import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from './entities/user.entity';
import config from 'config';
import { UserRepository } from './repositories/user.repository';
import { JwtPayload } from './jwt-payload-interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey:
        configService.get<string>('JWT_SECRET') || config.get('jwt.secret'),
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { email } = payload;
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['userRole', 'userRole.user_privileges'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    console.log(user)

    return user;
  }
}
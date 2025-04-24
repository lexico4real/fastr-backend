import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      synchronize:
        configService.get<boolean>('db.synchronize') ||
        process.env.TYPEORM_SYNC === 'true',
      migrationsRun: true,
      logging: false,
      logger: 'file',
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      autoLoadEntities: true,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('db.host') || process.env.DATABASE_HOST,
    port:
      configService.get<number>('db.port') || Number(process.env.DATABASE_PORT),
    username:
      configService.get<string>('db.username') || process.env.DATABASE_USERNAME,
    password:
      configService.get<string>('db.password') || process.env.DATABASE_PASSWORD,
    database:
      configService.get<string>('db.database') || process.env.DATABASE_NAME,
    synchronize:
      configService.get<boolean>('db.synchronize') ||
      process.env.TYPEORM_SYNC === 'true',
    migrationsRun: true,
    logging: false,
    logger: 'file',
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    autoLoadEntities: true,
  };
};

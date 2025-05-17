import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BaseEntitySubscriber } from 'src/subscribers/base-entity.subscriber';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  const commonConfig: TypeOrmModuleOptions = {
    type: 'postgres' as const,
    synchronize:
      configService.get<boolean>('db.synchronize') ||
      process.env.TYPEORM_SYNC === 'true',
    migrationsRun: true,
    logging: false,
    logger: 'file',
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    autoLoadEntities: true,
    subscribers: [BaseEntitySubscriber],
    extra: {
      connectionLimit: 20,
      insecureAuth: true,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      idleTimeOut: 30000,
    }
  };

  if (databaseUrl) {
    return {
      url: databaseUrl,
      ...commonConfig,
    };
  }

  return {
    ...commonConfig,
    host: configService.get<string>('db.host') || process.env.DATABASE_HOST,
    port:
      configService.get<number>('db.port') || Number(process.env.DATABASE_PORT),
    username:
      configService.get<string>('db.username') || process.env.DATABASE_USERNAME,
    password:
      configService.get<string>('db.password') || process.env.DATABASE_PASSWORD,
    database:
      configService.get<string>('db.database') || process.env.DATABASE_NAME,
  };
};

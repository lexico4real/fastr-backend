import { DataSourceOptions } from 'typeorm';

export const typeOrmCliConfig: DataSourceOptions = {
  type: 'postgres',
  migrations: ['src/migrations/**/*{.ts,.js}'],
  entities: ['src/**/**.entity{.ts,.js}'],
  subscribers: ['src/subscribers/**/*{.ts,.js}'],
};

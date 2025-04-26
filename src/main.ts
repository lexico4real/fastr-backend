import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import 'dotenv';
import ClusterConfig from 'config/system/cluster';
import CorsConfig from 'config/system/cors';
import SwaggerConfig from 'config/api-doc';
import { TransformInterceptor } from 'config/interceptors/transform.interceptor';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const cluster = new ClusterConfig();
  const cors = new CorsConfig();
  const doc = new SwaggerConfig();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  await cors.set(app);
  app.setGlobalPrefix('/api/v1');
  await doc.set(app);
  app.use(compression());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableShutdownHooks();
  if (process.env.NODE_ENV !== 'production') {
    const seedService = app.get(SeedService);
    await seedService.seed();
  }
  await cluster.set(app);
}
bootstrap();
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
import { TrimInputPipe } from 'config/validations';
import { json, urlencoded } from 'express';
import { RequestContextService } from './request-context/request-context.service';
import { RequestContextInterceptor } from './request-context/request-context.interceptor';
import { HttpErrorFilter } from 'config/logger/http-error.filter';

async function bootstrap() {
  const cluster = new ClusterConfig();
  const cors = new CorsConfig();
  const doc = new SwaggerConfig();
  const app = await NestFactory.create(AppModule);

  app.use(
    '/api/v1/payments/stripe/fastr-webhook',
    json({
      verify: (req, res, buf) => {
        req['rawBody'] = buf;
      },
    }),
  );

  app.useGlobalPipes(
    new TrimInputPipe(),
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await cors.set(app);
  app.setGlobalPrefix('/api/v1');
  await doc.set(app);
  app.use(compression());
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const contextService = app.get(RequestContextService);
  app.useGlobalInterceptors(new RequestContextInterceptor(contextService));

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableShutdownHooks();
  if (process.env.NODE_ENV !== 'production') {
    await app.get(SeedService).seed();
  }
  await cluster.set(app);
}
bootstrap();

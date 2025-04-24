import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export default class SwaggerConfig {
  async set(app: INestApplication) {
    const options = new DocumentBuilder()
      .setTitle('Fastr App Backend')
      .setDescription(
        'FASTR is a dual-market recruitment platform that connects university students with local businesses for internship, part-time, and freelance work opportunities. It simplifies the recruitment process, helping students gain experience and businesses find on-demand talent.',
      )
      .setVersion('1.0.0')
      .addTag('Fastr App Backend')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-docs', app, document);
  }
}
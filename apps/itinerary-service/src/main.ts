import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './infrastructure/filters/domain-error.filter';
import { StructuredLogger } from './infrastructure/logging/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new StructuredLogger() });

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainErrorFilter());

  const config = new DocumentBuilder()
    .setTitle('Itinerary Service')
    .setDescription('Manages travel itineraries: creation, validation, and event publishing')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Itinerary Service listening on port ${port}`);
}
bootstrap();

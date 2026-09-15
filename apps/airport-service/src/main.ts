import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AirportProviderUnavailableFilter } from './infrastructure/filters/airport-provider-unavailable.filter';
import { StructuredLogger } from './infrastructure/logging/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new StructuredLogger() });
  app.useGlobalFilters(new AirportProviderUnavailableFilter());

  const config = new DocumentBuilder()
    .setTitle('Airport Service')
    .setDescription('Provides airport data sourced from api-colombia, with caching')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Airport Service listening on port ${port}`);
}
bootstrap();

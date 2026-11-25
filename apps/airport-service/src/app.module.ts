import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GetAirportByIdUseCase } from './application/get-airport-by-id.use-case';
import { ListAirportAttractionsUseCase } from './application/list-airport-attractions.use-case';
import { ListAirportsUseCase } from './application/list-airports.use-case';
import { AIRPORT_CACHE } from './domain/ports/airport-cache.port';
import { AIRPORT_PROVIDER } from './domain/ports/airport-provider.port';
import { TOURIST_ATTRACTION_PROVIDER } from './domain/ports/tourist-attraction-provider.port';
import { ApiColombiaAirportAdapter } from './infrastructure/adapters/api-colombia-airport.adapter';
import { AirportController } from './infrastructure/controllers/airport.controller';
import { CorrelationIdMiddleware } from './infrastructure/observability/correlation-id.middleware';
import { InMemoryAirportCache } from './infrastructure/persistence/in-memory-airport-cache';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
  controllers: [AirportController],
  providers: [
    ListAirportsUseCase,
    GetAirportByIdUseCase,
    ListAirportAttractionsUseCase,
    ApiColombiaAirportAdapter,
    // One adapter instance behind both ports, so they share one circuit breaker.
    { provide: AIRPORT_PROVIDER, useExisting: ApiColombiaAirportAdapter },
    { provide: TOURIST_ATTRACTION_PROVIDER, useExisting: ApiColombiaAirportAdapter },
    { provide: AIRPORT_CACHE, useClass: InMemoryAirportCache },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

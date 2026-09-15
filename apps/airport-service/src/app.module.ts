import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GetAirportByIdUseCase } from './application/get-airport-by-id.use-case';
import { ListAirportsUseCase } from './application/list-airports.use-case';
import { AIRPORT_CACHE } from './domain/ports/airport-cache.port';
import { AIRPORT_PROVIDER } from './domain/ports/airport-provider.port';
import { ApiColombiaAirportAdapter } from './infrastructure/adapters/api-colombia-airport.adapter';
import { AirportController } from './infrastructure/controllers/airport.controller';
import { InMemoryAirportCache } from './infrastructure/persistence/in-memory-airport-cache';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
  controllers: [AirportController],
  providers: [
    ListAirportsUseCase,
    GetAirportByIdUseCase,
    { provide: AIRPORT_PROVIDER, useClass: ApiColombiaAirportAdapter },
    { provide: AIRPORT_CACHE, useClass: InMemoryAirportCache },
  ],
})
export class AppModule {}

import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateItineraryUseCase } from './application/create-itinerary.use-case';
import { DeleteItineraryUseCase } from './application/delete-itinerary.use-case';
import { GetItineraryUseCase } from './application/get-itinerary.use-case';
import { ListItinerariesUseCase } from './application/list-itineraries.use-case';
import { UpdateItineraryUseCase } from './application/update-itinerary.use-case';
import { AIRPORT_VALIDATION_PORT } from './domain/ports/airport-validation.port';
import { EVENT_PUBLISHER_PORT } from './domain/ports/event-publisher.port';
import { ITINERARY_REPOSITORY } from './domain/ports/itinerary-repository.port';
import { HttpAirportValidationAdapter } from './infrastructure/adapters/http-airport-validation.adapter';
import { RabbitMqEventPublisherAdapter } from './infrastructure/adapters/rabbitmq-event-publisher.adapter';
import { ItineraryController } from './infrastructure/controllers/itinerary.controller';
import { CorrelationIdMiddleware } from './infrastructure/observability/correlation-id.middleware';
import { ItineraryOrmEntity } from './infrastructure/persistence/itinerary.orm-entity';
import { TypeOrmItineraryRepository } from './infrastructure/persistence/typeorm-itinerary.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>(
          'DATABASE_URL',
          'postgres://postgres:postgres@localhost:5432/itinerary_db',
        ),
        entities: [ItineraryOrmEntity],
        synchronize: false,
        migrationsRun: false,
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([ItineraryOrmEntity]),
  ],
  controllers: [ItineraryController],
  providers: [
    CreateItineraryUseCase,
    GetItineraryUseCase,
    ListItinerariesUseCase,
    UpdateItineraryUseCase,
    DeleteItineraryUseCase,
    { provide: ITINERARY_REPOSITORY, useClass: TypeOrmItineraryRepository },
    { provide: AIRPORT_VALIDATION_PORT, useClass: HttpAirportValidationAdapter },
    { provide: EVENT_PUBLISHER_PORT, useClass: RabbitMqEventPublisherAdapter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

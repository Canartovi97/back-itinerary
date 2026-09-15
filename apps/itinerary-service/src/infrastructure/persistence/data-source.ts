import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ItineraryOrmEntity } from './itinerary.orm-entity';

/**
 * Standalone TypeORM DataSource used by the TypeORM CLI for generating and
 * running migrations. Not used by the running NestJS application directly
 * (see app.module.ts for the runtime TypeOrmModule configuration).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/itinerary_db',
  entities: [ItineraryOrmEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});

export default AppDataSource;

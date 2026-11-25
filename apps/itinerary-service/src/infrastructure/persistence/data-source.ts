import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ItineraryOrmEntity } from './itinerary.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

/**
 * Standalone TypeORM DataSource used by the TypeORM CLI for generating and
 * running migrations. Not used by the running NestJS application directly
 * (see app.module.ts for the runtime TypeOrmModule configuration).
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  // No fallback: credentials come only from the environment (.env / docker-compose).
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [ItineraryOrmEntity, UserOrmEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});

export default AppDataSource;

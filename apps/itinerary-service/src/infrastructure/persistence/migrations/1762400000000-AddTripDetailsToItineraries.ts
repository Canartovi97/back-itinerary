import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Full trip planning on an itinerary: trip type, passengers and cabin class,
 * lodging, budget, status, notes, plus the lists (guides, emergency contacts,
 * document references, planned attractions) stored as JSONB since they are
 * always read and written together with their itinerary.
 *
 * Every column has a default, so existing rows become a valid round trip for
 * one adult in economy, status PLANNED, with empty lists.
 */
export class AddTripDetailsToItineraries1762400000000 implements MigrationInterface {
  name = 'AddTripDetailsToItineraries1762400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "itineraries"
        ADD COLUMN "trip_type" varchar(20) NOT NULL DEFAULT 'ROUND_TRIP',
        ADD COLUMN "adults" int NOT NULL DEFAULT 1,
        ADD COLUMN "children" int NOT NULL DEFAULT 0,
        ADD COLUMN "cabin_class" varchar(20) NOT NULL DEFAULT 'ECONOMY',
        ADD COLUMN "lodging_type" varchar(20) NOT NULL DEFAULT 'NONE',
        ADD COLUMN "lodging_name" varchar(100) NULL,
        ADD COLUMN "lodging_address" varchar(200) NULL,
        ADD COLUMN "budget_amount" numeric(15,2) NULL,
        ADD COLUMN "budget_currency" varchar(3) NOT NULL DEFAULT 'COP',
        ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'PLANNED',
        ADD COLUMN "notes" text NULL,
        ADD COLUMN "guides" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN "emergency_contacts" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN "documents" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN "attractions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD CONSTRAINT "CHK_itineraries_travelers" CHECK ("adults" >= 1 AND "children" >= 0),
        ADD CONSTRAINT "CHK_itineraries_budget" CHECK ("budget_amount" IS NULL OR "budget_amount" >= 0)
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_itineraries_user_status" ON "itineraries" ("user_id", "status")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_itineraries_user_status"');
    await queryRunner.query(`
      ALTER TABLE "itineraries"
        DROP CONSTRAINT "CHK_itineraries_budget",
        DROP CONSTRAINT "CHK_itineraries_travelers",
        DROP COLUMN "attractions",
        DROP COLUMN "documents",
        DROP COLUMN "emergency_contacts",
        DROP COLUMN "guides",
        DROP COLUMN "notes",
        DROP COLUMN "status",
        DROP COLUMN "budget_currency",
        DROP COLUMN "budget_amount",
        DROP COLUMN "lodging_address",
        DROP COLUMN "lodging_name",
        DROP COLUMN "lodging_type",
        DROP COLUMN "cabin_class",
        DROP COLUMN "children",
        DROP COLUMN "adults",
        DROP COLUMN "trip_type"
    `);
  }
}

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateItinerariesTable1757900000000 implements MigrationInterface {
  name = 'CreateItinerariesTable1757900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.createTable(
      new Table({
        name: 'itineraries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'origin_airport_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'destination_airport_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'departure_date',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'duration_days',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'itineraries',
      new TableIndex({
        name: 'IDX_itineraries_origin_airport_id',
        columnNames: ['origin_airport_id'],
      }),
    );

    await queryRunner.createIndex(
      'itineraries',
      new TableIndex({
        name: 'IDX_itineraries_destination_airport_id',
        columnNames: ['destination_airport_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('itineraries', 'IDX_itineraries_destination_airport_id');
    await queryRunner.dropIndex('itineraries', 'IDX_itineraries_origin_airport_id');
    await queryRunner.dropTable('itineraries');
  }
}

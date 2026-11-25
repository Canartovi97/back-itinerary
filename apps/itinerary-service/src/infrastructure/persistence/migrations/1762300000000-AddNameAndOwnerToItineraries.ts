import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * PROYEC-10 / PROYEC-11: itineraries get a user-facing name and an owner.
 *
 * Existing rows are kept: they get the placeholder name 'Untitled itinerary'
 * and a NULL owner (there is no way to know who created them), which makes
 * them invisible to every user. Deleting a user cascades to their itineraries.
 */
export class AddNameAndOwnerToItineraries1762300000000 implements MigrationInterface {
  name = 'AddNameAndOwnerToItineraries1762300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'itineraries',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '100',
        isNullable: false,
        default: "'Untitled itinerary'",
      }),
    );
    // The default only exists to backfill existing rows.
    await queryRunner.query('ALTER TABLE "itineraries" ALTER COLUMN "name" DROP DEFAULT');

    await queryRunner.addColumn(
      'itineraries',
      new TableColumn({ name: 'user_id', type: 'uuid', isNullable: true }),
    );
    await queryRunner.createForeignKey(
      'itineraries',
      new TableForeignKey({
        name: 'FK_itineraries_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'itineraries',
      new TableIndex({ name: 'IDX_itineraries_user_id', columnNames: ['user_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('itineraries', 'IDX_itineraries_user_id');
    await queryRunner.dropForeignKey('itineraries', 'FK_itineraries_user_id');
    await queryRunner.dropColumn('itineraries', 'user_id');
    await queryRunner.dropColumn('itineraries', 'name');
  }
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'itineraries' })
export class ItineraryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Nullable only for rows created before itineraries had an owner
   * (AddNameAndOwnerToItineraries migration); every new row has one.
   */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'origin_airport_id', type: 'int' })
  originAirportId: number;

  @Column({ name: 'destination_airport_id', type: 'int' })
  destinationAirportId: number;

  @Column({ name: 'departure_date', type: 'timestamptz' })
  departureDate: Date;

  @Column({ name: 'duration_days', type: 'int' })
  durationDays: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'itineraries' })
export class ItineraryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

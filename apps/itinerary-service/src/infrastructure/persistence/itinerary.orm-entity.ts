import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type {
  EmergencyContact,
  PlannedAttraction,
  TourGuide,
  TravelDocument,
} from '../../domain/itinerary-details';

/** Postgres returns NUMERIC as a string; the domain wants a number. */
const numericToNumber = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

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

  @Column({ name: 'trip_type', type: 'varchar', length: 20 })
  tripType: string;

  @Column({ type: 'int' })
  adults: number;

  @Column({ type: 'int' })
  children: number;

  @Column({ name: 'cabin_class', type: 'varchar', length: 20 })
  cabinClass: string;

  @Column({ name: 'lodging_type', type: 'varchar', length: 20 })
  lodgingType: string;

  @Column({ name: 'lodging_name', type: 'varchar', length: 100, nullable: true })
  lodgingName: string | null;

  @Column({ name: 'lodging_address', type: 'varchar', length: 200, nullable: true })
  lodgingAddress: string | null;

  @Column({
    name: 'budget_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: numericToNumber,
  })
  budgetAmount: number | null;

  @Column({ name: 'budget_currency', type: 'varchar', length: 3 })
  budgetCurrency: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb' })
  guides: TourGuide[];

  @Column({ name: 'emergency_contacts', type: 'jsonb' })
  emergencyContacts: EmergencyContact[];

  @Column({ type: 'jsonb' })
  documents: TravelDocument[];

  @Column({ type: 'jsonb' })
  attractions: PlannedAttraction[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

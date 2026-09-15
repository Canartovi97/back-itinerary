import { Itinerary } from '../itinerary.entity';

export interface ItineraryRepository {
  save(itinerary: Itinerary): Promise<Itinerary>;
  findById(id: string): Promise<Itinerary | null>;
  findAll(): Promise<Itinerary[]>;
  update(itinerary: Itinerary): Promise<Itinerary>;
  delete(id: string): Promise<void>;
}

export const ITINERARY_REPOSITORY = Symbol('ITINERARY_REPOSITORY');

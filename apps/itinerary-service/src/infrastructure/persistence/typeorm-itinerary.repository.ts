import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CabinClass,
  Currency,
  ItineraryDetails,
  ItineraryStatus,
  LodgingType,
  TripType,
} from '../../domain/itinerary-details';
import { Itinerary } from '../../domain/itinerary.entity';
import { ItineraryRepository } from '../../domain/ports/itinerary-repository.port';
import { ItineraryOrmEntity } from './itinerary.orm-entity';

@Injectable()
export class TypeOrmItineraryRepository implements ItineraryRepository {
  constructor(
    @InjectRepository(ItineraryOrmEntity)
    private readonly repo: Repository<ItineraryOrmEntity>,
  ) {}

  async save(itinerary: Itinerary): Promise<Itinerary> {
    const entity = this.repo.create({
      userId: itinerary.userId,
      ...this.toColumns(itinerary),
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Itinerary | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByUser(userId: string): Promise<Itinerary[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { departureDate: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(itinerary: Itinerary): Promise<Itinerary> {
    await this.repo.update(itinerary.id as string, this.toColumns(itinerary));
    const updated = await this.repo.findOneOrFail({ where: { id: itinerary.id } });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /** Every column the owner may change (id, user_id and created_at are fixed). */
  private toColumns(itinerary: Itinerary): Omit<ItineraryOrmEntity, 'id' | 'userId' | 'createdAt'> {
    const d = itinerary.details;
    return {
      name: itinerary.name,
      originAirportId: itinerary.originAirportId,
      destinationAirportId: itinerary.destinationAirportId,
      departureDate: itinerary.departureDate,
      durationDays: itinerary.durationDays,
      tripType: d.tripType,
      adults: d.travelers.adults,
      children: d.travelers.children,
      cabinClass: d.travelers.cabinClass,
      lodgingType: d.lodging.type,
      lodgingName: d.lodging.name,
      lodgingAddress: d.lodging.address,
      budgetAmount: d.budget.amount,
      budgetCurrency: d.budget.currency,
      status: d.status,
      notes: d.notes,
      guides: d.guides,
      emergencyContacts: d.emergencyContacts,
      documents: d.documents,
      attractions: d.attractions,
    };
  }

  private toDomain(entity: ItineraryOrmEntity): Itinerary {
    const details: ItineraryDetails = {
      tripType: entity.tripType as TripType,
      travelers: {
        adults: entity.adults,
        children: entity.children,
        cabinClass: entity.cabinClass as CabinClass,
      },
      lodging: {
        type: entity.lodgingType as LodgingType,
        name: entity.lodgingName,
        address: entity.lodgingAddress,
      },
      budget: { amount: entity.budgetAmount, currency: entity.budgetCurrency as Currency },
      status: entity.status as ItineraryStatus,
      notes: entity.notes,
      guides: entity.guides ?? [],
      emergencyContacts: entity.emergencyContacts ?? [],
      documents: entity.documents ?? [],
      attractions: entity.attractions ?? [],
    };
    return Itinerary.create(
      {
        id: entity.id,
        name: entity.name,
        // Legacy rows without an owner map to an id no user has, so they
        // are never returned by the ownership-checked use cases.
        userId: entity.userId ?? '',
        originAirportId: entity.originAirportId,
        destinationAirportId: entity.destinationAirportId,
        departureDate: entity.departureDate,
        durationDays: entity.durationDays,
        details,
        createdAt: entity.createdAt,
      },
      entity.createdAt,
    );
  }
}

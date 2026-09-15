import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      originAirportId: itinerary.originAirportId,
      destinationAirportId: itinerary.destinationAirportId,
      departureDate: itinerary.departureDate,
      durationDays: itinerary.durationDays,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Itinerary | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Itinerary[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async update(itinerary: Itinerary): Promise<Itinerary> {
    await this.repo.update(itinerary.id as string, {
      originAirportId: itinerary.originAirportId,
      destinationAirportId: itinerary.destinationAirportId,
      departureDate: itinerary.departureDate,
      durationDays: itinerary.durationDays,
    });
    const updated = await this.repo.findOneOrFail({ where: { id: itinerary.id } });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(entity: ItineraryOrmEntity): Itinerary {
    return Itinerary.create(
      {
        id: entity.id,
        originAirportId: entity.originAirportId,
        destinationAirportId: entity.destinationAirportId,
        departureDate: entity.departureDate,
        durationDays: entity.durationDays,
        createdAt: entity.createdAt,
      },
      entity.createdAt,
    );
  }
}

import { NotFoundException } from '@nestjs/common';
import { TouristAttractionProvider } from '../domain/ports/tourist-attraction-provider.port';
import { TouristAttraction } from '../domain/tourist-attraction.entity';
import { ListAirportAttractionsUseCase } from './list-airport-attractions.use-case';

class FakeAttractionProvider implements TouristAttractionProvider {
  constructor(private readonly byAirport: Map<number, TouristAttraction[]>) {}

  async findByAirport(airportId: number): Promise<TouristAttraction[] | null> {
    return this.byAirport.get(airportId) ?? null;
  }
}

describe('ListAirportAttractionsUseCase', () => {
  const lajas = new TouristAttraction(
    13,
    'Santuario de las Lajas',
    'Basílica',
    'Ipiales',
    null,
    0.8,
    -77.5,
  );

  it("returns the attractions around the airport's destination", async () => {
    const useCase = new ListAirportAttractionsUseCase(
      new FakeAttractionProvider(new Map([[28, [lajas]]])),
    );

    await expect(useCase.execute(28)).resolves.toEqual([lajas]);
  });

  it('returns an empty list when the destination has no attractions', async () => {
    const useCase = new ListAirportAttractionsUseCase(
      new FakeAttractionProvider(new Map([[5, []]])),
    );

    await expect(useCase.execute(5)).resolves.toEqual([]);
  });

  it('throws NotFoundException for an unknown airport', async () => {
    const useCase = new ListAirportAttractionsUseCase(new FakeAttractionProvider(new Map()));

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });
});

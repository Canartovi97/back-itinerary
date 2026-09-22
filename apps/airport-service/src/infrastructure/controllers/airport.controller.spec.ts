import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GetAirportByIdUseCase } from '../../application/get-airport-by-id.use-case';
import { ListAirportsUseCase } from '../../application/list-airports.use-case';
import { Airport } from '../../domain/airport.entity';
import { AirportProviderUnavailableError } from '../../domain/errors/airport-provider-unavailable.error';
import { AirportController } from './airport.controller';

/**
 * HTTP-entry-point tests for SCRUM-13/16: confirms the controller itself
 * honors the acceptance criteria — a valid id/list returns data, an unknown
 * id propagates as a controlled 404, and an unreachable api-colombia
 * propagates as a controlled 503 (via AirportProviderUnavailableFilter),
 * rather than either being swallowed or turned into a bare 500.
 */
describe('AirportController (SCRUM-13/16)', () => {
  const sampleAirport = Airport.create({
    id: 44,
    name: 'Aeropuerto Militar CATAM',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    iataCode: 'BOG',
    latitude: 4.704754079,
    longitude: -74.15303487,
  });

  async function buildController(
    getAirportByIdUseCase: Pick<GetAirportByIdUseCase, 'execute'>,
    listAirportsUseCase: Pick<ListAirportsUseCase, 'execute'> = { execute: jest.fn() },
  ) {
    const moduleRef = await Test.createTestingModule({
      controllers: [AirportController],
      providers: [
        { provide: ListAirportsUseCase, useValue: listAirportsUseCase },
        { provide: GetAirportByIdUseCase, useValue: getAirportByIdUseCase },
      ],
    }).compile();

    return moduleRef.get(AirportController);
  }

  it('GET /airports/:id returns the airport for a valid id', async () => {
    const controller = await buildController({
      execute: jest.fn().mockResolvedValue(sampleAirport),
    });

    const result = await controller.findOne(44);

    expect(result).toEqual(
      expect.objectContaining({ id: 44, iataCode: 'BOG', name: 'Aeropuerto Militar CATAM' }),
    );
  });

  it('GET /airports/:id propagates a controlled NotFoundException for an unknown id, which Nest maps to HTTP 404', async () => {
    const controller = await buildController({
      execute: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Airport with id 999999 not found')),
    });

    await expect(controller.findOne(999999)).rejects.toMatchObject({
      status: 404,
      response: expect.objectContaining({ message: expect.stringContaining('999999') }),
    });
  });

  it('GET /airports returns the list of Colombian airports (SCRUM-13)', async () => {
    const controller = await buildController(
      { execute: jest.fn() },
      { execute: jest.fn().mockResolvedValue([sampleAirport]) },
    );

    const result = await controller.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: 44, iataCode: 'BOG' }));
  });

  it('GET /airports propagates a controlled error when api-colombia does not respond (SCRUM-13)', async () => {
    const controller = await buildController(
      { execute: jest.fn() },
      { execute: jest.fn().mockRejectedValue(new AirportProviderUnavailableError()) },
    );

    await expect(controller.findAll()).rejects.toThrow(AirportProviderUnavailableError);
  });
});

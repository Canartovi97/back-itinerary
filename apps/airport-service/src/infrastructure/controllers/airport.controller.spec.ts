import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GetAirportByIdUseCase } from '../../application/get-airport-by-id.use-case';
import { ListAirportsUseCase } from '../../application/list-airports.use-case';
import { Airport } from '../../domain/airport.entity';
import { AirportController } from './airport.controller';

/**
 * HTTP-entry-point tests for SCRUM-16: confirms the controller itself
 * honors both acceptance criteria — a valid id returns the airport, and
 * an unknown id propagates as the controlled 404 NestJS maps to an HTTP
 * response (rather than, say, being swallowed or turned into a 500).
 */
describe('AirportController (SCRUM-16)', () => {
  const sampleAirport = Airport.create({
    id: 44,
    name: 'Aeropuerto Militar CATAM',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    iataCode: 'BOG',
    latitude: 4.704754079,
    longitude: -74.15303487,
  });

  async function buildController(getAirportByIdUseCase: Pick<GetAirportByIdUseCase, 'execute'>) {
    const moduleRef = await Test.createTestingModule({
      controllers: [AirportController],
      providers: [
        { provide: ListAirportsUseCase, useValue: { execute: jest.fn() } },
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
});

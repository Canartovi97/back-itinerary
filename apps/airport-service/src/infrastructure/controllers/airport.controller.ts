import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetAirportByIdUseCase } from '../../application/get-airport-by-id.use-case';
import { ListAirportAttractionsUseCase } from '../../application/list-airport-attractions.use-case';
import { ListAirportsUseCase } from '../../application/list-airports.use-case';
import { AirportDto } from '../dto/airport.dto';
import { TouristAttractionDto } from '../dto/tourist-attraction.dto';

@ApiTags('airports')
@Controller('airports')
export class AirportController {
  constructor(
    private readonly listAirportsUseCase: ListAirportsUseCase,
    private readonly getAirportByIdUseCase: GetAirportByIdUseCase,
    private readonly listAirportAttractionsUseCase: ListAirportAttractionsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all Colombian airports',
    description:
      "Sourced from api-colombia.com (GET /Airport) via ApiColombiaAirportAdapter, cached, and mapped to this service's own Airport domain model. Clients should never call api-colombia.com directly — this is the single internal entry point for airport data.",
  })
  @ApiOkResponse({ type: AirportDto, isArray: true })
  @ApiServiceUnavailableResponse({
    description: 'api-colombia.com is unreachable and the circuit breaker is open.',
  })
  async findAll(): Promise<AirportDto[]> {
    const airports = await this.listAirportsUseCase.execute();
    return airports.map((a) => AirportDto.fromDomain(a));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single airport by id',
    description: 'Sourced from api-colombia.com (GET /Airport/{id}) via ApiColombiaAirportAdapter.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: "The airport's numeric id, as assigned by api-colombia.com",
  })
  @ApiOkResponse({ type: AirportDto })
  @ApiNotFoundResponse({ description: 'No airport exists with the given id.' })
  @ApiServiceUnavailableResponse({
    description: 'api-colombia.com is unreachable and the circuit breaker is open.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AirportDto> {
    const airport = await this.getAirportByIdUseCase.execute(id);
    return AirportDto.fromDomain(airport);
  }

  @Get(':id/attractions')
  @ApiOperation({
    summary: "List tourist attractions around an airport's destination",
    description:
      "Sourced from api-colombia.com (GET /Department/{id}/touristicattractions for the airport's department). Used by the itinerary planner to suggest activities.",
  })
  @ApiParam({ name: 'id', type: Number, description: "The airport's numeric id" })
  @ApiOkResponse({ type: TouristAttractionDto, isArray: true })
  @ApiNotFoundResponse({ description: 'No airport exists with the given id.' })
  @ApiServiceUnavailableResponse({
    description: 'api-colombia.com is unreachable and the circuit breaker is open.',
  })
  async findAttractions(@Param('id', ParseIntPipe) id: number): Promise<TouristAttractionDto[]> {
    const attractions = await this.listAirportAttractionsUseCase.execute(id);
    return attractions.map((a) => TouristAttractionDto.fromDomain(a));
  }
}

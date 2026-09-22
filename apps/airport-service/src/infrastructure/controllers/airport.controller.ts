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
import { ListAirportsUseCase } from '../../application/list-airports.use-case';
import { AirportDto } from '../dto/airport.dto';

@ApiTags('airports')
@Controller('airports')
export class AirportController {
  constructor(
    private readonly listAirportsUseCase: ListAirportsUseCase,
    private readonly getAirportByIdUseCase: GetAirportByIdUseCase,
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
}

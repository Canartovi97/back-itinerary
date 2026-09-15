import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List all airports' })
  @ApiOkResponse({ type: AirportDto, isArray: true })
  async findAll(): Promise<AirportDto[]> {
    const airports = await this.listAirportsUseCase.execute();
    return airports.map((a) => AirportDto.fromDomain(a));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an airport by id' })
  @ApiOkResponse({ type: AirportDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AirportDto> {
    const airport = await this.getAirportByIdUseCase.execute(id);
    return AirportDto.fromDomain(airport);
  }
}

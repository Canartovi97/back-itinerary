import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateItineraryUseCase } from '../../application/create-itinerary.use-case';
import { DeleteItineraryUseCase } from '../../application/delete-itinerary.use-case';
import { GetItineraryUseCase } from '../../application/get-itinerary.use-case';
import { ListItinerariesUseCase } from '../../application/list-itineraries.use-case';
import { UpdateItineraryUseCase } from '../../application/update-itinerary.use-case';
import { CreateItineraryDto } from '../dto/create-itinerary.dto';
import { ItineraryDto } from '../dto/itinerary.dto';
import { UpdateItineraryDto } from '../dto/update-itinerary.dto';

@ApiTags('itineraries')
@Controller('itineraries')
export class ItineraryController {
  constructor(
    private readonly createItineraryUseCase: CreateItineraryUseCase,
    private readonly getItineraryUseCase: GetItineraryUseCase,
    private readonly listItinerariesUseCase: ListItinerariesUseCase,
    private readonly updateItineraryUseCase: UpdateItineraryUseCase,
    private readonly deleteItineraryUseCase: DeleteItineraryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new itinerary' })
  @ApiOkResponse({ type: ItineraryDto })
  async create(@Body() dto: CreateItineraryDto): Promise<ItineraryDto> {
    const itinerary = await this.createItineraryUseCase.execute(dto);
    return ItineraryDto.fromDomain(itinerary);
  }

  @Get()
  @ApiOperation({ summary: 'List all itineraries' })
  @ApiOkResponse({ type: ItineraryDto, isArray: true })
  async findAll(): Promise<ItineraryDto[]> {
    const itineraries = await this.listItinerariesUseCase.execute();
    return itineraries.map((i) => ItineraryDto.fromDomain(i));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an itinerary by id' })
  @ApiOkResponse({ type: ItineraryDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ItineraryDto> {
    const itinerary = await this.getItineraryUseCase.execute(id);
    return ItineraryDto.fromDomain(itinerary);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing itinerary' })
  @ApiOkResponse({ type: ItineraryDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItineraryDto,
  ): Promise<ItineraryDto> {
    const itinerary = await this.updateItineraryUseCase.execute(id, dto);
    return ItineraryDto.fromDomain(itinerary);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an itinerary' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteItineraryUseCase.execute(id);
  }
}

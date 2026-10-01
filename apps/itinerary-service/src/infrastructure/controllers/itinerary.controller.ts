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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateItineraryUseCase } from '../../application/create-itinerary.use-case';
import { DeleteItineraryUseCase } from '../../application/delete-itinerary.use-case';
import { GetItineraryUseCase } from '../../application/get-itinerary.use-case';
import { ListItinerariesUseCase } from '../../application/list-itineraries.use-case';
import { UpdateItineraryUseCase } from '../../application/update-itinerary.use-case';
import { CreateItineraryDto } from '../dto/create-itinerary.dto';
import { ItineraryDto } from '../dto/itinerary.dto';
import { UpdateItineraryDto } from '../dto/update-itinerary.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const ID_PARAM = {
  name: 'id',
  format: 'uuid',
  description: "The itinerary's id",
};

@ApiTags('itineraries')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired bearer token.' })
@UseGuards(JwtAuthGuard)
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
  @ApiBadRequestResponse({
    description:
      'A domain rule was violated (same origin/destination, past departure date, non-positive duration) or a field failed validation.',
  })
  @ApiNotFoundResponse({ description: 'The origin or destination airport id does not exist.' })
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
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: ItineraryDto })
  @ApiNotFoundResponse({ description: 'No itinerary exists with the given id.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ItineraryDto> {
    const itinerary = await this.getItineraryUseCase.execute(id);
    return ItineraryDto.fromDomain(itinerary);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing itinerary' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: ItineraryDto })
  @ApiBadRequestResponse({
    description:
      'A domain rule was violated (same origin/destination, past departure date, non-positive duration) or a field failed validation.',
  })
  @ApiNotFoundResponse({
    description:
      'No itinerary exists with the given id, or the new origin/destination airport id does not exist.',
  })
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
  @ApiParam(ID_PARAM)
  @ApiNoContentResponse({ description: 'The itinerary was deleted.' })
  @ApiNotFoundResponse({ description: 'No itinerary exists with the given id.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteItineraryUseCase.execute(id);
  }
}

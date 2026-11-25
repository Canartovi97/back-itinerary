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
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateItineraryUseCase } from '../../application/create-itinerary.use-case';
import { DeleteItineraryUseCase } from '../../application/delete-itinerary.use-case';
import { GetItineraryUseCase } from '../../application/get-itinerary.use-case';
import { ListItinerariesUseCase } from '../../application/list-itineraries.use-case';
import { UpdateItineraryUseCase } from '../../application/update-itinerary.use-case';
import { CreateItineraryDto } from '../dto/create-itinerary.dto';
import { toDetailsInput } from '../dto/itinerary-details.dto';
import { ItineraryDto } from '../dto/itinerary.dto';
import { UpdateItineraryDto } from '../dto/update-itinerary.dto';
import { AuthTokenPayload } from '../../domain/ports/token-issuer.port';
import { CurrentUser } from '../guards/current-user.decorator';
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
      'A domain rule was violated (blank or too long name, invalid trip details such as travelers, guides without contact or duplicated attractions, same origin/destination, past departure date, non-positive duration) or a field failed validation.',
  })
  @ApiNotFoundResponse({ description: 'The origin or destination airport id does not exist.' })
  @ApiServiceUnavailableResponse({
    description: 'Airport Service is unreachable, so the airports could not be validated.',
  })
  async create(
    @Body() dto: CreateItineraryDto,
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<ItineraryDto> {
    const itinerary = await this.createItineraryUseCase.execute({
      name: dto.name,
      userId: user.sub,
      originAirportId: dto.originAirportId,
      destinationAirportId: dto.destinationAirportId,
      departureDate: dto.departureDate,
      durationDays: dto.durationDays,
      details: toDetailsInput(dto),
    });
    return ItineraryDto.fromDomain(itinerary);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's itineraries" })
  @ApiOkResponse({ type: ItineraryDto, isArray: true })
  async findAll(@CurrentUser() user: AuthTokenPayload): Promise<ItineraryDto[]> {
    const itineraries = await this.listItinerariesUseCase.execute(user.sub);
    return itineraries.map((i) => ItineraryDto.fromDomain(i));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an itinerary by id' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: ItineraryDto })
  @ApiNotFoundResponse({
    description: 'No itinerary with the given id exists for the authenticated user.',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<ItineraryDto> {
    const itinerary = await this.getItineraryUseCase.execute(id, user.sub);
    return ItineraryDto.fromDomain(itinerary);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing itinerary' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: ItineraryDto })
  @ApiBadRequestResponse({
    description:
      'A domain rule was violated (blank or too long name, invalid trip details such as travelers, guides without contact or duplicated attractions, same origin/destination, past departure date, non-positive duration) or a field failed validation.',
  })
  @ApiNotFoundResponse({
    description:
      'No itinerary with the given id exists for the authenticated user, or the new origin/destination airport id does not exist.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Airport Service is unreachable, so the new airports could not be validated.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItineraryDto,
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<ItineraryDto> {
    const itinerary = await this.updateItineraryUseCase.execute(id, user.sub, {
      name: dto.name,
      originAirportId: dto.originAirportId,
      destinationAirportId: dto.destinationAirportId,
      departureDate: dto.departureDate,
      durationDays: dto.durationDays,
      details: toDetailsInput(dto),
    });
    return ItineraryDto.fromDomain(itinerary);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an itinerary' })
  @ApiParam(ID_PARAM)
  @ApiNoContentResponse({ description: 'The itinerary was deleted.' })
  @ApiNotFoundResponse({
    description: 'No itinerary with the given id exists for the authenticated user.',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<void> {
    await this.deleteItineraryUseCase.execute(id, user.sub);
  }
}

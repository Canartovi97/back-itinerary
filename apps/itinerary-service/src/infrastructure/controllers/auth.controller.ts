import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUseCase } from '../../application/login.use-case';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto): Promise<{ id: string; email: string }> {
    const user = await this.registerUserUseCase.execute(dto.email, dto.password);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive a JWT' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { accessToken } = await this.loginUseCase.execute(dto.email, dto.password);
    return AuthResponseDto.of(accessToken);
  }
}

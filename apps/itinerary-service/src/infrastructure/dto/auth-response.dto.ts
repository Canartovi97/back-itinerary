import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  static of(accessToken: string): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    return dto;
  }
}

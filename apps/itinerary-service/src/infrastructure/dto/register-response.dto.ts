import { ApiProperty } from '@nestjs/swagger';

/**
 * A plain `{ id, email }` return type documents as an opaque, untyped
 * object in Swagger — this gives it a real schema.
 */
export class RegisterResponseDto {
  @ApiProperty({ example: 'b3f1c2a0-5e4d-4b8a-9c1e-2f3a4b5c6d7e' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;
}

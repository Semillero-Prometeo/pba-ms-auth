import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestUserDto } from 'src/core/dto/request-user.dto';

export class InactiveUserDto {
  @IsUUID('4')
  @IsNotEmpty()
  user_id: string;

  @IsOptional()
  @IsString({ message: 'La razón debe ser un texto' })
  @MaxLength(250, { message: 'La razón debe tener un máximo de 250 caracteres' })
  reason?: string;
}

export class InactiveUserPayload {
  @IsObject()
  @ValidateNested()
  @Type(() => InactiveUserDto)
  inactiveUserDto: InactiveUserDto;

  @IsObject()
  @ValidateNested()
  @Type(() => RequestUserDto)
  requestUser: RequestUserDto;
}

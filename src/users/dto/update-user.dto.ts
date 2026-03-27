import {
  IsOptional,
  IsEmail,
  IsInt,
  IsDateString,
  IsString,
  IsBoolean,
  MinLength,
  Matches,
  IsUUID,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Type } from 'class-transformer';
import { RequestUserDto } from 'src/core/dto/request-user.dto';

export class UpdateAuthUserDto {
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  @IsOptional()
  id: string;

  @IsOptional()
  @IsEmail()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*(?:\d|[^\w\s]))(?!.*[.\n]).*$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número o un caracter especial',
  })
  password?: string;
}

export class UpdateAuthUserPayload {
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El id es requerido' })
  id: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateAuthUserDto)
  updateAuthUserDto: UpdateAuthUserDto;

  @IsObject()
  @ValidateNested()
  @Type(() => RequestUserDto)
  requestUser: RequestUserDto;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsInt()
  failed_attempts?: number;

  @IsOptional()
  @IsDateString()
  lock_until?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsBoolean()
  is_first_login?: boolean;

  @IsOptional()
  @IsString()
  deleted_at?: string;
}

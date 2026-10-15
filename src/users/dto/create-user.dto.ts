import { Roles } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  IsEmail,
  ValidateNested,
  IsObject,
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { RequestUserDto } from 'src/core/dto/request-user.dto';

export class PersonInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

  @IsUUID('4')
  @IsNotEmpty()
  document_type_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  document_number: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  phone?: string;
}

export class CreateUserDto {
  @IsUUID('4')
  @IsOptional()
  person_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsEmail()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*(?:\d|[^\w\s]))(?!.*[.\n]).*$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número o un caracter especial',
  })
  password: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  role_ids: string[];

  @IsUUID('4')
  @IsOptional()
  role_id?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PersonInputDto)
  person: PersonInputDto;
}

export class CreatePayload {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateUserDto)
  createUserDto: CreateUserDto;
}

export class CreateUserWithoutPersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsEmail()
  username: string;

  @IsUUID('4')
  @IsOptional()
  person_id?: string;
}

export class CreateManyPayload {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserWithoutPersonDto)
  users: CreateUserWithoutPersonDto[];

  @IsString()
  @IsNotEmpty()
  @IsEnum(Roles)
  roleName: Roles;
}

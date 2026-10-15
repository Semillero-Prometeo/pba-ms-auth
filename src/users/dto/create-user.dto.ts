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

  @IsBoolean()
  @IsOptional()
  assign_student_role?: boolean;
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

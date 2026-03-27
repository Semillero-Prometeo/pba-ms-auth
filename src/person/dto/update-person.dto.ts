import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';

export class UpdatePersonDto {
  @IsUUID('4')
  @IsString({ message: 'El id de la persona debe ser un string' })
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  first_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  last_name?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(40)
  email?: string;
}

export class UpdatePersonPayload {
  @IsUUID('4')
  @IsString({ message: 'El id de la persona debe ser un string' })
  id: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  updatePersonDto: UpdatePersonDto;
}

import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindOneDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo id es requerido' })
  id: string;

  @IsOptional()
  @IsDateString()
  startAt?: Date;
}
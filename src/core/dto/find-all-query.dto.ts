import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindAllQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo skip debe ser un número entero' })
  @Min(0, { message: 'El campo skip no puede ser menor a 0' })
  skip?: number = 0; // Valor por defecto

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo take debe ser un número entero' })
  @IsPositive({ message: 'El campo take debe ser un número positivo' })
  @Max(100, { message: 'El campo take no puede ser mayor a 100' })
  take?: number = 20; // Valor por defecto

  @IsOptional()
  @IsString({ message: 'El campo search debe ser un string' })
  @Transform(({ value }) => value.trim())
  search?: string;

  @IsOptional()
  @IsString({ message: 'El campo start_date debe ser un string' })
  @Type(() => String)
  @Transform(({ value }) => value.trim())
  start_date?: string;

  @IsOptional()
  @IsString({ message: 'El campo end_date debe ser un string' })
  @Type(() => String)
  @Transform(({ value }) => value.trim())
  end_date?: string;
}

export class FindOnePersonUniqueDto {
  @IsString({ message: 'El campo unique debe ser un string' })
  @IsNotEmpty({ message: 'El campo unique es requerido' })
  unique: string;
}

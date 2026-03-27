import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Roles } from '@prisma/client';

export class FindAllUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo skip debe ser un número entero' })
  @Min(0, { message: 'El campo skip no puede ser menor a 0' })
  skip: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El campo take debe ser un número entero' })
  @IsPositive({ message: 'El campo take debe ser un número positivo' })
  @Max(100, { message: 'El campo take no puede ser mayor a 100' })
  take: number = 20;

  @IsOptional()
  @IsString({ message: 'El campo search debe ser un string' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsArray({ message: 'El campo roles debe ser un array de strings' })
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID v4 válido' })
  roles?: string[];
}

export class FindByIdsOrRoleQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsArray({ message: 'El campo ids debe ser un array de strings' })
  @IsUUID('4', { each: true, message: 'Cada id debe ser un UUID v4 válido' })
  ids?: string[];

  @IsOptional()
  @IsEnum(Roles, { message: 'El campo roleName debe ser un rol válido' })
  roleName?: Roles;
}

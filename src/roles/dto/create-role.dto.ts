import { Roles } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsEnum(Roles, { message: 'Campo name debe ser un rol válido' })
  @IsNotEmpty({ message: 'Campo name no debe estar vacío' })
  name: Roles;
}
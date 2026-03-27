import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class RequestUserDto {
  @IsUUID('4', { message: 'El campo id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El campo id es requerido' })
  id: string;

  @IsArray({ message: 'El campo roles debe ser un array' })
  @IsNotEmpty({ message: 'El campo roles es requerido' })
  roles: string[];
}

import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { RequestUserDto } from 'src/core/dto/request-user.dto';

export class SetRoleDto {
  @IsString({ message: 'El campo userId debe ser de tipo string' })
  @IsNotEmpty({ message: 'El campo userId no debe estar vacío' })
  userId: string;

  @IsArray({ message: 'El campo rolesId debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un roleId' })
  @IsString({ each: true, message: 'Cada roleId debe ser de tipo string' })
  rolesId: string[];
}

export class SetRolePayload {
  @IsObject()
  @ValidateNested()
  @Type(() => SetRoleDto)
  setRoleDto: SetRoleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => RequestUserDto)
  requestUser: RequestUserDto;
}
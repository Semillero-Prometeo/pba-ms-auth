import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { RequestUserDto } from 'src/core/dto/request-user.dto';

export class SetRoleDto {
  @IsString({ message: 'El campo user_id debe ser de tipo string' })
  @IsNotEmpty({ message: 'El campo user_id no debe estar vacío' })
  user_id: string;

  @IsArray({ message: 'El campo roles_id debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un role_id' })
  @IsString({ each: true, message: 'Cada role_id debe ser de tipo string' })
  roles_id: string[];
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
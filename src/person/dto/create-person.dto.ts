import { IsString, IsOptional, IsNotEmpty, IsEmail, IsUUID, MaxLength, IsEnum } from 'class-validator';
import { PersonType } from '../enum/person.enum';

export class CommonPersonDto {
  @IsUUID('4', { message: 'El tipo de documento no es válido' })
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  document_type_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(50)
  last_name: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @MaxLength(11)
  document_number: string;

  @IsString()
  @IsOptional({ message: 'El teléfono es requerido' })
  @MaxLength(15)
  phone?: string;
}

export class CommonCreateCompletePersonDto extends CommonPersonDto {
  // @IsUUID('4')
  @IsNotEmpty({ message: 'El país es requerido' })
  country_id: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}

export class CreatePersonDto extends CommonCreateCompletePersonDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @MaxLength(40, { message: 'El correo electrónico no puede tener más de 40 caracteres' })
  email: string;

  @IsOptional({ message: 'El tipo de persona es requerido' })
  @IsUUID('4', { message: 'El tipo de persona no es válido' })
  person_type_id?: string;
}

import { IsOptional, IsString } from 'class-validator';
import { DocumentTypes } from '@prisma/client';

export class PersonUploadDto {
  TIPO_DE_DOCUMENTO: DocumentTypes = DocumentTypes.NATIONAL_ID;

  NUMERO_DE_DOCUMENTO: number = 0;

  NOMBRE: string = '';

  APELLIDO: string = '';

  CORREO: string = '';
  
  NUMERO_DE_TELEFONO: number = 0;

  PAIS: string = '';

  FECHA_DE_NACIMIENTO: string = '';

  @IsOptional()
  @IsString()
  ROLE?: string;
}

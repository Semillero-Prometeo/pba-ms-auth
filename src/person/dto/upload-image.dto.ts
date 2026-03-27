import { Type } from "class-transformer";
import {
    IsNotEmpty,
    IsString
} from "class-validator";
import { UploadedFileDTO } from "./uploaded-file.dto";

export class UploadedImageDto {
    @IsNotEmpty({ message: 'Debe seleccionar al menos un archivo' })
    @Type(() => UploadedFileDTO)
    file: UploadedFileDTO;

    @IsString({ message: 'El ID de la persona debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El ID de la persona no puede estar vacío' })
    person_id: string;
}

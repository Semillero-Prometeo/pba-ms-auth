// Class Validator  
import {
    IsNotEmpty,
    IsString
} from "class-validator";
import { UploadedFileInterface } from "../interfaces/upload";

export class UploadedFileDTO implements UploadedFileInterface {
    @IsString({ message: 'El nombre original del archivo debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre original del archivo no puede estar vacío' })
    originalname: string;

    @IsNotEmpty({ message: 'El buffer del archivo no puede estar vacío' })
    buffer: Buffer<ArrayBufferLike>;

    @IsNotEmpty()
    mimetype: string;
}
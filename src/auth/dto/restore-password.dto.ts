import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class RestorePasswordDto {
  @IsEmail()
  @IsOptional()
  @MaxLength(40)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El origin es requerido' })
  origin: string;
}


export class SetPasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número o un caracter especial',
  })
  newPassword: string;

  // @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El userId es requerido' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;
}

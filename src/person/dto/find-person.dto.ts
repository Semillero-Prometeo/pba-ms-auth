import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PersonType } from "../enum/person.enum";
import { FindAllQueryDto } from "src/core/dto/find-all-query.dto";

export class FindPersonByDocumentDto {
  @IsString()
  document_type_id: string;

  @IsString()
  document_number: string;

  @IsOptional()
  email?: string;
}

export class FindAllPersonsDto extends FindAllQueryDto {
  @IsOptional()
  @IsEnum(PersonType)
  @IsNotEmpty()
  person_type?: PersonType;
}
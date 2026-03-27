import { country, document_type, person } from "@prisma/client";
import { Company } from "src/companies/interfaces/company";
import { DocumentTypeBuilder } from "src/request-builder/interfaces/request-builder";

export interface PersonResponse extends person {
  document_type?: document_type;
  country?: country;
}
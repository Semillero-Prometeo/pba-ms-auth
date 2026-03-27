import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonRepository } from './repositories/person.repository';
import { RpcException } from '@nestjs/microservices';
import { FindAllPersonsDto } from './dto/find-person.dto';
import { DocumentTypesService } from 'src/document-types/document-types.service';
import { UsersService } from 'src/users/users.service';
import { PaginatedResponse } from 'src/core/interfaces/paginated';
import { person } from '@prisma/client';
@Injectable()
export class PersonService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly documentTypeService: DocumentTypesService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(createPersonDto: CreatePersonDto) {
    const documentType = await this.documentTypeService.findOne(createPersonDto.document_type_id);
    if (!documentType) {
      throw new RpcException({
        message: `El tipo de documento con id ${createPersonDto.document_type_id} no existe`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    return this.personRepository.create(createPersonDto);
  }

  async findAll(query: FindAllPersonsDto): Promise<PaginatedResponse<person>> {
    return this.personRepository.findAll(query);
  }

  async findOne(id: string): Promise<person | null> {
    return this.personRepository.findOne(id);
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    const currentPerson = await this.personRepository.findOne(id);
    if (!currentPerson) {
      throw new RpcException({
        message: `La persona con id ${id} no existe`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (updatePersonDto.email) {
      const personEmail = await this.personRepository.findOne(updatePersonDto.email);

      if (personEmail && personEmail.id !== id) {
        throw new RpcException({
          message: 'Ya existe un usuario registrado con esta información de registro. ¿Olvidaste tu contraseña?',
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    }

    return this.personRepository.update(id, { data: updatePersonDto });
  }

  async remove(id: string) {
    const currentPerson = await this.personRepository.findOne(id);
    if (!currentPerson) {
      throw new RpcException({
        message: `La persona con id ${id} no existe`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    return this.personRepository.remove(id);
  }
}

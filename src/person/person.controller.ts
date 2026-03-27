import { Controller } from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonPayload } from './dto/update-person.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindAllPersonsDto } from './dto/find-person.dto';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { FindOneDto } from 'src/core/dto/find-one.dto';
import { PersonUploadDto } from './dto/person-upload.dto';
import { UserResponse } from 'src/users/interfaces/user';

@Controller()
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @MessagePattern(`${AUTH_MS}.personService.create`)
  create(@Payload() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  @MessagePattern(`${AUTH_MS}.personService.findAll`)
  findAll(@Payload() query: FindAllPersonsDto) {
    return this.personService.findAll(query);
  }

  @MessagePattern(`${AUTH_MS}.personService.findOne`)
  findOne(@Payload() { id }: FindOneDto) {
    return this.personService.findOne(id);
  }

  @MessagePattern(`${AUTH_MS}.personService.update`)
  update(@Payload() updatePersonPayload: UpdatePersonPayload) {
    const { id, updatePersonDto } = updatePersonPayload;
    return this.personService.update(id, updatePersonDto);
  }
}

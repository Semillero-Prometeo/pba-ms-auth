import { person, Prisma } from '@prisma/client';
import { CreatePersonDto } from '../dto/create-person.dto';
import { isUUID } from 'class-validator';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UpdatePersonDto } from '../dto/update-person.dto';
import { RpcException } from '@nestjs/microservices';
import { FindAllPersonsDto, FindPersonByDocumentDto } from '../dto/find-person.dto';
import { PrismaService } from 'src/core/database/database.service';
import { hasPersonChanged } from '../utils/person.utils';
import { PersonResponse } from '../interfaces/person';

@Injectable()
export class PersonRepository {
  private readonly logger: Logger = new Logger(PersonRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(createPersonDto: CreatePersonDto) {
    if (createPersonDto.email) {
      const personEmail = await this.prismaService.person.findFirst({
        where: { email: createPersonDto.email, deleted_at: null },
      });
      if (personEmail) {
        throw new RpcException({
          message: `Ya existe una persona registrada con este correo electrónico`,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    }

    const personId = await this.prismaService.person.findUnique({
      where: {
        document_number_document_type_id: {
          document_type_id: createPersonDto.document_type_id,
          document_number: createPersonDto.document_number,
        },
        deleted_at: null,
      },
    });
    if (personId) {
      throw new RpcException({
        message: `Ya existe una persona registrada con este número y tipo de documento`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const data: Prisma.personCreateInput = {
      first_name: createPersonDto.first_name,
      last_name: createPersonDto.last_name,
      email: createPersonDto.email,
      document_number: createPersonDto.document_number,
      phone: createPersonDto.phone,
      document_type: { connect: { id: createPersonDto.document_type_id } },
      image_url: createPersonDto.image_url,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      synchronized_at: null,
    };

    return this.prismaService.person.create({
      data,
    });
  }

  async findAll({ skip, take, search: contains }: FindAllPersonsDto) {
    const defaultWhere: Prisma.personWhereInput = { deleted_at: null };
    const where: Prisma.personWhereInput = contains
      ? {
          OR: [
            { first_name: { contains } },
            { last_name: contains },
            { email: { contains } },
            { document_number: { contains } },
          ],
          ...defaultWhere,
        }
      : { ...defaultWhere };

    const total = await this.prismaService.person.count({ where });
    const data = await this.prismaService.person.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take,
    });

    return { total, data };
  }

  async findOne(unique: string) {
    const include: Prisma.personInclude = {
      document_type: true,
      user: true,
    };

    if (isUUID(unique)) {
      return await this.prismaService.person.findUnique({
        include,
        where: { id: unique, deleted_at: null },
      });
    }

    return await this.prismaService.person.findFirst({
      include,
      where: { email: unique, deleted_at: null },
    });
  }

  async update(unique: string, updatePersonDto: Prisma.personUpdateManyArgs) {
    const where: Prisma.personWhereInput = isUUID(unique)
      ? { id: unique, deleted_at: null }
      : { email: unique, deleted_at: null };

    // First update the person
    await this.prismaService.person.updateMany({ where, ...updatePersonDto });

    // Then return the updated person
    if (isUUID(unique)) {
      return this.prismaService.person.findUnique({
        where: { id: unique, deleted_at: null },
      });
    } else {
      return this.prismaService.person.findFirst({
        where: { email: unique, deleted_at: null },
      });
    }
  }

  remove(unique: string) {
    const deleted_at = new Date();
    const where: Prisma.personWhereInput = isUUID(unique) ? { id: unique } : { email: unique };

    return this.prismaService.person.updateMany({ where, data: { deleted_at } });
  }

  findOneByDocument(document_type_id: string, document_number: string, show_deleted: boolean = false) {
    return this.prismaService.person.findUnique({
      where: {
        document_number_document_type_id: {
          document_type_id,
          document_number,
        },
        deleted_at: show_deleted ? undefined : null,
      },
    });
  }

  async findAllByDocuments(documents: FindPersonByDocumentDto[], show_deleted: boolean = false) {
    const where: Prisma.personWhereInput = { deleted_at: show_deleted ? undefined : null, OR: [] };
    documents.forEach((document) => {
      where.OR.push({
        document_number: document.document_number.toString(),
        document_type_id: document.document_type_id,
      });
      if (document.email) {
        where.OR.push({ email: document.email });
      }
    });

    return this.prismaService.person.findMany({ where });
  }

  async upsertMany(persons: CreatePersonDto[]): Promise<person[]> {
    this.logger.log(`Upserting ${persons.length} persons`);

    const existingPersons: person[] = await this.findAllByDocuments(
      persons.map((person: CreatePersonDto) => ({
        document_type_id: person.document_type_id,
        document_number: person.document_number,
        email: person.email,
      })),
      true,
    );

    const existingPersonsMap: Map<string, person> = new Map<string, person>();

    existingPersons.forEach((existingPerson: person) => {
      existingPersonsMap.set(`${existingPerson.document_type_id}_${existingPerson.document_number}`, existingPerson);
      if (existingPerson.email) {
        existingPersonsMap.set(existingPerson.email, existingPerson);
      }
    });

    this.logger.log(`Found ${existingPersons.length} existing persons`);

    const personsToUpdate: { person: CreatePersonDto; existingPerson: person }[] = [];
    const personsToCreate: CreatePersonDto[] = [];
    const personsWithoutChanges: person[] = [];

    persons.forEach((person: CreatePersonDto) => {
      const keyExists: person | undefined = existingPersonsMap.get(
        `${person.document_type_id}_${person.document_number}`,
      );
      const emailExists: person | undefined = existingPersonsMap.get(person.email);

      const existingPerson: person | undefined = keyExists || emailExists;

      if (existingPerson) {
        if (hasPersonChanged(person, existingPerson)) {
          personsToUpdate.push({ person, existingPerson });
        } else {
          personsWithoutChanges.push(existingPerson);
        }
      } else {
        personsToCreate.push(person);
      }
    });

    const results: person[] = [];

    results.push(...personsWithoutChanges);

    if (personsToUpdate.length) {
      this.logger.log(`Have found ${personsToUpdate.length} persons with changes to update`);
      const UPDATE_BATCH_SIZE: number = 20;

      for (let i = 0; i < personsToUpdate.length; i += UPDATE_BATCH_SIZE) {
        const updateBatch = personsToUpdate.slice(i, i + UPDATE_BATCH_SIZE);

        const updateResults = await this.prismaService.$transaction(
          async (prisma) => {
            const updatePromises = updateBatch.map(async ({ person, existingPerson }) => {
              const updatedPerson: PersonResponse = await prisma.person.update({
                where: { id: existingPerson.id },
                data: {
                  ...person,
                },
                include: {
                  document_type: true,
                },
              });

              return updatedPerson;
            });

            return Promise.all(updatePromises);
          },
          {
            timeout: 10000,
          },
        );

        results.push(
          ...updateResults.map((result) => ({
            ...result,
            document_type: result.document_type,
          })),
        );
      }
    }

    if (personsToCreate.length) {
      this.logger.log(`Have found ${personsToCreate.length} persons to create`);

      let createManyPersons: Prisma.personCreateManyInput[] = [];

      personsToCreate.map(async (person: CreatePersonDto) => {
        const { country_id, document_type_id, person_type_id, ...personData } = person;

        createManyPersons.push({
          first_name: person.first_name,
          last_name: person.last_name,
          email: person.email,
          document_number: person.document_number,
          phone: person.phone,
          document_type_id: person.document_type_id,
        });
      });

      await this.prismaService.person.createMany({
        data: createManyPersons,
      });

      const createdPersons: person[] = await this.prismaService.person.findMany({
        where: {
          email: {
            in: createManyPersons.map((person: Prisma.personCreateManyInput) => person.email),
          },
        },
      });

      results.push(...createdPersons);
    }

    this.logger.log(
      `A total of ${results.length} persons were upserted. Updated ${personsToUpdate.length} persons and created ${personsToCreate.length} persons`,
    );

    return results;
  }
}

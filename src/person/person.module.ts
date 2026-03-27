import { forwardRef, Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { PersonRepository } from './repositories/person.repository';
import { DocumentTypesModule } from 'src/document-types/document-types.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DocumentTypesModule, forwardRef(() => UsersModule)],
  controllers: [PersonController],
  providers: [PersonService, PersonRepository],
  exports: [PersonService],
})
export class PersonModule {}

import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/database/database.module';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UsersController } from './users.controller';
import { PersonModule } from 'src/person/person.module';
import { RolesModule } from 'src/roles/roles.module';
import { DocumentTypesModule } from 'src/document-types/document-types.module';
import { AppSettingsModule } from 'src/app-settings/app-settings.module';
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    PersonModule,
    forwardRef(() => RolesModule),
    DocumentTypesModule,
    AppSettingsModule,
  ],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

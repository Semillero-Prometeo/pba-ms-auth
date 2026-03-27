import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { configRoot } from './core/settings/app.setting';
import { UsersModule } from './users/users.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { AppController } from './app.controller';
import { PersonModule } from './person/person.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot(configRoot()),
    AuthModule,
    UsersModule,
    PersonModule,
    DocumentTypesModule,
    RolesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

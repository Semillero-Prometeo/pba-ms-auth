import { forwardRef, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesRepository } from './repositories/roles.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RolesController],
  imports: [forwardRef(() => UsersModule)],
  providers: [RolesService, RolesRepository],
  exports: [RolesService],
})
export class RolesModule {}

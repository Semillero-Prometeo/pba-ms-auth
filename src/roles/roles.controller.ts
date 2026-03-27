import { Controller } from '@nestjs/common';
import { RolesService } from './roles.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { FindOneDto } from 'src/core/dto/find-one.dto';
import { FindAllQueryDto } from 'src/core/dto/find-all-query.dto';
import { SetRoleDto, SetRolePayload } from './dto/set-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @MessagePattern(`${AUTH_MS}.rolesService.findAll`)
  findAll(@Payload() query: FindAllQueryDto) {
    return this.rolesService.findAll(query);
  }

  @MessagePattern(`${AUTH_MS}.rolesService.findOne`)
  findOne(@Payload() { id }: FindOneDto) {
    return this.rolesService.findOne(id);
  }

  @MessagePattern(`${AUTH_MS}.rolesService.setRoles`)
  setRoles(@Payload() setRolesDto: SetRoleDto) {
    return this.rolesService.setRoles(setRolesDto);
  }

  @MessagePattern(`${AUTH_MS}.rolesService.createRole`)
  createRole(@Payload() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @MessagePattern(`${AUTH_MS}.rolesService.deleteRole`)
  deleteRole(@Payload() id: string) {
    return this.rolesService.deleteRole(id);
  }
}

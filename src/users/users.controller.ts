import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { FindAllUsersQueryDto, FindByIdsOrRoleQueryDto } from './dto/find-all-user.dto';
import { FindOneDto } from 'src/core/dto/find-one.dto';
import { CreatePayload } from './dto/create-user.dto';
import { UpdateAuthUserPayload } from './dto/update-user.dto';
import { InactiveUserDto, InactiveUserPayload } from './dto/delete-user.dto';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @MessagePattern(`${AUTH_MS}.usersService.findAll`)
  findAll(@Payload() query: FindAllUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @MessagePattern(`${AUTH_MS}.usersService.findOne`)
  findOne(@Payload() { id }: FindOneDto) {
    return this.usersService.findOne(id);
  }

  @MessagePattern(`${AUTH_MS}.usersService.create`)
  create(@Payload() createPayload: CreatePayload) {
    const { createUserDto } = createPayload;
    return this.usersService.create(createUserDto);
  }

  @MessagePattern(`${AUTH_MS}.usersService.updateAuthUser`)
  updateAuthUser(@Payload() updateAuthUserPayload: UpdateAuthUserPayload) {
    const { id, updateAuthUserDto } = updateAuthUserPayload;
    return this.usersService.updateAuthUser(id, updateAuthUserDto);
  }

  @MessagePattern(`${AUTH_MS}.usersService.inactive`)
  inactive(@Payload() inactiveUserPayload: InactiveUserPayload) {
    const { inactiveUserDto, requestUser } = inactiveUserPayload;
    return this.usersService.inactive(inactiveUserDto, requestUser);
  }

  @MessagePattern(`${AUTH_MS}.usersService.active`)
  active(@Payload() inactiveUserDto: InactiveUserDto) {
    return this.usersService.active(inactiveUserDto);
  }

  @MessagePattern(`${AUTH_MS}.usersService.findByIdsOrRole`)
  findByIdsOrRole(@Payload() query: FindByIdsOrRoleQueryDto) {
    return this.usersService.findByIdsOrRole(query);
  }
}

import { Controller } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import {
  AppSettingsDto,
  AppSettingsFindOneDto,
  AppSettingsPayload,
  AppSettingsUpdateManyDto,
} from './dto/app-settings.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { FindOneDto } from 'src/core/dto/find-one.dto';
import { AppSettings } from '@prisma/client';

@Controller()
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @MessagePattern(`${AUTH_MS}.appSettingsService.findAll`)
  findAll() {
    return this.appSettingsService.findAll();
  }

  @MessagePattern(`${AUTH_MS}.appSettingsService.findOne`)
  findOne(@Payload() { key }: AppSettingsFindOneDto) {
    return this.appSettingsService.findOne(key);
  }

  @MessagePattern(`${AUTH_MS}.appSettingsService.getSetting`)
  getSetting(@Payload() { id, startAt }: FindOneDto) {
    return this.appSettingsService.getSetting(id as AppSettings, startAt);
  }

  @MessagePattern(`${AUTH_MS}.appSettingsService.update`)
  update(@Payload() appSettingsPayload: AppSettingsPayload) {
    const { id, appSettingsDto } = appSettingsPayload;
    return this.appSettingsService.update(id as AppSettings, appSettingsDto);
  }

  @MessagePattern(`${AUTH_MS}.appSettingsService.updateMany`)
  updateMany(@Payload() appSettingsUpdateManyDto: AppSettingsUpdateManyDto) {
    return this.appSettingsService.updateMany(appSettingsUpdateManyDto);
  }
}

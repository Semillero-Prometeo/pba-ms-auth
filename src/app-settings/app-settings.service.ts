import { HttpStatus, Injectable } from '@nestjs/common';
import { AppSettingsRepository } from './app-settings.repository';
import { AppSettingsDto, AppSettingsUpdateManyDto } from './dto/app-settings.dto';
import { VALID_UPDATE_SETTING_CATEGORY } from './constants/app-settings.constant';
import { RpcException } from '@nestjs/microservices';
import { app_settings, AppSettings } from '@prisma/client';

@Injectable()
export class AppSettingsService {
  constructor(private readonly appSettingsRepository: AppSettingsRepository) {}

  async findOne(key: AppSettings): Promise<app_settings | null> {
    return this.appSettingsRepository.findOne(key);
  }

  async getSetting(key: AppSettings, startAt?: Date) {
    return this.appSettingsRepository.getSetting(key, startAt);
  }

  async getSettings(key: AppSettings, deleted?: boolean) {
    return this.appSettingsRepository.getSettings(key, deleted);
  }

  validateConfigurationSetting(setting: app_settings, settingName: string): void {
    if (!setting) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La configuración ${settingName} no existe`,
      });
    }
  }

  findAll() {
    return this.appSettingsRepository.findAll();
  }

  async update(key: AppSettings, { value, startAt }: AppSettingsDto) {
    const setting = await this.appSettingsRepository.getSetting(key);
    if (!setting) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La configuración ${key} no existe`,
      });
    }

    const settingDate = new Date(setting.start_at).toISOString().split('T')[0];
    const startAtDate = new Date(startAt).toISOString().split('T')[0];

    if (settingDate === startAtDate) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La fecha de inicio ${startAtDate} debe ser diferente a la fecha de inicio de la configuración ${key} ${settingDate}`,
      });
    }

    if (settingDate > startAtDate) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La fecha de inicio ${startAtDate} debe ser posterior a la fecha de inicio de la configuración ${key} ${settingDate}`,
      });
    }

    const updatedSetting = await this.appSettingsRepository.update(key, value, startAt);

    return { updatedSetting };
  }

  async updateMany(appSettingsUpdateManyDto: AppSettingsUpdateManyDto) {
    const { appSettingsDto, updateSettingCategory } = appSettingsUpdateManyDto;

    // Validar que todos los valores pertenezcan al conjunto válido
    const validSettings = new Set(VALID_UPDATE_SETTING_CATEGORY[updateSettingCategory]);
    
    const hasInvalidSetting = appSettingsDto.some(({ key }) => !validSettings.has(key));

    if (hasInvalidSetting) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El conjunto de configuraciones no es válido',
      });
    }

    // Validar que todos tengan el mismo startAt
    const uniqueStartAt = new Set(appSettingsDto.map((setting) => setting.startAt));
    if (uniqueStartAt.size > 1) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Todos los ajustes deben tener la misma fecha de inicio',
      });
    }

    const startAt = appSettingsDto[0]?.startAt;
    if (!startAt) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'La fecha de inicio es requerida para todos los ajustes',
      });
    }

    // Obtener configuraciones existentes en una sola consulta
    const settings = await Promise.all(
      appSettingsDto.map(({ key }) => this.appSettingsRepository.getSetting(key as AppSettings)),
    );

    // Validar que todas las configuraciones existan
    if (settings.some((setting) => !setting)) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Una o más configuraciones no existen',
      });
    }

    // Validar que el startAt sea válido comparando con la última fecha
    const lastStartAt = new Date(Math.max(...settings.map((s) => new Date(s.start_at).getTime())));
    if (new Date(startAt) <= lastStartAt) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `La fecha de inicio debe ser posterior a ${lastStartAt.toISOString()}`,
      });
    }

    // Actualizar todas las configuraciones
    await Promise.all(
      appSettingsDto.map(({ key, value }) => this.appSettingsRepository.update(key as AppSettings, value, startAt)),
    );

    return {
      message: 'Configuraciones actualizadas correctamente',
      updatedSettings: appSettingsDto,
    };
  }
}

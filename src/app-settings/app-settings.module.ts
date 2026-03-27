import { Module } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { AppSettingsController } from './app-settings.controller';
import { AppSettingsRepository } from './app-settings.repository';

@Module({
  controllers: [AppSettingsController],
  providers: [AppSettingsService, AppSettingsRepository],
  exports: [AppSettingsService, AppSettingsRepository],
})
export class AppSettingsModule {}

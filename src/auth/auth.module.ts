import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../core/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthStrategy } from './strategies/auth.strategy';
import { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configurations from 'src/core/settings/app.setting';
import { UsersModule } from 'src/users/users.module';
import { SessionService } from './services/session.service';
import { SessionRepository } from './repositories/session.repository';
import { PasswordGeneratorService } from './services/password-generator.service';
import { AppSettingsModule } from 'src/app-settings/app-settings.module';
@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AppSettingsModule,
    PassportModule.register({ defaultStrategy: 'auth-strategy' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forRoot()],
      inject: [configurations.KEY],
      useFactory(configEnvs: ConfigType<typeof configurations>) {
        return {
          secret: configEnvs.secret,
          signOptions: { expiresIn: '8d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthStrategy, SessionService, SessionRepository, PasswordGeneratorService],
  exports: [AuthService, PasswordGeneratorService],
})
export class AuthModule {}

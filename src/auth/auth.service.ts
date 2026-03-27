import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Payload, ResetPasswordPayload } from './interfaces/payload';
import configurations from '../core/settings/app.setting';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RpcException } from '@nestjs/microservices';
import { app_settings, AppSettings, session } from '@prisma/client';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { compare } from 'bcrypt';
import { CreateSessionDto } from './dto/session.dto';
import { Login, LoginResponse } from './interfaces/login';
import { SessionService } from './services/session.service';
import { AppSettingsService } from 'src/app-settings/app-settings.service';
import { FirstTimeLoginUser, UserResponse } from 'src/users/interfaces/user';
import { PasswordGeneratorService } from './services/password-generator.service';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Bogota');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(configurations.KEY)
    private readonly configService: ConfigType<typeof configurations>,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly appSettingsService: AppSettingsService,
    private readonly sessionService: SessionService,
    private readonly passwordGeneratorService: PasswordGeneratorService,
  ) {}

  private async generateJwt(payload: Payload) {
    const sessionExpiration: app_settings = await this.appSettingsService.getSetting(AppSettings.SESSION_EXPIRATION);

    if (!sessionExpiration) {
      throw new RpcException({
        message: 'No se ha establecido la duración de la sesión',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    return this.jwtService.sign(
      { ...payload },
      {
        expiresIn: `${Number(sessionExpiration.value)}h`,
        secret: this.configService.secret,
      },
    );
  }

  private async generateRefreshToken(payload: Payload): Promise<string> {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: '1d',
        secret: this.configService.secret,
      },
    );
  }

  getProfile(userId: string) {
    return this.userService.findOne(userId);
  }

  private resetAttempts(user: UserResponse) {
    return this.userService.update(user.id, {
      failed_attempts: 0,
      lock_until: null,
    });
  }

  private async handleFailedAttempt(user: UserResponse, attemptsSetting: app_settings, lockUntilSetting: app_settings) {
    const updatedFailedAttempts = user.failed_attempts + 1;

    if (updatedFailedAttempts >= parseInt(attemptsSetting.value)) {
      const lockHours = parseFloat(lockUntilSetting.value);

      await this.userService.update(user.id, {
        lock_until: dayjs().add(lockHours, 'hours').toISOString(),
        failed_attempts: updatedFailedAttempts,
      });

      throw new RpcException({
        message: 'Demasiados intentos fallidos. La cuenta ha sido bloqueada por seguridad.',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    await this.userService.update(user.id, {
      failed_attempts: updatedFailedAttempts,
    });
  }

  async validatePasswordResetToken(token: string) {
    try {
      const payload = this.jwtService.verify<ResetPasswordPayload>(token, {
        secret: this.configService.restorePasswordSecret,
      });

      if (payload.type !== 'password-reset') {
        throw new RpcException({
          message: 'Invalid token type',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }

      return payload;
    } catch (error) {
      this.logger.error(`[ERROR] AuthService.validatePasswordResetToken`, error);
      throw new RpcException({
        message: 'Invalid or expired token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  async setNewPassword(userId: string, newPassword: string, token: string): Promise<LoginResponse> {
    const payload = await this.validatePasswordResetToken(token);
    const user = await this.userService.findOne(userId);
    if (payload.sub !== userId) {
      throw new RpcException({
        message: 'Invalid token for this user',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const updateUserDto: UpdateUserDto = {
      password: newPassword,
      is_first_login: false,
      failed_attempts: 0,
      lock_until: null,
    };
    await this.userService.update(userId, updateUserDto);
    return this.login({ email: user.username });
  }

  async validateUser(
    username: string,
    password: string,
    oauth?: boolean,
    origin?: string,
  ): Promise<UserResponse | FirstTimeLoginUser | null> {
    const [lockUntilSetting, attemptsSetting, frontEndUrl] = await Promise.all([
      this.appSettingsService.getSetting(AppSettings.LOCK_LOGIN_UNTIL),
      this.appSettingsService.getSetting(AppSettings.LOCK_LOGIN_ATTEMPTS),
      this.appSettingsService.getSetting(AppSettings.FRONT_END_URL),
    ]);

    if (!lockUntilSetting || !attemptsSetting || !frontEndUrl) {
      throw new RpcException({
        message: 'Configuración de bloqueo de cuenta no encontrada',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const user = await this.userService.findOne(username, true);
    if (!user) return null;
    if (user.deleted_at) {
      throw new RpcException({
        message: 'Usuario no autorizado',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    if (user.lock_until && user.lock_until > new Date()) {
      throw new RpcException({
        message: 'Cuenta suspendida. Intente de nuevo más tarde',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    if (user.lock_until && user.lock_until <= new Date()) await this.resetAttempts(user);
    const isPasswordValid = oauth ? true : await compare(password, user.password);

    if (user.is_first_login) {
      if (!isPasswordValid) {
        await this.handleFailedAttempt(user, attemptsSetting, lockUntilSetting);
        return null;
      }
      // Generate special first-login token
      await this.resetAttempts(user);
      const resetToken = this.passwordGeneratorService.generatePasswordResetToken(user.id);
      return {
        ...user,
        requiresPasswordChange: true,
        resetToken,
      };
    }

    if (!isPasswordValid) {
      await this.handleFailedAttempt(user, attemptsSetting, lockUntilSetting);
      return null;
    }

    await this.resetAttempts(user);
    return user;
  }

  async login(loginDto: Login): Promise<LoginResponse> {
    const { email } = loginDto;

    const user = await this.userService.findOne(email);

    if (!user) {
      throw new RpcException({
        message: 'No se pudo iniciar sesión',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    if (!user.user_role.length) {
      throw new RpcException({
        message: 'Acceso no autorizado, sin roles asignados',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const accessToken = await this.generateJwt({
      user: {
        id: user.id,
        roles: user.user_role.map((userRole) => userRole.role.id),
      },
    });

    const { exp }: { exp: number } = this.jwtService.decode(accessToken);

    const expires_at = new Date(exp * 1000);

    const createSessionDto: CreateSessionDto = {
      user_id: user.id,
      token: accessToken,
      expires_at,
    };

    await this.sessionService.create(createSessionDto);

    this.logger.log(`Login successful for user ${user.username}`);

    return { accessToken };
  }

  async requestNewPassword(email: string) {
    const urlKey = AppSettings.FRONT_END_URL;

    const [user, frontendUrl]: [UserResponse, app_settings] = await Promise.all([
      this.userService.findOne(email),
      this.appSettingsService.findOne(urlKey),
    ]);

    if (!frontendUrl) {
      throw new RpcException({
        message: 'No se encontró la URL de frontend',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    if (!user) return { message: 'Correo de recuperación de contraseña enviado al correo' };

    const resetToken = this.passwordGeneratorService.generatePasswordResetToken(user.id);

    return { message: 'Correo de recuperación de contraseña enviado al correo', email, resetToken };
  }

  async findOneSession(user_id: string): Promise<session | null> {
    return this.sessionService.findOneByUserId(user_id);
  }

  async refreshToken(userId: string): Promise<LoginResponse> {
    const user = await this.userService.findOne(userId);

    const session = await this.sessionService.findOneByUserId(user.id);
    if (!session) {
      throw new RpcException({
        message: 'Sesión no encontrada. Inicie sesión nuevamente',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const accessToken = await this.generateJwt({
      user: {
        id: user.id,
        roles: user.user_role.map((userRole) => userRole.role.id),
      },
    });

    const { exp }: { exp: number } = this.jwtService.decode(accessToken);
    const expires_at = new Date(exp * 1000);

    await this.sessionService.updateSession(user.id, accessToken, expires_at);

    this.logger.log(`Token refreshed for user ${user.username}`);

    return { accessToken };
  }
}

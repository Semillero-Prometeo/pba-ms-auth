import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AUTH_MS } from 'src/core/constants/ms-names.constant';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindOneDto } from 'src/core/dto/find-one.dto';
import { SetPasswordDto } from './dto/restore-password.dto';
import { LoginResponse } from './interfaces/login';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(`${AUTH_MS}.authService.login`)
  login(@Payload() { username }: { username: string }) {
    return this.authService.login({ email: username });
  }

  @MessagePattern(`${AUTH_MS}.authService.requestNewPassword`)
  requestNewPassword(@Payload() { email }: { email: string }) {
    return this.authService.requestNewPassword(email);
  }

  @MessagePattern(`${AUTH_MS}.authService.getProfile`)
  getProfile(@Payload() { id }: FindOneDto) {
    return this.authService.getProfile(id);
  }

  @MessagePattern(`${AUTH_MS}.authService.setNewPassword`)
  setNewPassword(@Payload() setPasswordDto: SetPasswordDto): Promise<LoginResponse> {
    return this.authService.setNewPassword(setPasswordDto.userId, setPasswordDto.newPassword, setPasswordDto.token);
  }

  @MessagePattern(`${AUTH_MS}.authService.validateUser`)
  validateUser(@Payload() { username, password }: { username: string; password: string }) {
    return this.authService.validateUser(username, password);
  }

  @MessagePattern(`${AUTH_MS}.authService.findOneSession`)
  findOneSession(@Payload() { user_id }: { user_id: string }) {
    return this.authService.findOneSession(user_id);
  }

  @MessagePattern(`${AUTH_MS}.authService.refreshToken`)
  refreshToken(@Payload() { userId }: { userId: string }) {
    return this.authService.refreshToken(userId);
  }
}

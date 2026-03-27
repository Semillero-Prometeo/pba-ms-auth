import { Controller } from '@nestjs/common';
import { AUTH_MS } from './core/constants/ms-names.constant';
import { MessagePattern } from '@nestjs/microservices';
import { Health } from './core/interfaces/health';

@Controller()
export class AppController {
  @MessagePattern(`${AUTH_MS}.healthService.health`)
  health(): Health {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      msName: AUTH_MS,
    };
  }
}

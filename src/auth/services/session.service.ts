import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { CreateSessionDto } from '../dto/session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async findOneByUserId(user_id: string) {
    return this.sessionRepository.findOneByUserId(user_id);
  }

  async create(createSessionDto: CreateSessionDto) {
    return this.sessionRepository.create(createSessionDto);
  }

  async updateSession(user_id: string, token: string, expires_at: Date) {
    return this.sessionRepository.updateSession(user_id, token, expires_at);
  }
}

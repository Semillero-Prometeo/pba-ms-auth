import { RequestUser } from 'src/config/interfaces/request';

export interface Payload {
  user: RequestUser;
  iat?: number;
  exp?: number;
}

export interface ResetPasswordPayload {
  sub: string;
  type: 'password-reset';
}

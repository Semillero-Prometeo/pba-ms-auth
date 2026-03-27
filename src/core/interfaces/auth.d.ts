import { Request } from 'express';
import { ResetPasswordPayload } from 'src/auth/interfaces/payload';

export interface ExtendedRequest extends Request {
  user: RequestUser;
}

export interface RestorePassReq extends Request {
  user: ResetPasswordPayload;
}

export interface RequestUser {
  id: string;
  roles: string[];
  email?: string;
}

export interface MustChangePassword {
  message: string;
  resetToken: string;
}

export interface Payload {
  user: RequestUser;
  token: string;
  iat?: number;
  exp?: number;
}

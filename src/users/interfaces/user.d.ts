import { person, policy, role, user, user_role, role_policy } from '@prisma/client';
import { PersonResponse } from 'src/person/interfaces/person';

export interface RolePolicyResponse extends role_policy {
  policy?: policy;
}

export interface RoleResponse extends role {
  role_policy?: RolePolicyResponse[];
}

export interface UserRoleResponse extends user_role {
  role?: RoleResponse;
}


export interface UserResponse extends user {
  password?: string;
  person?: PersonResponse;
  user_role?: UserRoleResponse[];
}

export interface FirstTimeLoginUser extends user {
  requiresPasswordChange: boolean;
  resetToken: string;
}

export interface GetUsernameParams {
  document_type: DocumentTypes;
  document_number: string;
  country_code: string;
}

export interface UserMetadata {
  logo_url: string;
  name: string;
  url: string;
}
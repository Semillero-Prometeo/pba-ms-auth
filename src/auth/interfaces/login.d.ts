export interface Login {
  email: string;
}


export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  isCompleted: boolean;
}
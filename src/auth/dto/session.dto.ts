export interface CreateSessionDto {
    user_id: string;
    token: string;
    expires_at: Date;
}
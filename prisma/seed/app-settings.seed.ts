import { AppSettings, Prisma } from '@prisma/client';

export const APP_SETTINGS_SEED: Prisma.app_settingsCreateInput[] = [
  {
    key: AppSettings.SESSION_EXPIRATION,
    value: '8',
    start_at: new Date(),
  },
  {
    key: AppSettings.FRONT_END_URL,
    value: '',
    start_at: new Date(),
  },
  {
    key: AppSettings.LOCK_LOGIN_UNTIL,
    value: '0.25',
    start_at: new Date(),
  },
  {
    key: AppSettings.LOCK_LOGIN_ATTEMPTS,
    value: '5',
    start_at: new Date(),
  },
];

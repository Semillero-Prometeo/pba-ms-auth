import { AppSettings, Prisma } from '@prisma/client';

export const APP_SETTINGS_SEED: Prisma.app_settingsCreateInput[] = [
  {
    key: AppSettings.SESSION_EXPIRATION,
    value: '900',
    start_at: new Date(),
  },
  {
    key: AppSettings.FRONT_END_URL,
    value: 'https://portal-web-prod-622073829502.us-east1.run.app',
    start_at: new Date(),
  },
  {
    key: AppSettings.LOCK_LOGIN_UNTIL,
    value: '0.25',
    start_at: new Date(),
  },
  {
    key: AppSettings.LOCK_LOGIN_ATTEMPTS,
    value: '3',
    start_at: new Date(),
  },
];

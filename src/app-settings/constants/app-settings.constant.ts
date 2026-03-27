import { AppSettings } from '@prisma/client';
import { UpdateSettingCategory } from '../enums/update-setting.enum';

export const VALID_UPDATE_SETTING_CATEGORY = {
  [UpdateSettingCategory.AUTH]: [
    AppSettings.LOCK_LOGIN_ATTEMPTS,
    AppSettings.LOCK_LOGIN_UNTIL,
    AppSettings.SESSION_EXPIRATION,
    AppSettings.FRONT_END_URL,
  ],
};

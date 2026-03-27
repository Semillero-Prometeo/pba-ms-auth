import { ConfigModuleOptions, registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface AppConfiguration {
  environment: string;
  port: string;
  databaseUrl: string;
  secret: string;
  natsServer: string;
  restorePasswordSecret: string;
  projectId: string;
}

const configurations = registerAs(
  'configEnvs',
  (): AppConfiguration => ({
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    secret: process.env.SECRET,
    natsServer: process.env.NATS_SERVER,
    restorePasswordSecret: process.env.RESTORE_PASSWORD_SECRET,
    projectId: process.env.PROJECT_ID,
  }),
);

export function configRoot(): ConfigModuleOptions {
  return {
    load: [configurations],
    isGlobal: true,
    validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      PORT: Joi.number().required(),
      DATABASE_URL: Joi.string().required(),
      SECRET: Joi.string().required(),
      NATS_SERVER: Joi.string().required(),
      RESTORE_PASSWORD_SECRET: Joi.string().required(),
      PROJECT_ID: Joi.string().required(),
    }),
  };
}

export default configurations;

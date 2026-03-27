import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/core/constants/ms-names.constant';
import configurations from 'src/core/settings/app.setting';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: NATS_SERVICE,
          imports: [ConfigModule.forRoot()],
          inject: [configurations.KEY],
          useFactory: (configEnvs: ConfigType<typeof configurations>) => ({
            transport: Transport.NATS,
            options: {
              servers: configEnvs.natsServer,
              reconnect: true,
              waitOnFirstConnect: true,
              reconnectTimeWait: 2000,
              maxReconnectAttempts: -1,
              timeout: 20000,
              pingInterval: 20000,
              maxPingOut: 2,
            },
          }),
        },
      ],
    }),
  ],
  exports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: NATS_SERVICE,
          imports: [ConfigModule.forRoot()],
          inject: [configurations.KEY],
          useFactory: (configEnvs: ConfigType<typeof configurations>) => ({
            transport: Transport.NATS,
            options: {
              servers: configEnvs.natsServer,
              reconnect: true,
              waitOnFirstConnect: true,
              reconnectTimeWait: 2000,
              maxReconnectAttempts: -1,
              timeout: 20000,
              pingInterval: 20000,
              maxPingOut: 2,
            },
          }),
        },
      ],
    }),
  ],
})
export class NatsModule { }

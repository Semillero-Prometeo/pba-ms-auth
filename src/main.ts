import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { RpcCustomExceptionFilter } from './core/filters/rpc-exception.filter';

async function bootstrap() {
  const logger = new Logger('Auth Microservice');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: process.env.NATS_SERVER,
      reconnect: true,
      waitOnFirstConnect: true,
      reconnectTimeWait: 2000,
      maxReconnectAttempts: -1,
      timeout: 20000,
      pingInterval: 20000,
      maxPingOut: 2,
    },
  });

  // Set the global pipes
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  // Manejo global de excepciones
  // Apply AllExceptionsFilter first to catch any exceptions
  // Then apply RpcCustomExceptionFilter to format RPC exceptions
  app.useGlobalFilters(new AllExceptionsFilter(), new RpcCustomExceptionFilter());
  await app.listen();

  logger.log('Application is running on NATS');
}
bootstrap();

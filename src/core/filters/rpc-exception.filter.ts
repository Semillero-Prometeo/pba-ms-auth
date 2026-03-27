import { Catch, ArgumentsHost, ExceptionFilter, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FastifyReply } from 'fastify';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcCustomExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost) {
    const rpcError = exception.getError();
    this.logger.error(rpcError);

    // Check if we're in HTTP context
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FastifyReply>();

      if (typeof rpcError === 'object' && 'status' in rpcError && 'message' in rpcError) {
        const status = isNaN(+rpcError.status) ? HttpStatus.INTERNAL_SERVER_ERROR : +rpcError.status;
        return response.status(status).send(rpcError);
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: rpcError,
      });
    }

    // For microservice context, just return the error object
    if (typeof rpcError === 'object' && 'statusCode' in rpcError && 'message' in rpcError) {
      return rpcError;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: rpcError,
    };
  }
}

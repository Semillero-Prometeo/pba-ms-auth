import { Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/client';
import { Observable, throwError } from 'rxjs';

/**
 * Filter that catches all exceptions and converts them to RPC exceptions
 * with a consistent format that can be handled by the RpcCustomExceptionFilter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any): Observable<any> {
    this.logger.error(exception);

    // If the exception is already an RpcException, just pass it through
    if (exception instanceof RpcException) {
      return throwError(() => exception);
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle Prisma specific errors
    if (exception instanceof PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = `Database error: ${exception.message}`;

      // Handle specific Prisma error codes
      switch (exception.code) {
        case 'P2000': // Value too long for column type
          message = `The provided value for column '${exception.meta?.column_name || 'unknown'}' is too long`;
          break;
        case 'P2002': // Unique constraint violation
          message = 'A record with the same unique fields already exists';
          break;
        case 'P2025': // Record not found
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Record not found';
          break;
      }
    } else if (exception instanceof PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid data format';
    } else if (exception?.response?.statusCode && exception?.response?.message) {
      // Handle HTTP exceptions with standard format
      statusCode = exception.response.statusCode;
      message = exception.response.message;
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    // Create a standard error object with both status and statusCode for proper propagation
    // status se usa para propagación interna en NestJS microservices
    // statusCode se mantiene para compatibilidad con los otros filtros
    const error = {
      statusCode: statusCode, // Para compatibilidad bidireccional
      message,
    };

    // Send the error with correct format for RPC propagation
    return throwError(() => new RpcException(error));
  }
}

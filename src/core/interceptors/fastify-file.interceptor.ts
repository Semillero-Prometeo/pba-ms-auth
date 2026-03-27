import { CallHandler, ExecutionContext, Inject, mixin, NestInterceptor, Optional, Type } from '@nestjs/common';
import FastifyMulter from 'fastify-multer';
import { Multer, Options } from 'multer';
import { Observable } from 'rxjs';

type MulterInstance = any;
export function FastifyFileInterceptor(fieldName: string, localOptions: Options | null): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    protected multer: MulterInstance;

    constructor(
      @Optional()
      @Inject('MULTER_MODULE_OPTIONS')
      options: Multer,
    ) {
      if (localOptions) this.multer = (FastifyMulter as any)({ ...options, ...localOptions });
      else this.multer = (FastifyMulter as any)({ ...options });
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const ctx = context.switchToHttp();

      await new Promise<void>((resolve, reject) =>
        this.multer.single(fieldName)(ctx.getRequest(), ctx.getResponse(), (error: any) => {
          if (error) {
            // const error = transformException(err);
            return reject(error);
          }
          resolve();
        }),
      );

      return next.handle();
    }
  }
  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
}

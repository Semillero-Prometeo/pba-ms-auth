import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import configurations from 'src/core/settings/app.setting';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy, 'auth-strategy') {
  constructor(
    @Inject(configurations.KEY)
    private readonly configService: ConfigType<typeof configurations>,
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.projectId,
      issuer: `https://securetoken.google.com/${configService.projectId}`,
      algorithms: ['RS256'],
    });
  }

  // Si la firma es válida, NestJS ejecuta esto
  async validate(payload: any) {
    // payload contiene los datos unificados de GIP (sea Google o Microsoft)
    return {
      id: payload.sub,
      email: payload.email,
      provider: payload.firebase?.sign_in_provider || 'gip',
    };
  }
}

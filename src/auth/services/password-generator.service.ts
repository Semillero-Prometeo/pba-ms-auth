import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import configurations from 'src/core/settings/app.setting';
import { ResetPasswordPayload } from '../interfaces/payload';

@Injectable()
export class PasswordGeneratorService {

  constructor(
    private readonly jwtService: JwtService,
    @Inject(configurations.KEY)
    private readonly configService: ConfigType<typeof configurations>,
  ) {}
  /**
   * Generates a cryptographically secure temporary password
   * @param length The length of the password (default: 12)
   * @param options Configuration options for password generation
   * @returns A secure temporary password
   */
  generateTemporaryPassword(
    length: number = 12,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
    } = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecialChars: true,
    },
  ): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (options.includeUppercase) chars += uppercase;
    if (options.includeLowercase) chars += lowercase;
    if (options.includeNumbers) chars += numbers;
    if (options.includeSpecialChars) chars += specialChars;

    if (chars.length === 0) {
      throw new Error('At least one character set must be included');
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);

    // Ensure at least one character from each selected type
    if (options.includeUppercase) {
      password += uppercase[crypto.randomInt(0, uppercase.length)];
    }
    if (options.includeLowercase) {
      password += lowercase[crypto.randomInt(0, lowercase.length)];
    }
    if (options.includeNumbers) {
      password += numbers[crypto.randomInt(0, numbers.length)];
    }
    if (options.includeSpecialChars) {
      password += specialChars[crypto.randomInt(0, specialChars.length)];
    }

    // Fill the rest of the password
    for (let i = password.length; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }

    // Shuffle the password to make it more random
    return this.shuffleString(password);
  }

  /**
   * Shuffles a string using Fisher-Yates algorithm
   * @param str String to shuffle
   * @returns Shuffled string
   */
  private shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const minLength = 8;
    const maxLength = 64;

    const requirements = [
      {
        test: (pwd: string) => pwd.length >= minLength,
        message: `La contraseña debe tener al menos ${minLength} caracteres.`,
      },
      {
        test: (pwd: string) => pwd.length <= maxLength,
        message: `La contraseña no debe exceder ${maxLength} caracteres.`,
      },
      {
        test: (pwd: string) => /[A-Z]/.test(pwd),
        message: 'La contraseña debe contener al menos una letra mayúscula',
      },
      {
        test: (pwd: string) => /[a-z]/.test(pwd),
        message: 'La contraseña debe contener al menos una letra minúscula',
      },
      {
        test: (pwd: string) => /[0-9]/.test(pwd),
        message: 'La contraseña debe contener al menos un número',
      },
      {
        test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        message: 'La contraseña debe contener al menos un carácter especial',
      },
      {
        test: (pwd: string) => !/\s/.test(pwd),
        message: 'La contraseña no debe contener espacios en blanco',
      },
    ];

    for (const requirement of requirements) {
      if (!requirement.test(password)) {
        errors.push(requirement.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generatePasswordResetToken(userId: string) {
    const payload: ResetPasswordPayload = {
      sub: userId,
      type: 'password-reset',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '24h', // Token expires in 24 hours
      secret: this.configService.restorePasswordSecret,
    });
  }

}

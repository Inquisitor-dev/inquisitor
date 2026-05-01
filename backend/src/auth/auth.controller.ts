import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @HttpCode(200)
  async sendCode(@Body('email') email: string) {
    if (!email || !email.includes('@')) {
      return { error: 'Geçerli bir e-posta adresi girin.' };
    }
    return this.authService.sendVerificationCode(email.toLowerCase().trim());
  }

  @Post('verify')
  @HttpCode(200)
  async verify(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    return this.authService.verifyCode(email.toLowerCase().trim(), code.trim());
  }
}

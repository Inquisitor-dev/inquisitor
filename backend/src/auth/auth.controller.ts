import { Controller, Post, Body, HttpCode, UseGuards, Request, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @HttpCode(200)
  async sendCode(
    @Body('email') email: string,
    @Body('password') password?: string,
  ) {
    if (!email || !email.includes('@')) {
      return { error: 'Geçerli bir e-posta adresi girin.' };
    }
    return this.authService.sendVerificationCode(email.toLowerCase().trim(), password);
  }

  @Post('verify')
  @HttpCode(200)
  async verify(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    return this.authService.verifyCode(email.toLowerCase().trim(), code.trim());
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body('email') email: string,
    @Body('password') password?: string,
  ) {
    if (!email || !password) {
      return { error: 'E-posta ve şifre gereklidir.' };
    }
    return this.authService.login(email.toLowerCase().trim(), password);
  }

  @Post('activate-premium')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async activatePremium(
    @Request() req: any,
    @Body('activationCode') activationCode: string,
  ) {
    const userId: string = req.user.userId;
    return this.authService.activatePremium(userId, activationCode);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    const userId: string = req.user.userId;
    return this.authService.getAccountSummary(userId);
  }

  // Ana menü müziği ayarları hesapta saklanır
  @Get('audio-settings')
  @UseGuards(JwtAuthGuard)
  async getAudioSettings(@Request() req: any) {
    return this.authService.getAudioSettings(req.user.userId);
  }

  @Patch('audio-settings')
  @UseGuards(JwtAuthGuard)
  async updateAudioSettings(
    @Request() req: any,
    @Body('musicVolume') musicVolume?: unknown,
    @Body('musicMuted') musicMuted?: unknown,
  ) {
    return this.authService.updateAudioSettings(req.user.userId, { musicVolume, musicMuted });
  }
}

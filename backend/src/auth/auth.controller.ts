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
    @Body('username') username?: string,
    @Body('avatar') avatar?: string,
  ) {
    if (!email || !email.includes('@')) {
      return { error: 'Geçerli bir e-posta adresi girin.' };
    }
    return this.authService.sendVerificationCode(
      email.toLowerCase().trim(),
      password,
      username,
      avatar,
    );
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
    @Body('email') email?: string,
    @Body('username') username?: string,
    @Body('identifier') identifier?: string,
    @Body('password') password?: string,
  ) {
    const loginId = (identifier || username || email || '').trim();
    if (!loginId || !password) {
      return { error: 'Kullanıcı adı veya e-posta ile şifre gereklidir.' };
    }
    return this.authService.login(loginId, password);
  }

  @Patch('profile')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body('username') username?: string,
    @Body('avatar') avatar?: string,
  ) {
    return this.authService.updateProfile(req.user.userId, { username, avatar });
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

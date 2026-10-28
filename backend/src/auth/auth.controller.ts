import { Controller, Post, Body, HttpCode, UseGuards, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { CurrentUser } from './current-user.decorator';
import { UpdateAudioSettingsDto } from './dto/update-audio-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SendCodeDto, VerifyCodeDto, LoginDto } from './dto/auth-requests.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @HttpCode(200)
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendVerificationCode(
      dto.email.toLowerCase().trim(),
      dto.password,
      dto.username,
      dto.avatar,
    );
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.email.toLowerCase().trim(), dto.code.trim());
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const loginId = (dto.identifier || dto.username || dto.email || '').trim();
    if (!loginId || !dto.password) {
      return { error: 'Kullanıcı adı veya e-posta ile şifre gereklidir.' };
    }
    return this.authService.login(loginId, dto.password);
  }

  @Patch('profile')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('userId') userId: string) {
    return this.authService.getAccountSummary(userId);
  }

  // Ana menü müziği ve ses efektleri ayarları hesapta saklanır
  @Get('audio-settings')
  @UseGuards(JwtAuthGuard)
  async getAudioSettings(@CurrentUser('userId') userId: string) {
    return this.authService.getAudioSettings(userId);
  }

  @Patch('audio-settings')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async updateAudioSettings(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateAudioSettingsDto,
  ) {
    return this.authService.updateAudioSettings(userId, dto);
  }
}

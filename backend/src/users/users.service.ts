import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAudioSettingsDto } from '../auth/dto/update-audio-settings.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

export interface DailyQuotaResult {
  dailySessionCount: number;
  dailyMessageCount: number;
  isAdmin: boolean;
  isPremium: boolean;
}

export interface AccountSummaryResult {
  email: string;
  username: string | null;
  avatar: string;
  isAdmin: boolean;
  isPremium: boolean;
  tokenBalance: number;
  score: number;
  dailySessionCount: number;
  dailyMessageCount: number;
  maxSessionsPerDay: number;
  maxMessagesPerDay: number;
}

export interface AudioSettingsResult {
  musicVolume: number;
  musicMuted: boolean;
  footstepVolume: number;
  footstepMuted: boolean;
  doorVolume: number;
  doorMuted: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAndResetDailyQuota(userId: string): Promise<DailyQuotaResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    if (user.isAdmin) {
      return {
        dailySessionCount: 0,
        dailyMessageCount: 0,
        isAdmin: true,
        isPremium: false,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastReset = user.lastResetDate
      ? user.lastResetDate.toISOString().slice(0, 10)
      : null;

    if (lastReset !== today) {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          dailySessionCount: 0,
          dailyMessageCount: 0,
          lastResetDate: today,
        },
      });
      return {
        dailySessionCount: updated.dailySessionCount,
        dailyMessageCount: updated.dailyMessageCount,
        isAdmin: false,
        isPremium: user.isPremium,
      };
    }

    return {
      dailySessionCount: user.dailySessionCount,
      dailyMessageCount: user.dailyMessageCount,
      isAdmin: false,
      isPremium: user.isPremium,
    };
  }

  async incrementSessionCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailySessionCount: { increment: 1 } },
    });
  }

  async incrementMessageCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyMessageCount: { increment: 1 } },
    });
  }

  async getAccountSummary(userId: string): Promise<AccountSummaryResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    const quota = await this.checkAndResetDailyQuota(userId);
    const maxSessionsPerDay = quota.isAdmin ? 999 : 5;
    const maxMessagesPerDay = quota.isAdmin ? 999 : 100;

    return {
      email: user.email,
      username: user.username,
      avatar: user.avatar || 'avatar_1',
      isAdmin: user.isAdmin,
      isPremium: false,
      tokenBalance: user.tokenBalance,
      score: user.score,
      dailySessionCount: quota.dailySessionCount,
      dailyMessageCount: quota.dailyMessageCount,
      maxSessionsPerDay,
      maxMessagesPerDay,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ success: boolean; username: string | null; avatar: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    const updateData: { username?: string; avatar?: string } = {};

    if (dto.username !== undefined) {
      const trimmed = dto.username.trim();
      if (trimmed.length < 3 || trimmed.length > 20) {
        throw new BadRequestException('Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.');
      }
      if (!/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/.test(trimmed)) {
        throw new BadRequestException('Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.');
      }
      const taken = await this.prisma.user.findFirst({
        where: {
          username: trimmed,
          NOT: { id: userId },
        },
      });
      if (taken) {
        throw new BadRequestException('Bu kullanıcı adı zaten kullanılıyor.');
      }
      updateData.username = trimmed;
    }

    if (dto.avatar !== undefined) {
      const validAvatars = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5'];
      if (!validAvatars.includes(dto.avatar)) {
        throw new BadRequestException('Geçersiz avatar seçimi.');
      }
      updateData.avatar = dto.avatar;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      username: updated.username,
      avatar: updated.avatar,
    };
  }

  async getAudioSettings(userId: string): Promise<AudioSettingsResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        musicVolume: true,
        musicMuted: true,
        footstepVolume: true,
        footstepMuted: true,
        doorVolume: true,
        doorMuted: true,
      },
    });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');
    return user;
  }

  async updateAudioSettings(
    userId: string,
    settings: UpdateAudioSettingsDto,
  ): Promise<AudioSettingsResult> {
    const data: {
      musicVolume?: number;
      musicMuted?: boolean;
      footstepVolume?: number;
      footstepMuted?: boolean;
      doorVolume?: number;
      doorMuted?: boolean;
    } = {};

    if (typeof settings.musicVolume === 'number') {
      data.musicVolume = Math.min(1, Math.max(0, settings.musicVolume));
    }
    if (typeof settings.musicMuted === 'boolean') {
      data.musicMuted = settings.musicMuted;
    }
    if (typeof settings.footstepVolume === 'number') {
      data.footstepVolume = Math.min(1, Math.max(0, settings.footstepVolume));
    }
    if (typeof settings.footstepMuted === 'boolean') {
      data.footstepMuted = settings.footstepMuted;
    }
    if (typeof settings.doorVolume === 'number') {
      data.doorVolume = Math.min(1, Math.max(0, settings.doorVolume));
    }
    if (typeof settings.doorMuted === 'boolean') {
      data.doorMuted = settings.doorMuted;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Güncellenecek geçerli bir ses ayarı belirtilmedi.');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        musicVolume: true,
        musicMuted: true,
        footstepVolume: true,
        footstepMuted: true,
        doorVolume: true,
        doorMuted: true,
      },
    });
  }
}

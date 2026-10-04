import { Injectable, BadRequestException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is not set.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        isAdmin: true,
        isVerified: true,
        verificationCode: null,
        codeExpiresAt: null,
      },
      create: {
        email: adminEmail,
        passwordHash,
        isAdmin: true,
        isVerified: true,
      },
    });
    console.log(`Admin account configured for ${adminEmail}`);
  }

  async sendVerificationCode(email: string, password?: string): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli kod
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika gecerli

    // Kullanici yoksa olustur, varsa guncelle
    // Admin e-postasi ise isAdmin=true ata
    const adminEmails = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];
    const isAdmin = adminEmails.includes(email);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser?.isVerified && !isAdmin) {
      throw new BadRequestException('Bu e-posta adresi zaten kayıtlı.');
    }

    let passwordHash = existingUser?.passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await this.prisma.user.upsert({
      where: { email },
      update: {
        verificationCode: code,
        codeExpiresAt: expiresAt,
        ...(passwordHash && { passwordHash }),
      },
      create: {
        email,
        isAdmin,
        verificationCode: code,
        codeExpiresAt: expiresAt,
        ...(passwordHash && { passwordHash }),
      },
    });

    // E-postayi gonder (Timeout ekliyoruz cunku Render Free'de SMTP portlari kapali olabilir)
    try {
      await this.transporter.sendMail({
        from: `"The Inquisitor" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'The Inquisitor — Doğrulama Kodunuz',
        html: `
          <div style="background:#0a0a0a;color:#e5d9c5;padding:40px;font-family:serif;max-width:480px;margin:auto;border:1px solid #2a2a2a;">
            <h1 style="color:#8A0303;letter-spacing:3px;text-transform:uppercase;font-size:1.4rem;">The Inquisitor</h1>
            <p style="color:#aaa;font-size:0.9rem;letter-spacing:2px;text-transform:uppercase;">- Engizisyon Davetiyesi -</p>
            <hr style="border-color:#2a2a2a;margin:20px 0;"/>
            <p>Engizisyon’un kapısındasınız. Kimliğinizi doğrulamak için aşağıdaki kodu kullanın:</p>
            <div style="background:#1a0505;border:1px solid #8A0303;padding:20px;text-align:center;margin:24px 0;">
              <span style="font-size:2.5rem;letter-spacing:12px;color:#e5d9c5;font-weight:bold;">${code}</span>
            </div>
            <p style="color:#666;font-size:0.8rem;">Bu kod 5 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
        `,
      });
      return { message: 'Doğrulama kodu e-posta adresine gönderildi.' };
    } catch (error) {
      console.warn('Mail gonderilemedi (SMTP portu kapali olabilir). Kod:', code, error);
      // Render free tier'da test edebilmek icin kodu mesaja ekliyoruz
      return { message: `(Test Modu) E-posta gönderilemedi. Doğrulama kodun: ${code}` };
    }
  }

  async verifyCode(email: string, code: string): Promise<{ token: string; email: string; userId: string; isAdmin: boolean; isPremium: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.verificationCode || !user.codeExpiresAt) {
      throw new BadRequestException('Önce doğrulama kodu iste.');
    }

    if (user.verificationCode !== code) {
      throw new UnauthorizedException('Doğrulama kodu hatalı.');
    }

    if (new Date() > user.codeExpiresAt) {
      throw new UnauthorizedException('Doğrulama kodunun süresi dolmuş. Yeni bir kod iste.');
    }

    // Kodu temizle, kullaniciyi dogrulanmis olarak isaretle
    await this.prisma.user.update({
      where: { email },
      data: {
        verificationCode: null,
        codeExpiresAt: null,
        isVerified: true,
      },
    });

    // JWT token uret
    const token = this.jwt.sign({ sub: user.id, email: user.email, isAdmin: user.isAdmin, isPremium: user.isPremium });

    return { token, email: user.email, userId: user.id, isAdmin: user.isAdmin, isPremium: user.isPremium };
  }

  async login(email: string, password: string): Promise<{ token: string; email: string; userId: string; isAdmin: boolean; isPremium: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('E-posta ya da şifre hatalı.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Önce e-posta adresini doğrulaman gerekiyor.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Hesabının şifresi yok. Bir şifre belirleyerek yeniden kaydol.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta ya da şifre hatalı.');
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email, isAdmin: user.isAdmin, isPremium: user.isPremium });
    return { token, email: user.email, userId: user.id, isAdmin: user.isAdmin, isPremium: user.isPremium };
  }

  // Gunluk kotayi kontrol et ve gerekirse sifirla
  async checkAndResetDailyQuota(userId: string): Promise<{
    dailySessionCount: number;
    dailyMessageCount: number;
    isAdmin: boolean;
    isPremium: boolean;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    // Admin kota sinirindan muaf
    if (user.isAdmin) {
      return { dailySessionCount: 0, dailyMessageCount: 0, isAdmin: true, isPremium: user.isPremium };
    }

    const today = new Date().toISOString().split('T')[0]; // "2026-05-01"

    if (user.lastResetDate !== today) {
      // Yeni gun - kotalari sifirla
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

  async getAccountSummary(userId: string): Promise<{
    email: string;
    isAdmin: boolean;
    isPremium: boolean;
    dailySessionCount: number;
    dailyMessageCount: number;
    maxSessionsPerDay: number;
    maxMessagesPerDay: number;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    const quota = await this.checkAndResetDailyQuota(userId);
    const maxSessionsPerDay = quota.isAdmin ? 999 : quota.isPremium ? 5 : 2;
    const maxMessagesPerDay = quota.isAdmin ? 999 : quota.isPremium ? 100 : 30;

    return {
      email: user.email,
      isAdmin: user.isAdmin,
      isPremium: user.isPremium,
      dailySessionCount: quota.dailySessionCount,
      dailyMessageCount: quota.dailyMessageCount,
      maxSessionsPerDay,
      maxMessagesPerDay,
    };
  }

  async getAudioSettings(userId: string): Promise<{ musicVolume: number; musicMuted: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { musicVolume: true, musicMuted: true },
    });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');
    return user;
  }

  async updateAudioSettings(
    userId: string,
    settings: { musicVolume?: unknown; musicMuted?: unknown },
  ): Promise<{ musicVolume: number; musicMuted: boolean }> {
    const data: { musicVolume?: number; musicMuted?: boolean } = {};
    if (typeof settings.musicVolume === 'number' && Number.isFinite(settings.musicVolume)) {
      data.musicVolume = Math.min(1, Math.max(0, settings.musicVolume));
    }
    if (typeof settings.musicMuted === 'boolean') {
      data.musicMuted = settings.musicMuted;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { musicVolume: true, musicMuted: true },
    });
  }

  // Premium aktivasyonu (simule edilmis odeme)
  async activatePremium(userId: string, activationCode: string): Promise<{ success: boolean; message: string }> {
    const VALID_CODE = 'PREMIUM246741';

    if (activationCode !== VALID_CODE) {
      throw new BadRequestException('Aktivasyon kodu geçersiz.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    if (user.isPremium) {
      return { success: true, message: 'Hesabın zaten Premium.' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
    });

    return { success: true, message: 'Premium başarıyla etkinleştirildi! Artık tüm özelliklere erişebilirsin.' };
  }
}

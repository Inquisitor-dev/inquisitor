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
    });
  }

  async onModuleInit() {
    const adminEmail = 'berkecakiroglu35@gmail.com';
    const adminPassword = 'MiaBerke_346494';
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
    console.log(`✅ Admin account configured for ${adminEmail}`);
  }

  async sendVerificationCode(email: string, password?: string): Promise<{ message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli kod
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika geçerli

    // Kullanıcı yoksa oluştur, varsa güncelle
    // Admin e-postası ise isAdmin=true ata
    const adminEmails = ['berkecakiroglu35@gmail.com'];
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

    // E-postayı gönder
    await this.transporter.sendMail({
      from: `"The Inquisitor" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'The Inquisitor — Doğrulama Kodunuz',
      html: `
        <div style="background:#0a0a0a;color:#e5d9c5;padding:40px;font-family:serif;max-width:480px;margin:auto;border:1px solid #2a2a2a;">
          <h1 style="color:#8A0303;letter-spacing:3px;text-transform:uppercase;font-size:1.4rem;">The Inquisitor</h1>
          <p style="color:#aaa;font-size:0.9rem;letter-spacing:2px;text-transform:uppercase;">— Engizisyon Davetiyesi —</p>
          <hr style="border-color:#2a2a2a;margin:20px 0;"/>
          <p>Ashenmoor'a adım atmak üzeresiniz. Kimliğinizi kanıtlamak için aşağıdaki kodu kullanın:</p>
          <div style="background:#1a0505;border:1px solid #8A0303;padding:20px;text-align:center;margin:24px 0;">
            <span style="font-size:2.5rem;letter-spacing:12px;color:#e5d9c5;font-weight:bold;">${code}</span>
          </div>
          <p style="color:#666;font-size:0.8rem;">Bu kod 5 dakika geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelin.</p>
        </div>
      `,
    });

    return { message: 'Doğrulama kodu e-posta adresinize gönderildi.' };
  }

  async verifyCode(email: string, code: string): Promise<{ token: string; userId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.verificationCode || !user.codeExpiresAt) {
      throw new BadRequestException('Önce doğrulama kodu gönderin.');
    }

    if (user.verificationCode !== code) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu.');
    }

    if (new Date() > user.codeExpiresAt) {
      throw new UnauthorizedException('Doğrulama kodunun süresi dolmuş. Yeni kod talep edin.');
    }

    // Kodu temizle, kullanıcıyı doğrulanmış olarak işaretle
    await this.prisma.user.update({
      where: { email },
      data: {
        verificationCode: null,
        codeExpiresAt: null,
        isVerified: true,
      },
    });

    // JWT token üret
    const token = this.jwt.sign({ sub: user.id, email: user.email, isAdmin: user.isAdmin });

    return { token, userId: user.id, isAdmin: user.isAdmin };
  }

  async login(email: string, password: string): Promise<{ token: string; userId: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Lütfen önce e-postanızı doğrulayın.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Lütfen şifre belirleyerek tekrar kayıt olun.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email, isAdmin: user.isAdmin });
    return { token, userId: user.id, isAdmin: user.isAdmin };
  }

  // Günlük kotayı kontrol et ve gerekirse sıfırla
  async checkAndResetDailyQuota(userId: string): Promise<{
    dailySessionCount: number;
    dailyMessageCount: number;
    isAdmin: boolean;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı.');

    // Admin kota sınırından muaf
    if (user.isAdmin) {
      return { dailySessionCount: 0, dailyMessageCount: 0, isAdmin: true };
    }

    const today = new Date().toISOString().split('T')[0]; // "2026-05-01"

    if (user.lastResetDate !== today) {
      // Yeni gün — kotaları sıfırla
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
      };
    }

    return {
      dailySessionCount: user.dailySessionCount,
      dailyMessageCount: user.dailyMessageCount,
      isAdmin: false,
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
}

import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const ADMIN = 'admin@inquisitor.test';

function setup(
  existingUser: Record<string, unknown> | null,
  mailWorks: boolean,
  existingByUsername: Record<string, unknown> | null = null,
) {
  const upsert = jest.fn().mockResolvedValue({});
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(existingUser),
      findFirst: jest.fn().mockResolvedValue(existingByUsername),
      upsert,
    },
  } as unknown as PrismaService;
  const service = new AuthService(prisma, {} as JwtService);
  const sendMail = mailWorks
    ? jest.fn().mockResolvedValue({})
    : jest.fn().mockRejectedValue(new Error('SMTP kapali'));
  (service as unknown as { transporter: { sendMail: jest.Mock } }).transporter =
    { sendMail };
  return { service, upsert, sendMail, prisma };
}

// Sabit bir kod üretsin diye Math.random sabitlenir: 100000 + 0.5 * 900000
const CODE = '550000';

describe('AuthService.sendVerificationCode', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ADMIN_EMAIL = ADMIN;
    delete process.env.ALLOW_TEST_MODE;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('e-posta giderse cevapta kod yoktur', async () => {
    const { service } = setup(null, true);
    const result = await service.sendVerificationCode(
      'yeni@test.com',
      'sifre123',
    );
    expect(result.message).not.toContain(CODE);
  });

  it('e-posta gitmezse canlıda kodu döndürmez, hata verir', async () => {
    const { service } = setup(null, false);
    const promise = service.sendVerificationCode('yeni@test.com', 'sifre123');
    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.not.toThrow(CODE);
  });

  it('e-posta gitmezse yerel test modunda kodu gösterir', async () => {
    process.env.ALLOW_TEST_MODE = 'true';
    const { service } = setup(null, false);
    const result = await service.sendVerificationCode(
      'yeni@test.com',
      'sifre123',
    );
    expect(result.message).toContain(CODE);
  });

  it('doğrulanmış admin hesabının şifresi bu uçtan değiştirilemez', async () => {
    const { service, upsert, sendMail } = setup(
      { email: ADMIN, isVerified: true, isAdmin: true, passwordHash: 'eski' },
      true,
    );
    await expect(
      service.sendVerificationCode(ADMIN, 'saldirganin-sifresi'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('doğrulanmış normal hesap yeniden kaydolamaz', async () => {
    const { service, upsert } = setup(
      { email: 'oyuncu@test.com', isVerified: true, isAdmin: false },
      true,
    );
    await expect(
      service.sendVerificationCode('oyuncu@test.com', 'sifre123'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('kullanıcı adı 3 karakterden kısa veya geçersiz ise hata verir', async () => {
    const { service } = setup(null, true);
    await expect(
      service.sendVerificationCode('yeni@test.com', 'sifre123', 'ab'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('başkası tarafından kullanılan kullanıcı adı seçilirse hata verir', async () => {
    const { service } = setup(null, true, { id: 'other', username: 'dedektif', email: 'other@test.com' });
    await expect(
      service.sendVerificationCode('yeni@test.com', 'sifre123', 'dedektif'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('geçerli kullanıcı adı ve avatar upsert verisine eklenir', async () => {
    const { service, upsert } = setup(null, true);
    await service.sendVerificationCode('yeni@test.com', 'sifre123', 'usta_engizitor', 'avatar_3');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          username: 'usta_engizitor',
          avatar: 'avatar_3',
        }),
      }),
    );
  });
});

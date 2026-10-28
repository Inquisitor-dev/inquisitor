import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendCodeDto {
  @IsNotEmpty({ message: 'Geçerli bir e-posta adresi girin.' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class VerifyCodeDto {
  @IsNotEmpty({ message: 'Geçerli bir e-posta adresi girin.' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email: string;

  @IsNotEmpty({ message: 'Doğrulama kodu gereklidir.' })
  @IsString()
  code: string;
}

export class LoginDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsNotEmpty({ message: 'Şifre gereklidir.' })
  @IsString()
  password: string;
}

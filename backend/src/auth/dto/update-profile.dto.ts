import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 20, { message: 'Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.' })
  @Matches(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/, {
    message: 'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @IsIn(['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5'], {
    message: 'Geçersiz avatar seçimi.',
  })
  avatar?: string;
}

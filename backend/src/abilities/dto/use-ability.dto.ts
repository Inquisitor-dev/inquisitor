import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ABILITIES } from '../abilities';

export class UseAbilityDto {
  @IsString()
  @IsIn(ABILITIES.map((ability) => ability.id), {
    message: 'Geçersiz yetenek.',
  })
  abilityId: string;

  // Şüpheli hedefli yeteneklerde (Tehdit, Sessiz Oda, Hakkında Söylenenler…)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  npcId?: string;

  // Mekân hedefli yeteneklerde (Kulis, İz Sürme, Çatı Geçişi)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  locationId?: string;

  // Veri Sızdırma: panodaki ip ve panonun istemcideki son hâli
  @IsOptional()
  @IsString()
  @MaxLength(60)
  stringId?: string;

  @IsOptional()
  @IsObject()
  board?: Record<string, unknown>;
}

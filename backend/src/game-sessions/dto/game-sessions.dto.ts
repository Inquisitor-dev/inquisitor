import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { CHARACTER_IDS } from '../../abilities/abilities';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'], { message: 'Geçersiz zorluk seçimi.' })
  difficulty?: string;

  @IsOptional()
  @IsString()
  @IsIn(['medieval', 'modern', 'cyberpunk', 'china', 'winter'], {
    message: 'Geçersiz evren seçimi.',
  })
  scenarioType?: string;

  @IsOptional()
  @IsBoolean()
  testMode?: boolean;

  // Giyili karakter; vaka boyunca yeteneklerini belirler
  @IsOptional()
  @IsString()
  @IsIn([...CHARACTER_IDS], { message: 'Geçersiz karakter seçimi.' })
  characterId?: string;
}

export class UpdateNotesDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CondemnNpcDto {
  @IsString()
  npcId: string;
}

export class ConsumeWarrantDto {
  @IsString()
  location: string;
}

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CHARACTER_IDS } from '../../abilities/abilities';
import { RAID_ACTIONS } from '../../personas/raid-engine';
import { MOTIVES, TIMES_OF_DEATH } from '../../scenarios/case-catalog';
import {
  MAX_NARRATIVE_LENGTH,
  MAX_REPORT_EVIDENCE,
} from '../verdict/verdict-report';

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

// Hüküm Dosyası: katilin yanında oyuncunun olay raporu (eski istemciler göndermez)
export class VerdictReportDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_REPORT_EVIDENCE)
  @IsString({ each: true })
  evidenceIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  weaponId?: string;

  @IsOptional()
  @IsIn(MOTIVES)
  motive?: (typeof MOTIVES)[number];

  @IsOptional()
  @IsIn(TIMES_OF_DEATH)
  timeOfDeath?: (typeof TIMES_OF_DEATH)[number];

  // { npcId: InvolvementKind }; değerler serviste katalogla karşılaştırılır
  @IsOptional()
  @IsObject()
  involvements?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NARRATIVE_LENGTH)
  narrative?: string;
}

export class CondemnNpcDto {
  @IsString()
  npcId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VerdictReportDto)
  report?: VerdictReportDto;
}

export class ConsumeWarrantDto {
  @IsString()
  location: string;
}

// Gece baskınında bir aksiyon (personas/raid-engine.ts RaidAction)
export class RaidActDto {
  @IsString()
  @IsIn(RAID_ACTIONS, { message: 'Geçersiz aksiyon.' })
  action: string;
}

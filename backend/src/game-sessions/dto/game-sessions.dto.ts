import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

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

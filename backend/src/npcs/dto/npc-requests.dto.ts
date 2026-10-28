import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_PLAYER_MESSAGE_LENGTH } from '../prompt-guard';

export class InteractDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;

  @IsNotEmpty({ message: 'message gereklidir' })
  @IsString()
  @MaxLength(MAX_PLAYER_MESSAGE_LENGTH, {
    message: `Mesaj en fazla ${MAX_PLAYER_MESSAGE_LENGTH} karakter olabilir.`,
  })
  message: string;

  // "Arama İzni İste" penceresinde seçilen mekân; yalnızca izin veren karaktere gönderilir
  @IsOptional()
  @IsString()
  warrantLocationId?: string;
}

export class ConfrontDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;

  @IsNotEmpty({ message: 'evidenceId gereklidir' })
  @IsString()
  evidenceId: string;

  // Kanıtı gösterirken söylenen söz (isteğe bağlı)
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PLAYER_MESSAGE_LENGTH, {
    message: `Mesaj en fazla ${MAX_PLAYER_MESSAGE_LENGTH} karakter olabilir.`,
  })
  message?: string;
}

export class HistoryDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;
}

export class QuotesDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  // Sözün okunacağı şüpheli; kendi sözü listeye girmez
  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;
}

export class VerifyQuoteDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;

  @IsNotEmpty({ message: 'quoteId gereklidir' })
  @IsString()
  quoteId: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
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
}

export class HistoryDto {
  @IsNotEmpty({ message: 'sessionId gereklidir' })
  @IsString()
  sessionId: string;

  @IsNotEmpty({ message: 'npcId gereklidir' })
  @IsString()
  npcId: string;
}

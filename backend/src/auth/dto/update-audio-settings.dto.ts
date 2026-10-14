import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateAudioSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  musicVolume?: number;

  @IsOptional()
  @IsBoolean()
  musicMuted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  footstepVolume?: number;

  @IsOptional()
  @IsBoolean()
  footstepMuted?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  doorVolume?: number;

  @IsOptional()
  @IsBoolean()
  doorMuted?: boolean;
}

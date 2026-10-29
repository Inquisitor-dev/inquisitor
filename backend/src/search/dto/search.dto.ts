import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';

// Aranacak alan: iç mekândaki tıklama noktasının id'si
export class SearchStartDto {
  @IsString()
  @Matches(/^[a-z0-9_]{1,40}$/)
  areaId!: string;
}

// Tıklanan nokta, görselin yüzdesi olarak
export class SearchClickDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y!: number;
}

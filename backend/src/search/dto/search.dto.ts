import { IsNumber, Max, Min } from 'class-validator';

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

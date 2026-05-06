import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateApplicationCohortDto {
  @IsString()
  name!: string;

  @IsDateString()
  opens_at!: string;

  @IsDateString()
  closes_at!: string;

  @IsInt()
  @Min(0)
  game_cutoff_score!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_applicants?: number;
}

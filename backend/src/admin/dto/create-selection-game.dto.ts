import { IsDateString, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateSelectionGameDto {
  @IsString()
  cohort_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduled_at!: string;

  @IsInt()
  @Min(1)
  duration_minutes!: number;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

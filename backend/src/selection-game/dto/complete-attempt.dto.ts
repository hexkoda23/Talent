import { IsInt, IsNotEmpty, IsObject, IsOptional, Max, Min } from 'class-validator';

export class CompleteAttemptDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeElapsed?: number;

  @IsObject()
  @IsNotEmpty()
  breakdown!: Record<string, number>;

  @IsOptional()
  @IsObject()
  attempt_data?: Record<string, unknown>;
}

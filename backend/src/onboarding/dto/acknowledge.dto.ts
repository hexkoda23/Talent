import { IsBoolean } from 'class-validator';

export class AcknowledgeOnboardingDto {
  @IsBoolean()
  ack!: boolean;
}

import { IsEnum } from 'class-validator';
import { OnboardingDocumentStatus, RegistrationDocumentStatus } from '@prisma/client';

export class UpdateRegistrationDocumentStatusDto {
  @IsEnum(RegistrationDocumentStatus)
  status!: RegistrationDocumentStatus;
}

export class UpdateOnboardingDocumentStatusDto {
  @IsEnum(OnboardingDocumentStatus)
  status!: OnboardingDocumentStatus;
}

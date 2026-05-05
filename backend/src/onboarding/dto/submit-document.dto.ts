import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { OnboardingDocumentType } from '@prisma/client';

const ALLOWED_TYPES: OnboardingDocumentType[] = ['cys_form', 'logbook', 'acceptance_letter', 'other'];

export class SubmitOnboardingDocumentDto {
  @IsIn(ALLOWED_TYPES as unknown as string[])
  document_type!: OnboardingDocumentType;

  @IsString()
  @IsNotEmpty()
  file_url!: string;

  @IsString()
  @IsNotEmpty()
  original_filename!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

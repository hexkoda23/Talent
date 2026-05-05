import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const ALLOWED_PURPOSES = [
  'registration_document',
  'onboarding_document',
  'profile_picture',
  'logbook_attachment',
] as const;

export type UploadPurpose = (typeof ALLOWED_PURPOSES)[number];

export class PresignDto {
  @IsIn(ALLOWED_PURPOSES as unknown as string[])
  purpose!: UploadPurpose;

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  mime_type!: string;
}

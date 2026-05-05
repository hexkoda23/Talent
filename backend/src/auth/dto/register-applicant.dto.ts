import {
  IsEmail,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

class ConsentsDto {
  @IsBoolean()
  phone_linked_to_nin!: boolean;

  @IsBoolean()
  duplicate_understanding!: boolean;

  @IsBoolean()
  truth_attestation!: boolean;
}

export class RegisterApplicantDto {
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsString()
  @Length(11, 11)
  nin!: string;

  @IsString()
  @IsNotEmpty()
  institution_name!: string;

  @IsEmail()
  institution_email!: string;

  @IsString()
  @IsNotEmpty()
  matric_number!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsString()
  @IsNotEmpty()
  level!: string;

  @IsString()
  @IsNotEmpty()
  campus_id!: string;

  @IsIn([3, 4, 6])
  @Type(() => Number)
  siwes_duration_months!: number;

  @ValidateNested()
  @Transform(({ value }) => {
    let parsed = value;

    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    }

    if (parsed && typeof parsed === 'object') {
      return plainToInstance(ConsentsDto, parsed);
    }

    return parsed;
  })
  @Type(() => ConsentsDto)
  consents!: ConsentsDto;
}

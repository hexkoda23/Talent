import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ASSIGNABLE_ROLE_NAMES } from '../role-hierarchy';

export class CreateAdminUserDto {
  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nin?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsIn(ASSIGNABLE_ROLE_NAMES)
  role_name!: string;
}

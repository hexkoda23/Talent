import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';
import { ASSIGNABLE_ROLE_NAMES } from '../role-hierarchy';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ASSIGNABLE_ROLE_NAMES, { each: true })
  role_names!: string[];
}

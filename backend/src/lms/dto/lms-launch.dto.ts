import { IsString, Matches } from 'class-validator';

export class LmsLaunchDto {
  @IsString()
  @Matches(/^\/(quests|audits|quest\/[^/?#]+|audit\/[^/?#]+|admin|admin\/quest\/[^/?#]+)$/)
  next!: string;
}

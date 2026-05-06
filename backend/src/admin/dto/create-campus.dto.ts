import { IsInt, IsString, Min } from 'class-validator';

export class CreateCampusDto {
  @IsString()
  name!: string;

  @IsString()
  location_city!: string;

  @IsString()
  location_state!: string;

  @IsString()
  location_address!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}

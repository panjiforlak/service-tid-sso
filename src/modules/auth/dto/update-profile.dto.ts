import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

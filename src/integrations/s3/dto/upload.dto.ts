import { IsNotEmpty } from 'class-validator';

export class UploadDto {
  @IsNotEmpty()
  readonly folder: string;
}

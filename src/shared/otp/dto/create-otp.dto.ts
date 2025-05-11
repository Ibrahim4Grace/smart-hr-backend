import { IsNotEmpty, IsString } from 'class-validator';

export class OtpDto {
  @IsNotEmpty()
  @IsString()
  otp: string;
}

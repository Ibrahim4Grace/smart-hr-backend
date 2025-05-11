import { ApiProperty } from '@nestjs/swagger';
import { HasMimeType, MaxFileSize } from 'nestjs-form-data';

export class UploadUserProfilePicDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile picture file',
    maxLength: 2 * 1024 * 1024,
  })
  @HasMimeType(['image/jpeg', 'image/png'])
  @MaxFileSize(2 * 1024 * 1024)
  avatar: Express.Multer.File;
}

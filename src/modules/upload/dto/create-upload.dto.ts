import {
  IsArray,
  IsString,
  IsUrl,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UPLOAD_CONSTANTS } from '../../shared/constants/upload.constants';

export class CreateUploadDto {
  @ApiProperty({
    description: 'Array of file URLs to upload',
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    type: [String],
    minItems: 1,
    maxItems: UPLOAD_CONSTANTS.MAX_URLS_PER_REQUEST,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(UPLOAD_CONSTANTS.MAX_URLS_PER_REQUEST)
  @IsUrl({}, { each: true })
  @IsString({ each: true })
  urls: string[];
}

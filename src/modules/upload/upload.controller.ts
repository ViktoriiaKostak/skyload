import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: 'Create new uploads' })
  @ApiResponse({
    status: 201,
    description: 'Uploads successfully created',
    type: [UploadResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post()
  async createUploads(@Body() createUploadDto: CreateUploadDto) {
    return this.uploadService.createUploads(createUploadDto);
  }

  @ApiOperation({ summary: 'Get list of uploads with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Uploads list successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        uploads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              originalUrl: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @Get()
  async getUploads(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.uploadService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get status of specific upload' })
  @ApiParam({ name: 'id', description: 'Upload ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Upload status successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        originalUrl: { type: 'string' },
        status: { type: 'string' },
        fileSize: { type: 'number' },
        googleDriveId: { type: 'string' },
        googleDriveLink: { type: 'string' },
        errorMessage: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  @Get(':id/status')
  async getUploadStatus(@Param('id') id: string) {
    return this.uploadService.findOne(id);
  }
}

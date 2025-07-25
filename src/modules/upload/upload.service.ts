import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Upload } from './entities/upload.entity';
import { CreateUploadDto } from './dto/create-upload.dto';
import {
  UploadResponseDto,
  UploadListResponseDto,
} from './dto/upload-response.dto';
import { SharedService } from '../shared/shared.service';
import { UPLOAD_CONSTANTS } from '../shared/constants/upload.constants';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
    @InjectQueue('file-processing')
    private fileProcessingQueue: Queue,
    private sharedService: SharedService,
  ) {}

  async createUploads(
    createUploadDto: CreateUploadDto,
  ): Promise<UploadResponseDto[]> {
    const uploads: Upload[] = [];

    for (const url of createUploadDto.urls) {
      if (!this.sharedService.validateUrl(url)) {
        continue;
      }

      const upload = this.uploadRepository.create({
        originalUrl: url,
        filename: this.extractFilenameFromUrl(url),
      });

      const savedUpload = await this.uploadRepository.save(upload);
      uploads.push(savedUpload);

      await this.fileProcessingQueue.add('process-file', {
        uploadId: savedUpload.id,
        url,
      });
    }

    return uploads.map(this.mapToResponseDto);
  }

  async findAll(
    page: number = 1,
    limit: number = UPLOAD_CONSTANTS.DEFAULT_PAGE_SIZE,
  ): Promise<UploadListResponseDto> {
    const [uploads, total] = await this.uploadRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      uploads: uploads.map(this.mapToResponseDto),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<UploadResponseDto> {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (!upload) {
      throw new Error('Upload not found');
    }
    return this.mapToResponseDto(upload);
  }

  async updateStatus(id: string, status: string, data?: any): Promise<void> {
    await this.uploadRepository.update(id, {
      status,
      ...data,
    });
  }

  private extractFilenameFromUrl(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }
    return `file_${Date.now()}`;
  }

  private mapToResponseDto(upload: Upload): UploadResponseDto {
    return {
      id: upload.id,
      originalUrl: upload.originalUrl,
      filename: upload.filename,
      status: upload.status,
      googleDriveId: upload.googleDriveId,
      googleDriveLink: upload.googleDriveLink,
      fileSize: upload.fileSize,
      errorMessage: upload.errorMessage,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };
  }
}

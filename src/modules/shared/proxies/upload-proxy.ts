import { Injectable } from '@nestjs/common';
import { UploadService } from '../../upload/upload.service';
import { UploadCacheService } from '../cache/cache.service';
import { StructuredLoggerService } from '../services/structured-logger.service';

@Injectable()
export class UploadServiceProxy {
  constructor(
    private readonly uploadService: UploadService,
    private readonly cacheService: UploadCacheService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async createUploads(data: any): Promise<any[]> {
    const startTime = Date.now();

    try {
      this.logger.info('Creating uploads', { urls: data.urls });

      const result = await this.uploadService.createUploads(data);

      this.logger.info('Uploads created successfully', {
        count: result.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create uploads', error, {
        urls: data.urls,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<any> {
    const cacheKey = `uploads:list:${page}:${limit}`;
    const cached = this.cacheService.getUploadsList(page, limit);

    if (cached) {
      this.logger.debug('Returning cached uploads list', { page, limit });
      return cached;
    }

    const startTime = Date.now();

    try {
      this.logger.info('Fetching uploads list', { page, limit });

      const result = await this.uploadService.findAll(page, limit);

      this.cacheService.setUploadsList(page, limit, result);

      this.logger.info('Uploads list fetched successfully', {
        count: result.uploads.length,
        total: result.total,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch uploads list', error, {
        page,
        limit,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    const cached = this.cacheService.getUpload(id);

    if (cached) {
      this.logger.debug('Returning cached upload', { uploadId: id });
      return cached;
    }

    const startTime = Date.now();

    try {
      this.logger.info('Fetching upload', { uploadId: id });

      const result = await this.uploadService.findOne(id);

      this.cacheService.setUpload(id, result);

      this.logger.info('Upload fetched successfully', {
        uploadId: id,
        status: result.status,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch upload', error, {
        uploadId: id,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  async updateStatus(id: string, status: string, data?: any): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Updating upload status', { uploadId: id, status });

      await this.uploadService.updateStatus(id, status, data);

      this.cacheService.invalidateUpload(id);
      this.cacheService.invalidateUploadsList();

      this.logger.info('Upload status updated successfully', {
        uploadId: id,
        status,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error('Failed to update upload status', error, {
        uploadId: id,
        status,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}

@Injectable()
export class DriveServiceProxy {
  constructor(
    private readonly driveService: any,
    private readonly logger: StructuredLoggerService,
  ) {}

  async uploadFile(
    file: any,
    filename: string,
    mimeType: string,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.info('Uploading file to Google Drive', {
        filename,
        mimeType,
      });

      const result = await this.driveService.uploadFile(
        file,
        filename,
        mimeType,
      );

      this.logger.info('File uploaded to Google Drive successfully', {
        filename,
        driveId: result.id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to upload file to Google Drive', error, {
        filename,
        mimeType,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}

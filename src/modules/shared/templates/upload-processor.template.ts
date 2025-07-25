import { Injectable } from '@nestjs/common';
import { UploadStatus } from '../shared.service';

export abstract class UploadProcessorTemplate {
  abstract validateUrl(url: string): boolean;
  abstract downloadFile(url: string): Promise<any>;
  abstract uploadToStorage(fileData: any): Promise<any>;
  abstract updateStatus(
    uploadId: string,
    status: string,
    data?: any,
  ): Promise<void>;

  async processUpload(uploadId: string, url: string): Promise<void> {
    try {
      if (!this.validateUrl(url)) {
        throw new Error('Invalid URL');
      }

      await this.updateStatus(uploadId, UploadStatus.DOWNLOADING);
      const fileData = await this.downloadFile(url);

      await this.updateStatus(uploadId, UploadStatus.UPLOADING, {
        fileSize: fileData.size,
      });
      const storageResult = await this.uploadToStorage(fileData);

      await this.updateStatus(uploadId, UploadStatus.COMPLETED, {
        googleDriveId: storageResult.id,
        googleDriveLink: storageResult.link,
        fileSize: fileData.size,
      });
    } catch (error) {
      await this.updateStatus(uploadId, UploadStatus.FAILED, {
        errorMessage: error.message,
      });
      throw error;
    }
  }
}

@Injectable()
export class GoogleDriveUploadProcessor extends UploadProcessorTemplate {
  constructor(
    private readonly driveService: any,
    private readonly sharedService: any,
    private readonly uploadService: any,
  ) {
    super();
  }

  validateUrl(url: string): boolean {
    return this.sharedService.validateUrl(url);
  }

  async downloadFile(url: string): Promise<any> {
    return this.sharedService.downloadFile(url);
  }

  async uploadToStorage(fileData: any): Promise<any> {
    const mimeType = this.getMimeType(fileData.filename);
    return this.driveService.uploadFile(
      fileData.stream,
      fileData.filename,
      mimeType,
    );
  }

  async updateStatus(
    uploadId: string,
    status: string,
    data?: any,
  ): Promise<void> {
    await this.uploadService.updateStatus(uploadId, status, data);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

import { Upload } from '../../upload/entities/upload.entity';
import { UploadStatus } from '../shared.service';

export class UploadFactory {
  static create(data: Partial<Upload> = {}): Upload {
    const upload = new Upload();

    upload.id = data.id || this.generateId();
    upload.originalUrl = data.originalUrl || '';
    upload.filename =
      data.filename || this.extractFilename(data.originalUrl || '');
    upload.status = data.status || UploadStatus.QUEUED;
    upload.googleDriveId = data.googleDriveId || null;
    upload.googleDriveLink = data.googleDriveLink || null;
    upload.fileSize = data.fileSize || null;
    upload.errorMessage = data.errorMessage || null;
    upload.createdAt = data.createdAt || new Date();
    upload.updatedAt = data.updatedAt || new Date();

    return upload;
  }

  static createQueued(url: string): Upload {
    return this.create({
      originalUrl: url,
      filename: this.extractFilename(url),
      status: UploadStatus.QUEUED,
    });
  }

  static createCompleted(
    url: string,
    googleDriveId: string,
    googleDriveLink: string,
    fileSize: number,
  ): Upload {
    return this.create({
      originalUrl: url,
      filename: this.extractFilename(url),
      status: UploadStatus.COMPLETED,
      googleDriveId,
      googleDriveLink,
      fileSize,
    });
  }

  static createFailed(url: string, errorMessage: string): Upload {
    return this.create({
      originalUrl: url,
      filename: this.extractFilename(url),
      status: UploadStatus.FAILED,
      errorMessage,
    });
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static extractFilename(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }
    return `file_${Date.now()}`;
  }
}

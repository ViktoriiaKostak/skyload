import { Upload } from '../../upload/entities/upload.entity';
import { UploadStatus } from '../shared.service';

export class UploadBuilder {
  private upload: Partial<Upload> = {};

  setId(id: string): UploadBuilder {
    this.upload.id = id;
    return this;
  }

  setOriginalUrl(url: string): UploadBuilder {
    this.upload.originalUrl = url;
    return this;
  }

  setFilename(filename: string): UploadBuilder {
    this.upload.filename = filename;
    return this;
  }

  setStatus(status: UploadStatus): UploadBuilder {
    this.upload.status = status;
    return this;
  }

  setGoogleDriveId(driveId: string): UploadBuilder {
    this.upload.googleDriveId = driveId;
    return this;
  }

  setGoogleDriveLink(link: string): UploadBuilder {
    this.upload.googleDriveLink = link;
    return this;
  }

  setFileSize(size: number): UploadBuilder {
    this.upload.fileSize = size;
    return this;
  }

  setErrorMessage(error: string): UploadBuilder {
    this.upload.errorMessage = error;
    return this;
  }

  setCreatedAt(date: Date): UploadBuilder {
    this.upload.createdAt = date;
    return this;
  }

  setUpdatedAt(date: Date): UploadBuilder {
    this.upload.updatedAt = date;
    return this;
  }

  build(): Upload {
    const upload = new Upload();

    upload.id = this.upload.id || this.generateId();
    upload.originalUrl = this.upload.originalUrl || '';
    upload.filename =
      this.upload.filename ||
      this.extractFilename(this.upload.originalUrl || '');
    upload.status = this.upload.status || UploadStatus.QUEUED;
    upload.googleDriveId = this.upload.googleDriveId || null;
    upload.googleDriveLink = this.upload.googleDriveLink || null;
    upload.fileSize = this.upload.fileSize || null;
    upload.errorMessage = this.upload.errorMessage || null;
    upload.createdAt = this.upload.createdAt || new Date();
    upload.updatedAt = this.upload.updatedAt || new Date();

    return upload;
  }

  reset(): UploadBuilder {
    this.upload = {};
    return this;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private extractFilename(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }
    return `file_${Date.now()}`;
  }
}

export class UploadDirector {
  constructor(private readonly builder: UploadBuilder) {}

  createQueuedUpload(url: string): Upload {
    return this.builder
      .reset()
      .setOriginalUrl(url)
      .setFilename(this.extractFilename(url))
      .setStatus(UploadStatus.QUEUED)
      .build();
  }

  createCompletedUpload(
    url: string,
    googleDriveId: string,
    googleDriveLink: string,
    fileSize: number,
  ): Upload {
    return this.builder
      .reset()
      .setOriginalUrl(url)
      .setFilename(this.extractFilename(url))
      .setStatus(UploadStatus.COMPLETED)
      .setGoogleDriveId(googleDriveId)
      .setGoogleDriveLink(googleDriveLink)
      .setFileSize(fileSize)
      .build();
  }

  createFailedUpload(url: string, errorMessage: string): Upload {
    return this.builder
      .reset()
      .setOriginalUrl(url)
      .setFilename(this.extractFilename(url))
      .setStatus(UploadStatus.FAILED)
      .setErrorMessage(errorMessage)
      .build();
  }

  private extractFilename(url: string): string {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }
    return `file_${Date.now()}`;
  }
}

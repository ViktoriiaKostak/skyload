import { Injectable } from '@nestjs/common';
import { UploadService } from '../../upload/upload.service';
import { DriveService } from '../../drive/drive.service';
import { SharedService } from '../shared.service';
import { StructuredLoggerService } from '../services/structured-logger.service';

export interface UploadColleague {
  notify(event: string, data: any): void;
}

export interface UploadEvent {
  type: string;
  uploadId: string;
  data?: any;
  timestamp: Date;
}

@Injectable()
export class UploadMediator {
  private colleagues: Map<string, UploadColleague> = new Map();
  private eventHistory: UploadEvent[] = [];

  constructor(
    private readonly uploadService: UploadService,
    private readonly driveService: DriveService,
    private readonly sharedService: SharedService,
    private readonly logger: StructuredLoggerService,
  ) {}

  registerColleague(name: string, colleague: UploadColleague): void {
    this.colleagues.set(name, colleague);
    this.logger.info('Colleague registered', { name });
  }

  unregisterColleague(name: string): void {
    this.colleagues.delete(name);
    this.logger.info('Colleague unregistered', { name });
  }

  async processUpload(uploadId: string, url: string): Promise<void> {
    const event: UploadEvent = {
      type: 'upload.started',
      uploadId,
      data: { url },
      timestamp: new Date(),
    };

    this.recordEvent(event);
    this.notifyColleagues('upload.started', { uploadId, url });

    try {
      await this.uploadService.updateStatus(uploadId, 'downloading');
      this.notifyColleagues('status.changed', {
        uploadId,
        status: 'downloading',
      });

      const fileData = await this.sharedService.downloadFile(url);
      this.notifyColleagues('file.downloaded', {
        uploadId,
        filename: fileData.filename,
        size: fileData.size,
      });

      await this.uploadService.updateStatus(uploadId, 'uploading', {
        fileSize: fileData.size,
      });
      this.notifyColleagues('status.changed', {
        uploadId,
        status: 'uploading',
      });

      const mimeType = this.getMimeType(fileData.filename);
      const driveResult = await this.driveService.uploadFile(
        fileData.stream,
        fileData.filename,
        mimeType,
      );
      this.notifyColleagues('file.uploaded', {
        uploadId,
        driveId: driveResult.id,
        driveLink: driveResult.link,
      });

      await this.uploadService.updateStatus(uploadId, 'completed', {
        googleDriveId: driveResult.id,
        googleDriveLink: driveResult.link,
        fileSize: fileData.size,
      });
      this.notifyColleagues('status.changed', {
        uploadId,
        status: 'completed',
      });

      const successEvent: UploadEvent = {
        type: 'upload.completed',
        uploadId,
        data: { driveId: driveResult.id, driveLink: driveResult.link },
        timestamp: new Date(),
      };
      this.recordEvent(successEvent);
      this.notifyColleagues('upload.completed', {
        uploadId,
        driveId: driveResult.id,
        driveLink: driveResult.link,
      });
    } catch (error) {
      await this.uploadService.updateStatus(uploadId, 'failed', {
        errorMessage: error.message,
      });
      this.notifyColleagues('status.changed', {
        uploadId,
        status: 'failed',
        error: error.message,
      });

      const failureEvent: UploadEvent = {
        type: 'upload.failed',
        uploadId,
        data: { error: error.message },
        timestamp: new Date(),
      };
      this.recordEvent(failureEvent);
      this.notifyColleagues('upload.failed', {
        uploadId,
        error: error.message,
      });
    }
  }

  async createUploads(urls: string[]): Promise<any[]> {
    const uploads = [];

    for (const url of urls) {
      if (!this.sharedService.validateUrl(url)) {
        this.logger.warn('Invalid URL skipped', { url });
        continue;
      }

      const upload = await this.uploadService.createUploads({ urls: [url] });
      uploads.push(...upload);

      this.notifyColleagues('upload.created', { uploads: upload });
    }

    return uploads;
  }

  async getUploadStatus(uploadId: string): Promise<any> {
    const upload = await this.uploadService.findOne(uploadId);
    this.notifyColleagues('status.requested', {
      uploadId,
      status: upload.status,
    });
    return upload;
  }

  async getUploadsList(page: number = 1, limit: number = 10): Promise<any> {
    const result = await this.uploadService.findAll(page, limit);
    this.notifyColleagues('list.requested', {
      page,
      limit,
      count: result.uploads.length,
    });
    return result;
  }

  getEventHistory(uploadId?: string): UploadEvent[] {
    if (uploadId) {
      return this.eventHistory.filter(event => event.uploadId === uploadId);
    }
    return this.eventHistory;
  }

  private notifyColleagues(event: string, data: any): void {
    this.colleagues.forEach((colleague, name) => {
      try {
        colleague.notify(event, data);
      } catch (error) {
        this.logger.error('Error notifying colleague', error, {
          colleague: name,
          event,
        });
      }
    });
  }

  private recordEvent(event: UploadEvent): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }
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

@Injectable()
export class UploadLoggerColleague implements UploadColleague {
  constructor(private readonly logger: StructuredLoggerService) {}

  notify(event: string, data: any): void {
    this.logger.info(`Upload event: ${event}`, data);
  }
}

@Injectable()
export class UploadMetricsColleague implements UploadColleague {
  private metrics = {
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    averageProcessingTime: 0,
  };

  notify(event: string, data: any): void {
    switch (event) {
      case 'upload.created':
        this.metrics.totalUploads++;
        break;
      case 'upload.completed':
        this.metrics.successfulUploads++;
        break;
      case 'upload.failed':
        this.metrics.failedUploads++;
        break;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

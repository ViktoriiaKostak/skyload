export interface UploadElement {
  accept(visitor: UploadVisitor): void;
}

export interface UploadVisitor {
  visitQueuedUpload(upload: any): void;
  visitDownloadingUpload(upload: any): void;
  visitUploadingUpload(upload: any): void;
  visitCompletedUpload(upload: any): void;
  visitFailedUpload(upload: any): void;
}

export class UploadElementImpl implements UploadElement {
  constructor(private upload: any) {}

  accept(visitor: UploadVisitor): void {
    switch (this.upload.status) {
      case 'queued':
        visitor.visitQueuedUpload(this.upload);
        break;
      case 'downloading':
        visitor.visitDownloadingUpload(this.upload);
        break;
      case 'uploading':
        visitor.visitUploadingUpload(this.upload);
        break;
      case 'completed':
        visitor.visitCompletedUpload(this.upload);
        break;
      case 'failed':
        visitor.visitFailedUpload(this.upload);
        break;
      default:
        console.warn(`Unknown upload status: ${this.upload.status}`);
    }
  }
}

export class UploadLoggerVisitor implements UploadVisitor {
  constructor(private logger: any) {}

  visitQueuedUpload(upload: any): void {
    this.logger.info('Processing queued upload', {
      uploadId: upload.id,
      originalUrl: upload.originalUrl,
    });
  }

  visitDownloadingUpload(upload: any): void {
    this.logger.info('Processing downloading upload', {
      uploadId: upload.id,
      originalUrl: upload.originalUrl,
    });
  }

  visitUploadingUpload(upload: any): void {
    this.logger.info('Processing uploading upload', {
      uploadId: upload.id,
      filename: upload.filename,
      fileSize: upload.fileSize,
    });
  }

  visitCompletedUpload(upload: any): void {
    this.logger.info('Processing completed upload', {
      uploadId: upload.id,
      googleDriveId: upload.googleDriveId,
      googleDriveLink: upload.googleDriveLink,
      fileSize: upload.fileSize,
    });
  }

  visitFailedUpload(upload: any): void {
    this.logger.error('Processing failed upload', {
      uploadId: upload.id,
      errorMessage: upload.errorMessage,
    });
  }
}

export class UploadMetricsVisitor implements UploadVisitor {
  private metrics = {
    queued: 0,
    downloading: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  };

  visitQueuedUpload(upload: any): void {
    this.metrics.queued++;
  }

  visitDownloadingUpload(upload: any): void {
    this.metrics.downloading++;
  }

  visitUploadingUpload(upload: any): void {
    this.metrics.uploading++;
  }

  visitCompletedUpload(upload: any): void {
    this.metrics.completed++;
  }

  visitFailedUpload(upload: any): void {
    this.metrics.failed++;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      queued: 0,
      downloading: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
    };
  }
}

export class UploadValidationVisitor implements UploadVisitor {
  private validationErrors: string[] = [];

  visitQueuedUpload(upload: any): void {
    if (!upload.originalUrl) {
      this.validationErrors.push(`Upload ${upload.id}: Missing original URL`);
    }
  }

  visitDownloadingUpload(upload: any): void {
    if (!upload.originalUrl) {
      this.validationErrors.push(`Upload ${upload.id}: Missing original URL`);
    }
  }

  visitUploadingUpload(upload: any): void {
    if (!upload.filename) {
      this.validationErrors.push(`Upload ${upload.id}: Missing filename`);
    }
    if (!upload.fileSize) {
      this.validationErrors.push(`Upload ${upload.id}: Missing file size`);
    }
  }

  visitCompletedUpload(upload: any): void {
    if (!upload.googleDriveId) {
      this.validationErrors.push(
        `Upload ${upload.id}: Missing Google Drive ID`,
      );
    }
    if (!upload.googleDriveLink) {
      this.validationErrors.push(
        `Upload ${upload.id}: Missing Google Drive link`,
      );
    }
    if (!upload.fileSize) {
      this.validationErrors.push(`Upload ${upload.id}: Missing file size`);
    }
  }

  visitFailedUpload(upload: any): void {
    if (!upload.errorMessage) {
      this.validationErrors.push(`Upload ${upload.id}: Missing error message`);
    }
  }

  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  clearValidationErrors(): void {
    this.validationErrors = [];
  }

  hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }
}

export class UploadProcessor {
  private visitors: UploadVisitor[] = [];

  addVisitor(visitor: UploadVisitor): void {
    this.visitors.push(visitor);
  }

  removeVisitor(visitor: UploadVisitor): void {
    const index = this.visitors.indexOf(visitor);
    if (index > -1) {
      this.visitors.splice(index, 1);
    }
  }

  processUpload(upload: any): void {
    const element = new UploadElementImpl(upload);

    this.visitors.forEach(visitor => {
      element.accept(visitor);
    });
  }

  processUploads(uploads: any[]): void {
    uploads.forEach(upload => {
      this.processUpload(upload);
    });
  }
}

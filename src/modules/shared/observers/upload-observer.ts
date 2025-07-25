import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from '../services/structured-logger.service';

export interface UploadEvent {
  type: string;
  uploadId: string;
  data?: any;
  timestamp: Date;
}

export interface UploadObserver {
  onUploadEvent(event: UploadEvent): void;
}

@Injectable()
export class UploadEventLogger implements UploadObserver {
  constructor(private readonly logger: StructuredLoggerService) {}

  onUploadEvent(event: UploadEvent): void {
    this.logger.info(`Upload event: ${event.type}`, {
      uploadId: event.uploadId,
      eventType: event.type,
      data: event.data,
    });
  }
}

@Injectable()
export class UploadEventNotifier implements UploadObserver {
  onUploadEvent(event: UploadEvent): void {
    switch (event.type) {
      case 'upload.completed':
        this.notifyCompletion(event);
        break;
      case 'upload.failed':
        this.notifyFailure(event);
        break;
      default:
        break;
    }
  }

  private notifyCompletion(event: UploadEvent): void {
    console.log(`Upload ${event.uploadId} completed successfully`);
  }

  private notifyFailure(event: UploadEvent): void {
    console.error(`Upload ${event.uploadId} failed:`, event.data?.error);
  }
}

@Injectable()
export class UploadEventManager {
  private observers: UploadObserver[] = [];

  constructor(
    private readonly logger: UploadEventLogger,
    private readonly notifier: UploadEventNotifier,
  ) {
    this.addObserver(this.logger);
    this.addObserver(this.notifier);
  }

  addObserver(observer: UploadObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: UploadObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers(event: UploadEvent): void {
    this.observers.forEach(observer => {
      try {
        observer.onUploadEvent(event);
      } catch (error) {
        console.error('Error in upload observer:', error);
      }
    });
  }

  emitUploadCreated(uploadId: string, data: any): void {
    this.notifyObservers({
      type: 'upload.created',
      uploadId,
      data,
      timestamp: new Date(),
    });
  }

  emitUploadCompleted(uploadId: string, data: any): void {
    this.notifyObservers({
      type: 'upload.completed',
      uploadId,
      data,
      timestamp: new Date(),
    });
  }

  emitUploadFailed(uploadId: string, data: any): void {
    this.notifyObservers({
      type: 'upload.failed',
      uploadId,
      data,
      timestamp: new Date(),
    });
  }
}

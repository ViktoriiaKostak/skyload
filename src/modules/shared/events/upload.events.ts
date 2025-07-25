export class UploadCreatedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly originalUrl: string,
    public readonly filename: string,
  ) {}
}

export class UploadStatusChangedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly metadata?: any,
  ) {}
}

export class UploadCompletedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly googleDriveId: string,
    public readonly googleDriveLink: string,
    public readonly fileSize: number,
  ) {}
}

export class UploadFailedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly error: string,
    public readonly originalUrl: string,
  ) {}
}

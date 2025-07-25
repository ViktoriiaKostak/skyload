export interface UploadIntrinsicState {
  mimeType: string;
  fileExtension: string;
  maxFileSize: number;
}

export interface UploadExtrinsicState {
  uploadId: string;
  originalUrl: string;
  filename: string;
  status: string;
  fileSize?: number;
  googleDriveId?: string;
  googleDriveLink?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UploadFlyweight {
  constructor(private readonly intrinsicState: UploadIntrinsicState) {}

  getMimeType(): string {
    return this.intrinsicState.mimeType;
  }

  getFileExtension(): string {
    return this.intrinsicState.fileExtension;
  }

  getMaxFileSize(): number {
    return this.intrinsicState.maxFileSize;
  }

  validateFileSize(fileSize: number): boolean {
    return fileSize <= this.intrinsicState.maxFileSize;
  }

  getIntrinsicState(): UploadIntrinsicState {
    return { ...this.intrinsicState };
  }
}

export class UploadFlyweightFactory {
  private flyweights: Map<string, UploadFlyweight> = new Map();

  private static readonly MIME_TYPES = {
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

  private static readonly MAX_FILE_SIZES = {
    jpg: 10 * 1024 * 1024,
    jpeg: 10 * 1024 * 1024,
    png: 10 * 1024 * 1024,
    gif: 10 * 1024 * 1024,
    pdf: 50 * 1024 * 1024,
    doc: 20 * 1024 * 1024,
    docx: 20 * 1024 * 1024,
    xls: 20 * 1024 * 1024,
    xlsx: 20 * 1024 * 1024,
    txt: 1 * 1024 * 1024,
    zip: 100 * 1024 * 1024,
    rar: 100 * 1024 * 1024,
  };

  getFlyweight(filename: string): UploadFlyweight {
    const extension = this.getFileExtension(filename);
    const key = extension.toLowerCase();

    if (!this.flyweights.has(key)) {
      const intrinsicState: UploadIntrinsicState = {
        mimeType:
          UploadFlyweightFactory.MIME_TYPES[key] || 'application/octet-stream',
        fileExtension: extension,
        maxFileSize:
          UploadFlyweightFactory.MAX_FILE_SIZES[key] || 100 * 1024 * 1024,
      };

      this.flyweights.set(key, new UploadFlyweight(intrinsicState));
    }

    return this.flyweights.get(key)!;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  getFlyweightCount(): number {
    return this.flyweights.size;
  }

  getAllFlyweights(): UploadFlyweight[] {
    return Array.from(this.flyweights.values());
  }
}

export class UploadContext {
  constructor(
    private readonly flyweight: UploadFlyweight,
    private readonly extrinsicState: UploadExtrinsicState,
  ) {}

  getUploadId(): string {
    return this.extrinsicState.uploadId;
  }

  getOriginalUrl(): string {
    return this.extrinsicState.originalUrl;
  }

  getFilename(): string {
    return this.extrinsicState.filename;
  }

  getStatus(): string {
    return this.extrinsicState.status;
  }

  getFileSize(): number | undefined {
    return this.extrinsicState.fileSize;
  }

  getGoogleDriveId(): string | undefined {
    return this.extrinsicState.googleDriveId;
  }

  getGoogleDriveLink(): string | undefined {
    return this.extrinsicState.googleDriveLink;
  }

  getErrorMessage(): string | undefined {
    return this.extrinsicState.errorMessage;
  }

  getCreatedAt(): Date {
    return this.extrinsicState.createdAt;
  }

  getUpdatedAt(): Date {
    return this.extrinsicState.updatedAt;
  }

  getMimeType(): string {
    return this.flyweight.getMimeType();
  }

  getFileExtension(): string {
    return this.flyweight.getFileExtension();
  }

  getMaxFileSize(): number {
    return this.flyweight.getMaxFileSize();
  }

  validateFileSize(): boolean {
    if (!this.extrinsicState.fileSize) {
      return true;
    }
    return this.flyweight.validateFileSize(this.extrinsicState.fileSize);
  }

  toObject(): any {
    return {
      ...this.extrinsicState,
      mimeType: this.flyweight.getMimeType(),
      fileExtension: this.flyweight.getFileExtension(),
      maxFileSize: this.flyweight.getMaxFileSize(),
    };
  }
}

export class UploadContextManager {
  private contexts: Map<string, UploadContext> = new Map();
  private flyweightFactory: UploadFlyweightFactory;

  constructor() {
    this.flyweightFactory = new UploadFlyweightFactory();
  }

  createContext(upload: any): UploadContext {
    const flyweight = this.flyweightFactory.getFlyweight(upload.filename);

    const extrinsicState: UploadExtrinsicState = {
      uploadId: upload.id,
      originalUrl: upload.originalUrl,
      filename: upload.filename,
      status: upload.status,
      fileSize: upload.fileSize,
      googleDriveId: upload.googleDriveId,
      googleDriveLink: upload.googleDriveLink,
      errorMessage: upload.errorMessage,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };

    const context = new UploadContext(flyweight, extrinsicState);
    this.contexts.set(upload.id, context);

    return context;
  }

  getContext(uploadId: string): UploadContext | null {
    return this.contexts.get(uploadId) || null;
  }

  removeContext(uploadId: string): boolean {
    return this.contexts.delete(uploadId);
  }

  getAllContexts(): UploadContext[] {
    return Array.from(this.contexts.values());
  }

  getFlyweightCount(): number {
    return this.flyweightFactory.getFlyweightCount();
  }

  clearContexts(): void {
    this.contexts.clear();
  }
}

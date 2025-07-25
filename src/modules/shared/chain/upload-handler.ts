export interface UploadRequest {
  uploadId: string;
  url: string;
  filename?: string;
  fileSize?: number;
  data?: {
    stream?: any;
    googleDriveId?: string;
    googleDriveLink?: string;
  };
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class UploadHandler {
  private nextHandler: UploadHandler | null = null;

  setNext(handler: UploadHandler): UploadHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(request: UploadRequest): Promise<UploadResponse> {
    const result = await this.process(request);

    if (result.success && this.nextHandler) {
      return this.nextHandler.handle(request);
    }

    return result;
  }

  protected abstract process(request: UploadRequest): Promise<UploadResponse>;
}

export class UrlValidationHandler extends UploadHandler {
  protected async process(request: UploadRequest): Promise<UploadResponse> {
    try {
      new URL(request.url);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Invalid URL format',
      };
    }
  }
}

export class FileDownloadHandler extends UploadHandler {
  constructor(private readonly sharedService: any) {
    super();
  }

  protected async process(request: UploadRequest): Promise<UploadResponse> {
    try {
      const fileData = await this.sharedService.downloadFile(request.url);

      return {
        success: true,
        data: {
          ...request,
          filename: fileData.filename,
          fileSize: fileData.size,
          stream: fileData.stream,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to download file: ${error.message}`,
      };
    }
  }
}

export class FileUploadHandler extends UploadHandler {
  constructor(private readonly driveService: any) {
    super();
  }

  protected async process(request: UploadRequest): Promise<UploadResponse> {
    try {
      if (!request.data?.stream) {
        return {
          success: false,
          error: 'No file stream available',
        };
      }

      const mimeType = this.getMimeType(request.filename || '');
      const result = await this.driveService.uploadFile(
        request.data.stream,
        request.filename || '',
        mimeType,
      );

      return {
        success: true,
        data: {
          ...request,
          googleDriveId: result.id,
          googleDriveLink: result.link,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file: ${error.message}`,
      };
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

export class StatusUpdateHandler extends UploadHandler {
  constructor(private readonly uploadService: any) {
    super();
  }

  protected async process(request: UploadRequest): Promise<UploadResponse> {
    try {
      if (request.data?.googleDriveId) {
        await this.uploadService.updateStatus(request.uploadId, 'completed', {
          googleDriveId: request.data.googleDriveId,
          googleDriveLink: request.data.googleDriveLink,
          fileSize: request.fileSize,
        });
      } else {
        await this.uploadService.updateStatus(request.uploadId, 'failed', {
          errorMessage: request.error,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update status: ${error.message}`,
      };
    }
  }
}

export class UploadChain {
  private chain: UploadHandler;

  constructor(sharedService: any, driveService: any, uploadService: any) {
    const urlValidation = new UrlValidationHandler();
    const fileDownload = new FileDownloadHandler(sharedService);
    const fileUpload = new FileUploadHandler(driveService);
    const statusUpdate = new StatusUpdateHandler(uploadService);

    urlValidation
      .setNext(fileDownload)
      .setNext(fileUpload)
      .setNext(statusUpdate);

    this.chain = urlValidation;
  }

  async process(request: UploadRequest): Promise<UploadResponse> {
    return this.chain.handle(request);
  }
}

export interface UploadImplementation {
  upload(file: any, filename: string, mimeType: string): Promise<any>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string): Promise<string>;
}

export abstract class UploadAbstraction {
  constructor(protected implementation: UploadImplementation) {}

  abstract processUpload(uploadId: string, url: string): Promise<void>;
  abstract validateUpload(upload: any): boolean;
}

export class GoogleDriveImplementation implements UploadImplementation {
  constructor(private driveService: any) {}

  async upload(file: any, filename: string, mimeType: string): Promise<any> {
    return this.driveService.uploadFile(file, filename, mimeType);
  }

  async delete(fileId: string): Promise<void> {
    await this.driveService.deleteFile(fileId);
  }

  async getUrl(fileId: string): Promise<string> {
    const file = await this.driveService.getFile(fileId);
    return file.webViewLink;
  }
}

export class LocalStorageImplementation implements UploadImplementation {
  constructor(private uploadPath: string = './uploads') {}

  async upload(file: any, filename: string, mimeType: string): Promise<any> {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    const filePath = path.join(this.uploadPath, filename);
    const writeStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      file.pipe(writeStream);

      writeStream.on('finish', () => {
        const stats = fs.statSync(filePath);
        resolve({
          id: filename,
          url: `file://${filePath}`,
          size: stats.size,
        });
      });

      writeStream.on('error', reject);
    });
  }

  async delete(fileId: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(this.uploadPath, fileId);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getUrl(fileId: string): Promise<string> {
    const path = require('path');
    const filePath = path.join(this.uploadPath, fileId);
    return `file://${filePath}`;
  }
}

export class StandardUploadAbstraction extends UploadAbstraction {
  constructor(
    implementation: UploadImplementation,
    private uploadService: any,
    private sharedService: any,
  ) {
    super(implementation);
  }

  async processUpload(uploadId: string, url: string): Promise<void> {
    try {
      await this.uploadService.updateStatus(uploadId, 'downloading');

      const fileData = await this.sharedService.downloadFile(url);

      await this.uploadService.updateStatus(uploadId, 'uploading', {
        fileSize: fileData.size,
      });

      const mimeType = this.getMimeType(fileData.filename);
      const result = await this.implementation.upload(
        fileData.stream,
        fileData.filename,
        mimeType,
      );

      await this.uploadService.updateStatus(uploadId, 'completed', {
        googleDriveId: result.id,
        googleDriveLink: result.url || result.link,
        fileSize: fileData.size,
      });
    } catch (error) {
      await this.uploadService.updateStatus(uploadId, 'failed', {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  validateUpload(upload: any): boolean {
    return (
      upload &&
      upload.originalUrl &&
      this.sharedService.validateUrl(upload.originalUrl)
    );
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

export class RetryUploadAbstraction extends StandardUploadAbstraction {
  constructor(
    implementation: UploadImplementation,
    uploadService: any,
    sharedService: any,
    private maxRetries: number = 3,
  ) {
    super(implementation, uploadService, sharedService);
  }

  async processUpload(uploadId: string, url: string): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await super.processUpload(uploadId, url);
        return;
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries) {
          break;
        }

        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError;
  }
}

export class ValidatedUploadAbstraction extends StandardUploadAbstraction {
  constructor(
    implementation: UploadImplementation,
    uploadService: any,
    sharedService: any,
    private validationRules: any[] = [],
  ) {
    super(implementation, uploadService, sharedService);
  }

  validateUpload(upload: any): boolean {
    if (!super.validateUpload(upload)) {
      return false;
    }

    return this.validationRules.every(rule => rule(upload));
  }

  addValidationRule(rule: (upload: any) => boolean): void {
    this.validationRules.push(rule);
  }

  removeValidationRule(rule: (upload: any) => boolean): void {
    const index = this.validationRules.indexOf(rule);
    if (index > -1) {
      this.validationRules.splice(index, 1);
    }
  }
}

export class UploadBridgeFactory {
  static createGoogleDriveUpload(
    driveService: any,
    uploadService: any,
    sharedService: any,
  ): UploadAbstraction {
    const implementation = new GoogleDriveImplementation(driveService);
    return new StandardUploadAbstraction(
      implementation,
      uploadService,
      sharedService,
    );
  }

  static createLocalStorageUpload(
    uploadPath: string,
    uploadService: any,
    sharedService: any,
  ): UploadAbstraction {
    const implementation = new LocalStorageImplementation(uploadPath);
    return new StandardUploadAbstraction(
      implementation,
      uploadService,
      sharedService,
    );
  }

  static createRetryUpload(
    implementation: UploadImplementation,
    uploadService: any,
    sharedService: any,
    maxRetries: number = 3,
  ): UploadAbstraction {
    return new RetryUploadAbstraction(
      implementation,
      uploadService,
      sharedService,
      maxRetries,
    );
  }

  static createValidatedUpload(
    implementation: UploadImplementation,
    uploadService: any,
    sharedService: any,
    validationRules: any[] = [],
  ): UploadAbstraction {
    return new ValidatedUploadAbstraction(
      implementation,
      uploadService,
      sharedService,
      validationRules,
    );
  }
}

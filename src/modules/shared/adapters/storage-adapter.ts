export interface StorageProvider {
  upload(file: any, filename: string, mimeType: string): Promise<StorageResult>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string): Promise<string>;
}

export interface StorageResult {
  id: string;
  url: string;
  size: number;
}

export abstract class BaseStorageAdapter implements StorageProvider {
  abstract upload(
    file: any,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult>;
  abstract delete(fileId: string): Promise<void>;
  abstract getUrl(fileId: string): Promise<string>;

  protected validateFile(file: any): void {
    if (!file) {
      throw new Error('File is required');
    }
  }

  protected validateFilename(filename: string): void {
    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename is required');
    }
  }

  protected validateMimeType(mimeType: string): void {
    if (!mimeType || mimeType.trim().length === 0) {
      throw new Error('MIME type is required');
    }
  }
}

export class GoogleDriveAdapter extends BaseStorageAdapter {
  constructor(private readonly driveService: any) {
    super();
  }

  async upload(
    file: any,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult> {
    this.validateFile(file);
    this.validateFilename(filename);
    this.validateMimeType(mimeType);

    const result = await this.driveService.uploadFile(file, filename, mimeType);

    return {
      id: result.id,
      url: result.link,
      size: file.size || 0,
    };
  }

  async delete(fileId: string): Promise<void> {
    await this.driveService.deleteFile(fileId);
  }

  async getUrl(fileId: string): Promise<string> {
    const file = await this.driveService.getFile(fileId);
    return file.webViewLink;
  }
}

export class LocalStorageAdapter extends BaseStorageAdapter {
  constructor(private readonly uploadPath: string = './uploads') {
    super();
  }

  async upload(
    file: any,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult> {
    this.validateFile(file);
    this.validateFilename(filename);
    this.validateMimeType(mimeType);

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

export class StorageAdapterFactory {
  static createGoogleDriveAdapter(driveService: any): StorageProvider {
    return new GoogleDriveAdapter(driveService);
  }

  static createLocalStorageAdapter(uploadPath?: string): StorageProvider {
    return new LocalStorageAdapter(uploadPath);
  }

  static createAdapter(type: string, config: any): StorageProvider {
    switch (type.toLowerCase()) {
      case 'googledrive':
        return this.createGoogleDriveAdapter(config.driveService);
      case 'local':
        return this.createLocalStorageAdapter(config.uploadPath);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}

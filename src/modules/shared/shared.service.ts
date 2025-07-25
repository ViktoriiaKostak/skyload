import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';
import { UPLOAD_CONSTANTS } from './constants/upload.constants';
import { FileInfo } from './interfaces/file-info.interface';

export enum UploadStatus {
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Injectable()
export class SharedService {
  async downloadFile(url: string): Promise<FileInfo> {
    try {
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: UPLOAD_CONSTANTS.DOWNLOAD_TIMEOUT,
        maxContentLength: UPLOAD_CONSTANTS.MAX_FILE_SIZE,
        headers: {
          'User-Agent': 'SkyLoad/1.0',
        },
      });

      if (!response.data || !(response.data instanceof Readable)) {
        throw new Error('Invalid response stream from URL');
      }

      const filename = this.extractFilename(
        url,
        response.headers['content-disposition'],
      );
      const size = parseInt(response.headers['content-length']) || 0;

      return {
        stream: response.data,
        filename,
        size,
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  private extractFilename(url: string, contentDisposition?: string): string {
    let filename: string;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    if (!filename) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // Remove query parameters
      const cleanLastPart = lastPart.split('?')[0];
      
      if (cleanLastPart && cleanLastPart.includes('.')) {
        filename = cleanLastPart;
      } else {
        // Try to extract extension from URL path
        const pathParts = url.split('/');
        for (let i = pathParts.length - 1; i >= 0; i--) {
          const part = pathParts[i];
          if (part && part.includes('.')) {
            filename = part.split('?')[0];
            break;
          }
        }
      }
    }

    // If still no filename, generate one
    if (!filename) {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      filename = `file_${timestamp}_${randomSuffix}`;
    }

    // Sanitize filename
    filename = filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);

    // Ensure filename has an extension
    if (!filename.includes('.')) {
      filename += '.bin';
    }

    return filename;
  }

  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

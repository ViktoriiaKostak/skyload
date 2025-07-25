import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
export class FileDownloadStrategy {
  async downloadFile(url: string): Promise<{
    stream: Readable;
    filename: string;
    size: number;
  }> {
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'SkyLoad/1.0',
      },
      timeout: 30000,
    });

    const filename = this.extractFilenameFromUrl(url, response.headers);
    const size = parseInt(response.headers['content-length']) || 0;

    return {
      stream: response.data,
      filename,
      size,
    };
  }

  private extractFilenameFromUrl(
    url: string,
    headers: any,
  ): string {
    const contentDisposition = headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        return filenameMatch[1];
      }
    }

    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }

    return `file_${Date.now()}`;
  }
}

import { Readable } from 'stream';

export interface FileInfo {
  stream: Readable;
  filename: string;
  size: number;
}

export interface GoogleDriveUploadResult {
  id: string;
  link: string;
}

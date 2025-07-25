import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { UploadService } from './upload.service';
import { DriveService } from '../drive/drive.service';
import { SharedService, UploadStatus } from '../shared/shared.service';

@Injectable()
@Processor('file-processing')
export class UploadProcessor {
  constructor(
    private readonly uploadService: UploadService,
    private readonly driveService: DriveService,
    private readonly sharedService: SharedService,
  ) {}

  @Process('process-file')
  async processFile(
    job: Job<{ uploadId: string; url: string }>,
  ): Promise<void> {
    const { uploadId, url } = job.data;

    try {
      await this.uploadService.updateStatus(uploadId, UploadStatus.DOWNLOADING);

      const { stream, filename, size } =
        await this.sharedService.downloadFile(url);

      // Validate stream and filename
      if (!stream || stream.destroyed) {
        throw new Error('Invalid or destroyed stream received');
      }

      if (!filename || filename.trim() === '') {
        throw new Error('Invalid filename received');
      }

      console.log(`Processing file: ${filename}, size: ${size} bytes`);

      await this.uploadService.updateStatus(uploadId, UploadStatus.UPLOADING, {
        fileSize: size,
      });

      const mimeType = this.getMimeType(filename);
      console.log(`Determined MIME type: ${mimeType} for filename: ${filename}`);

      const { id: googleDriveId, link: googleDriveLink } =
        await this.driveService.uploadFile(stream, filename, mimeType);

      await this.uploadService.updateStatus(uploadId, UploadStatus.COMPLETED, {
        googleDriveId,
        googleDriveLink,
        fileSize: size,
      });
    } catch (error) {
      console.error(`Error processing file for upload ${uploadId}:`, error.message);
      await this.uploadService.updateStatus(uploadId, UploadStatus.FAILED, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Text files
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      ts: 'application/typescript',
      
      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      
      // Video
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm',
      
      // Other
      exe: 'application/x-msdownload',
      dmg: 'application/x-apple-diskimage',
      deb: 'application/vnd.debian.binary-package',
      rpm: 'application/x-rpm',
    };
    
    // If no extension or unknown extension, try to determine from filename
    if (!ext || !mimeTypes[ext]) {
      if (filename.includes('image') || filename.includes('photo') || filename.includes('img')) {
        return 'image/jpeg';
      }
      if (filename.includes('document') || filename.includes('doc')) {
        return 'application/pdf';
      }
      if (filename.includes('video') || filename.includes('movie')) {
        return 'video/mp4';
      }
      if (filename.includes('audio') || filename.includes('music')) {
        return 'audio/mpeg';
      }
      // Default fallback
      return 'application/octet-stream';
    }
    
    return mimeTypes[ext];
  }
}

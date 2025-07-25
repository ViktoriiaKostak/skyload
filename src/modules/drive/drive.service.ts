import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class DriveService {
  private drive;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadFile(
    stream: Readable,
    filename: string,
    mimeType: string,
  ): Promise<{ id: string; link: string }> {
    let tempFilePath: string | null = null;
    
    try {
      console.log(`Starting upload for file: ${filename}, MIME type: ${mimeType}`);

      if (!stream || stream.destroyed) {
        throw new Error('Stream is not available or has been destroyed');
      }

      const sanitizedFilename = this.sanitizeFilename(filename);
      
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      tempFilePath = path.join(os.tmpdir(), `skyload-${timestamp}-${randomSuffix}-${sanitizedFilename}`);
      console.log(`Creating temporary file: ${tempFilePath}`);
      
      await this.streamToFile(stream, tempFilePath);
      console.log(`File written to temporary location: ${tempFilePath}`);

      if (!fs.existsSync(tempFilePath)) {
        throw new Error('Temporary file was not created successfully');
      }

      const stats = fs.statSync(tempFilePath);
      if (stats.isDirectory()) {
        throw new Error('Temporary path is a directory, not a file');
      }

      if (stats.size === 0) {
        throw new Error('Temporary file is empty');
      }

      const fileMetadata = {
        name: sanitizedFilename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      console.log(`File metadata:`, fileMetadata);
      console.log(`Google Drive folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);

      const media = {
        mimeType,
        body: fs.createReadStream(tempFilePath),
      };

      console.log('Calling Google Drive API...');
      
      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,webViewLink',
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });

      console.log('Google Drive API response:', file.data);

      if (!file.data.id) {
        throw new Error('Failed to upload file to Google Drive');
      }

      const link = await this.createShareableLink(file.data.id);
      console.log(`Upload completed successfully. File ID: ${file.data.id}, Link: ${link}`);

      return {
        id: file.data.id,
        link,
      };
    } catch (error) {
      console.error('Google Drive upload error:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Service Accounts do not have storage quota')) {
        throw new Error('Google Drive storage quota exceeded. Please use Shared Drive or OAuth delegation.');
      }
      
      if (error.message.includes('insufficientFilePermissions')) {
        throw new Error('Insufficient permissions for Google Drive folder. Please check folder permissions.');
      }
      
      if (error.message.includes('notFound')) {
        throw new Error('Google Drive folder not found. Please check GOOGLE_DRIVE_FOLDER_ID.');
      }
      
      throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          const stats = fs.statSync(tempFilePath);
          if (!stats.isDirectory()) {
            fs.unlinkSync(tempFilePath);
            console.log(`Temporary file cleaned up: ${tempFilePath}`);
          }
        } catch (error) {
          console.error('Failed to delete temporary file:', error.message);
        }
      }
    }
  }

  private async streamToFile(stream: Readable, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          reject(new Error(`Path ${filePath} is a directory, not a file`));
          return;
        }
        fs.unlinkSync(filePath);
      }

      const writeStream = fs.createWriteStream(filePath);
      
      stream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log(`File written successfully: ${filePath}`);
        resolve();
      });
      
      writeStream.on('error', (error) => {
        console.error('Write stream error:', error.message);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Failed to delete partial file:', unlinkError.message);
          }
        }
        reject(error);
      });
      
      stream.on('error', (error) => {
        console.error('Read stream error:', error.message);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Failed to delete partial file:', unlinkError.message);
          }
        }
        reject(error);
      });
    });
  }

  private async createShareableLink(fileId: string): Promise<string> {
    try {
      console.log(`Creating shareable link for file ID: ${fileId}`);
      
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });

      const file = await this.drive.files.get({
        fileId,
        fields: 'webViewLink',
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });

      console.log(`Shareable link created: ${file.data.webViewLink}`);
      return file.data.webViewLink;
    } catch (error) {
      console.error('Failed to create shareable link:', error.message);
      const fallbackLink = `https://drive.google.com/file/d/${fileId}/view`;
      console.log(`Using fallback link: ${fallbackLink}`);
      return fallbackLink;
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255); 
  }
}

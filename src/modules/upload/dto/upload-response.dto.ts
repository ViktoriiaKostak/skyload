import { UploadStatus } from '../../shared/shared.service';

export class UploadResponseDto {
  id: string;
  originalUrl: string;
  filename: string;
  status: UploadStatus;
  googleDriveId?: string;
  googleDriveLink?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UploadListResponseDto {
  uploads: UploadResponseDto[];
  total: number;
  page: number;
  limit: number;
}

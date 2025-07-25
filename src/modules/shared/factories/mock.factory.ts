import { Upload } from '../../upload/entities/upload.entity';
import { CreateUploadDto } from '../../upload/dto/create-upload.dto';
import { UploadResponseDto } from '../../upload/dto/upload-response.dto';
import { UploadStatus } from '../shared.service';

export class MockFactory {
  static createMockUpload(data: Partial<Upload> = {}): Upload {
    const upload = new Upload();

    upload.id = data.id || 'mock-id-123';
    upload.originalUrl = data.originalUrl || 'https://example.com/test.pdf';
    upload.filename = data.filename || 'test.pdf';
    upload.status = data.status || UploadStatus.QUEUED;
    upload.googleDriveId = data.googleDriveId || null;
    upload.googleDriveLink = data.googleDriveLink || null;
    upload.fileSize = data.fileSize || null;
    upload.errorMessage = data.errorMessage || null;
    upload.createdAt = data.createdAt || new Date();
    upload.updatedAt = data.updatedAt || new Date();

    return upload;
  }

  static createMockCreateUploadDto(
    data: Partial<CreateUploadDto> = {},
  ): CreateUploadDto {
    const dto = new CreateUploadDto();
    dto.urls = data.urls || ['https://example.com/test.pdf'];
    return dto;
  }

  static createMockUploadResponseDto(
    data: Partial<UploadResponseDto> = {},
  ): UploadResponseDto {
    return {
      id: data.id || 'mock-id-123',
      originalUrl: data.originalUrl || 'https://example.com/test.pdf',
      filename: data.filename || 'test.pdf',
      status: data.status || UploadStatus.QUEUED,
      googleDriveId: data.googleDriveId || null,
      googleDriveLink: data.googleDriveLink || null,
      fileSize: data.fileSize || null,
      errorMessage: data.errorMessage || null,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
  }

  static createMockRepository() {
    return {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
  }

  static createMockQueue() {
    return {
      add: jest.fn(),
      process: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
    };
  }

  static createMockDriveService() {
    return {
      uploadFile: jest.fn(),
    };
  }

  static createMockSharedService() {
    return {
      downloadFile: jest.fn(),
      validateUrl: jest.fn(),
    };
  }
}

import { Repository } from 'typeorm';

export class TestUtils {
  static async clearDatabase(repository: Repository<any>): Promise<void> {
    await repository.clear();
  }

  static createMockUpload(data: Partial<any> = {}) {
    return {
      id: 'test-id',
      originalUrl: 'https://example.com/test.pdf',
      filename: 'test.pdf',
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
  }

  static createMockCreateUploadDto(data: Partial<any> = {}) {
    return {
      urls: ['https://example.com/test.pdf'],
      ...data,
    };
  }
}

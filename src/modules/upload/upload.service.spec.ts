import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { UploadService } from './upload.service';
import { Upload } from './entities/upload.entity';
import { SharedService } from '../shared/shared.service';
import { UploadStatus } from '../shared/shared.service';

describe('UploadService', () => {
  let service: UploadService;
  let repository: Repository<Upload>;
  let queue: Queue;
  let sharedService: SharedService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockSharedService = {
    validateUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(Upload),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('file-processing'),
          useValue: mockQueue,
        },
        {
          provide: SharedService,
          useValue: mockSharedService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    repository = module.get<Repository<Upload>>(getRepositoryToken(Upload));
    queue = module.get<Queue>(getQueueToken('file-processing'));
    sharedService = module.get<SharedService>(SharedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUploads', () => {
    it('should create uploads for valid URLs', async () => {
      const urls = ['https://example.com/file1.pdf'];
      const mockUpload = {
        id: '1',
        originalUrl: urls[0],
        filename: 'file1.pdf',
      };

      mockSharedService.validateUrl.mockReturnValue(true);
      mockRepository.create.mockReturnValue(mockUpload);
      mockRepository.save.mockResolvedValue(mockUpload);
      mockQueue.add.mockResolvedValue(undefined);

      const result = await service.createUploads({ urls });

      expect(result).toHaveLength(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        originalUrl: urls[0],
        filename: 'file1.pdf',
      });
      expect(mockQueue.add).toHaveBeenCalledWith('process-file', {
        uploadId: '1',
        url: urls[0],
      });
    });
  });
});

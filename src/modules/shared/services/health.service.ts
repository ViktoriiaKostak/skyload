import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from '../../upload/entities/upload.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await this.uploadRepository.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getSystemStatus() {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'up' : 'down',
      },
    };
  }
}

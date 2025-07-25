import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get databaseConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'skyload',
    };
  }

  get redisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    };
  }

  get googleDriveConfig() {
    return {
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    };
  }
}

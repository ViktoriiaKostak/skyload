import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { UploadModule } from './modules/upload/upload.module';
import { DriveModule } from './modules/drive/drive.module';
import { SharedModule } from './modules/shared/shared.module';
import { databaseConfig } from './modules/shared/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    UploadModule,
    DriveModule,
    SharedModule,
  ],
})
export class AppModule {}

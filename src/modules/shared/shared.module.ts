import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedService } from './shared.service';
import { LoggerService } from './services/logger.service';
import { ConfigService } from './services/config.service';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { AppController } from './controllers/app.controller';
import { Upload } from '../upload/entities/upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Upload])],
  controllers: [HealthController, AppController],
  providers: [SharedService, LoggerService, ConfigService, HealthService],
  exports: [SharedService, LoggerService, ConfigService, HealthService],
})
export class SharedModule {}

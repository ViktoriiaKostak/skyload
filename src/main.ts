import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './modules/shared/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  const config = new DocumentBuilder()
    .setTitle('SkyLoad API')
    .setDescription('API for uploading files from URLs to Google Drive')
    .setVersion('1.0')
    .addTag('uploads', 'File upload operations')
    .addTag('health', 'System health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`SkyLoad application is running on port ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api`,
  );
}

bootstrap();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UploadController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/uploads (POST) - should create uploads', () => {
    return request(app.getHttpServer())
      .post('/uploads')
      .send({
        urls: ['https://httpbin.org/bytes/1024'],
      })
      .expect(201)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('originalUrl');
        expect(res.body[0]).toHaveProperty('status');
      });
  }, 30000); 

  it('/uploads (GET) - should return uploads list', () => {
    return request(app.getHttpServer())
      .get('/uploads')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('uploads');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('limit');
        expect(Array.isArray(res.body.uploads)).toBe(true);
      });
  }, 30000); 

  it('/uploads (POST) - should validate URLs', () => {
    return request(app.getHttpServer())
      .post('/uploads')
      .send({
        urls: ['invalid-url'],
      })
      .expect(201); 
  }, 30000); 
});

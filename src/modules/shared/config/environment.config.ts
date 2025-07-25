export const environmentConfig = {
  development: {
    database: {
      synchronize: true,
      logging: true,
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    cors: {
      origin: true,
    },
  },
  production: {
    database: {
      synchronize: false,
      logging: false,
      ssl: { rejectUnauthorized: false },
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    },
  },
  test: {
    database: {
      synchronize: true,
      logging: false,
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    cors: {
      origin: true,
    },
  },
};

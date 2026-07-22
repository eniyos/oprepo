import { registerAs } from '@nestjs/config';

export const ApiConfig = registerAs('api', () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  ml: {
    serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    apiBase: 'https://api.github.com',
  },
}));

export type ApiConfigType = ReturnType<typeof ApiConfig>;

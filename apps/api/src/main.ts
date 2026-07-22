import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  // Initialize Sentry if DSN is configured
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    const Sentry = await import('@sentry/nestjs');
    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
    Sentry.init({
      dsn: sentryDsn,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || 'development',
    });
    Logger.log('Sentry initialized for API', 'Bootstrap');
  }

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`oprepo API running on http://localhost:${port}`);
}
bootstrap();

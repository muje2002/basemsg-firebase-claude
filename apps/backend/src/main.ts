import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Root health check (outside /api prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json({ status: 'ok', service: 'basemsg', api: '/api', version: '1.0.0' });
  });

  const port = process.env.BACKEND_PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`[basemsg] Backend running on http://0.0.0.0:${port}`);
}

bootstrap();

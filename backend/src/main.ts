import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(port, host);
  console.log(`Backend running on http://${host}:${port}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Loaded' : 'MISSING'}`);
}

bootstrap();

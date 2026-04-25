import * as dotenv from 'dotenv';
dotenv.config(); // Her şeyden önce yükle

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Backend running on http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`🔑 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
}
bootstrap();

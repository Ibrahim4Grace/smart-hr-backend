import 'module-alias/register';
import 'reflect-metadata';
import { Request, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NestFactory, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { initializeDataSource } from './database/data-source';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ResponseInterceptor } from '@shared/inteceptors/response.interceptor';
import { HttpExceptionFilter } from '@shared/helpers/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  const configService = app.get(ConfigService);
  app.enableCors(configService.get('cors'));

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const logger = app.get(Logger);

  const dataSource = app.get(DataSource);

  try {
    await initializeDataSource();
    console.log('Data Source has been initialized!');
  } catch (err) {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  }

  app.useLogger(logger);
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health', 'api', 'api/v1', 'api/docs', 'probe'],
  });
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
  app.useGlobalFilters(new HttpExceptionFilter());

  const options = new DocumentBuilder().setTitle('Spot Documentation').setVersion('1.0').addBearerAuth().build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document);

  app.use('api/docs-json', (req: Request, res: Response) => {
    res.json(document);
  });

  const port = app.get<ConfigService>(ConfigService).get<number>('PORT');
  await app.listen(port);

  logger.log({
    message: 'server started 🚀',
    port,
    url: `http://localhost:${port}/api/v1`,
  });
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
  process.exit(1);
});

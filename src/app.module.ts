import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { ClientModule } from '@modules/client/client.module';
import { TodoModule } from '@modules/todo/todo.module';
import { TicketModule } from '@modules/ticket/ticket.module';
import { ProjectModule } from '@modules/project/project.module';
import corsConfig from '@config/cors.config';
import { SalesModule } from '@modules/sales/sales.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import dataSource from '@database/data-source';
import authConfig from '@config/auth.config';
import { AuthGuard } from '@guards/auth.guard';
import HealthController from './health.controller';
import ProbeController from './probe.controller';
import { TransformInterceptor } from '@shared/inteceptors/transform.interceptor';
import serverConfig from '@config/server.config';
import { EmailQueueModule } from '@modules/email-queue/email-queue.module';
import { UserModule } from '@modules/user/user.module';
import { RoleModule } from '@modules/role/role.module';
import { JwtModule } from '@nestjs/jwt';
import { parse } from 'url';
import { CalendarModule } from '@modules/calendar/calendar.module';
import { NotesModule } from '@modules/notes/notes.module';
import { InvoiceModule } from '@modules/invoice/invoice.module';
import { EmailModule } from '@modules/email/email.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { ChatModule } from './modules/chat/chat.module';
import { EmployeesModule } from './modules/employee/employees.module';
import { AdminModule } from './modules/admin/admin.module';
import { SharedModule } from './shared/shared.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';


@Module({
  providers: [
    {
      provide: 'CONFIG',
      useClass: ConfigService,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', `.env.${process.env.PROFILE}`],
      load: [serverConfig, authConfig, corsConfig],
      isGlobal: true,
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsedUrl = parse(redisUrl);
          const [username, password] = parsedUrl.auth ? parsedUrl.auth.split(':') : [null, null];
          return {
            store: redisStore,
            host: parsedUrl.hostname,
            port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379,
            username: username || undefined,
            password: password || undefined,
            ttl: 60 * 60 * 24, // 24 hours default TTL
          };
        }
        // Fallback to individual variables for local dev
        return {
          store: redisStore,
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          username: configService.get<string>('REDIS_USERNAME'),
          password: configService.get<string>('REDIS_PASSWORD'),
          ttl: 60 * 60 * 24,
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = process.env.NODE_ENV !== 'production';

        return {
          pinoHttp: {
            transport: isDevelopment
              ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  ignore: 'pid,hostname',
                  messageFormat: '{context}: {msg}',
                },
              }
              : undefined,
            level: isDevelopment ? 'debug' : 'info',
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...dataSource.options,
      }),
      dataSourceFactory: async () => dataSource,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_AUTH_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_AUTH_EXPIRES_IN')
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"Smart-Hr" <${configService.get<string>('SMTP_USER')}>`,
        },
        template: {
          dir: process.cwd() + '/src/modules/email-queue/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsedUrl = parse(redisUrl);
          const [username, password] = parsedUrl.auth ? parsedUrl.auth.split(':') : [null, null];
          return {
            redis: {
              host: parsedUrl.hostname,
              port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379,
              username: username || undefined,
              password: password || undefined,
            },
          };
        }
        // Fallback to individual variables for local dev
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            username: configService.get<string>('REDIS_USERNAME'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    UserModule,
    EmailQueueModule,
    RoleModule,
    ClientModule,
    TodoModule,
    TicketModule,
    ProjectModule,
    SalesModule,
    CalendarModule,
    NotesModule,
    InvoiceModule,
    EmailModule,
    ChatModule,
    EmployeesModule,
    AdminModule,
    SharedModule,
    PricingModule,
    SubscriptionModule

  ],
  controllers: [HealthController, ProbeController],
})
export class AppModule { }

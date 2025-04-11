import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ClientModule } from '@modules/client/client.module';
import { TodoModule } from '@modules/todo/todo.module';
import { TicketModule } from '@modules/ticket/ticket.module';
import { ProjectModule } from '@modules/project/project.module';
import { SalesModule } from '@modules/sales/sales.module';
import { GatewayModule } from '@modules/gateway/gateway.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import dataSource from '@database/data-source';
import authConfig from '@config/auth.config';
import { AuthGuard } from '@guards/auth.guard';
import HealthController from './health.controller';
import ProbeController from './probe.controller';
import serverConfig from '@config/server.config';
import { OtpModule } from '@modules/otp/otp.module';
import { EmailModule } from '@modules/email/email.module';
import { UserModule } from '@modules/user/user.module';
import { RoleModule } from '@modules/role/role.module';
import { TokenModule } from '@modules/token/token.module';
import { JwtModule } from '@nestjs/jwt';
import { parse } from 'url';

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
        }),
    },
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', `.env.${process.env.PROFILE}`],
      load: [serverConfig, authConfig],
      isGlobal: true,
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
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
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
          dir: process.cwd() + '/src/modules/email/templates',
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
    TokenModule,
    UserModule,
    OtpModule,
    EmailModule,
    RoleModule,
    ClientModule,
    TodoModule,
    TicketModule,
    ProjectModule,
    SalesModule,
    GatewayModule,
  ],
  controllers: [HealthController, ProbeController],
})
export class AppModule {}

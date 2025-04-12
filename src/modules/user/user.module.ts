import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Role } from '@modules/role/entities/role.entity';
import { User } from './entities/user.entity';
import { PasswordService } from '../auth/password.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from '@modules/email/email.service';
import { EmailModule } from '@modules/email/email.module';

@Module({
  controllers: [UserController],
  providers: [UserService, Repository, PasswordService, EmailService],
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_AUTH_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_AUTH_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [UserService],
})
export class UserModule {}

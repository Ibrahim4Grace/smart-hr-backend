import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { PaginationService } from './services/pagination.service';
import { EntityPermissionsService } from './services/permissions.service';
import { CacheService } from './cache/cache.service'
import { CachePrefixesService } from './cache/cache.prefixes.service';
import { NotificationGateway } from './notification/notification.gateway';
import { NotificationService } from './notification/notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './otp/entities/otp.entity';
import { OtpService } from './otp/otp.service';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { Repository } from 'typeorm';
import { TokenService } from './token/token.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Otp, User, Employee]),
        JwtModule.register({}),
        ConfigModule
    ],
    providers: [
        OtpService,
        TokenService,
        Repository,
        CloudinaryService,
        PaginationService,
        EntityPermissionsService,
        CacheService,
        CachePrefixesService,
        NotificationGateway,
        NotificationService
    ],
    exports: [
        OtpService,
        TokenService,
        CloudinaryService,
        PaginationService,
        EntityPermissionsService,
        CacheService,
        CachePrefixesService,
        NotificationGateway,
        NotificationService
    ]
})
export class SharedModule { }


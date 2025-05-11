import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAccount } from './entities/email.entity';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount]),
    SharedModule
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }
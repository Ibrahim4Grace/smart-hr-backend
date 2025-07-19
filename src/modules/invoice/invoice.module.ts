import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceProcessor } from './invoice.processor';
import { Invoice } from './entities/invoice.entity';
import { User } from '../user/entities/user.entity';
import { Customer } from '../customer/entities/customer.entity';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Customer]),
    SharedModule,
    BullModule.registerQueue({
      name: 'invoice-processing',
    }),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceProcessor],
})
export class InvoiceModule { }

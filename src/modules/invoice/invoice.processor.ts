import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PdfService } from '../../shared/services/pdf.service';
import { EmailQueueService } from '../../shared/email-queue/email-queue.service';
import { InvoiceProcessingData } from './interface/invoice-filter.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceStatus } from './entities/invoice.entity';


@Processor('invoice-processing')
@Injectable()
export class InvoiceProcessor {
    private readonly logger = new Logger(InvoiceProcessor.name);

    constructor(
        private readonly pdfService: PdfService,
        private readonly emailQueueService: EmailQueueService,
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
    ) { }

    @Process('process-invoice')
    async processInvoice(job: Job<InvoiceProcessingData>) {
        const { invoiceData, customerEmail, customerName, companyName, invoiceId } = job.data;

        try {
            this.logger.log(`Processing invoice ${invoiceData.invoiceNumber} for customer ${customerName}`);

            // Update job progress
            await job.progress(10);

            // Generate PDF
            const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);

            // Update job progress
            await job.progress(60);

            // Send email with PDF attachment
            await this.emailQueueService.sendInvoiceCreatedNotification(
                customerEmail,
                customerName,
                invoiceData.invoiceNumber,
                invoiceData.invoiceTitle,
                invoiceData.totalAmount,
                invoiceData.dueDate,
                companyName,
                {
                    items: invoiceData.items,
                    fromName: invoiceData.fromName,
                    fromAddress: invoiceData.fromAddress,
                    fromEmail: invoiceData.fromEmail,
                    fromPhone: invoiceData.fromPhone,
                    toName: invoiceData.toName,
                    toAddress: invoiceData.toAddress,
                    toEmail: invoiceData.toEmail,
                    toPhone: invoiceData.toPhone,
                    createdDate: invoiceData.createdDate,
                    subTotal: invoiceData.subTotal,
                    totalDiscount: invoiceData.discountAmount,
                    discountPercentage: invoiceData.discountPercentage,
                    vatAmount: invoiceData.vatAmount,
                    vatPercentage: invoiceData.vatPercentage,
                    totalAmount: invoiceData.totalAmount,
                    amountInWords: invoiceData.amountInWords,
                    companyLogo: invoiceData.companyLogo,
                    signatureName: invoiceData.signatureName,
                    signatureTitle: invoiceData.signatureTitle
                },
                pdfBuffer
            );

            // Update job progress
            await job.progress(100);

            this.logger.log(`Successfully processed invoice ${invoiceData.invoiceNumber}`);

            return {
                success: true,
                invoiceNumber: invoiceData.invoiceNumber,
                invoiceId,
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error(`Failed to process invoice ${invoiceData.invoiceNumber}:`, error);
            throw error;
        }
    }

    // Handle failed jobs
    @Process('process-invoice-failed')
    async handleFailedInvoice(job: Job<InvoiceProcessingData>) {
        const { invoiceData, customerEmail, customerName, invoiceId } = job.data;

        this.logger.error(`Invoice processing failed for ${invoiceData.invoiceNumber} after all retries`);

        // Update invoice status
        await this.invoiceRepository.update(invoiceId, { status: InvoiceStatus.FAILED });

        // For now, just log the failure - you can implement admin notification later
        this.logger.error(`Invoice ${invoiceData.invoiceNumber} failed processing for customer ${customerName} (${customerEmail}). Invoice ID: ${invoiceId}`);
    }
} 
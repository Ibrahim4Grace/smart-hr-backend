import { InvoiceData } from '../../../shared/interfaces/pdf.interface';

export interface InvoiceFilterOptions {
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
    status?: string;
    createdDate?: string;
    dueDate?: string;
}

export interface InvoiceProcessingData {
    invoiceData: InvoiceData;
    customerEmail: string;
    customerName: string;
    companyName: string;
    invoiceId: string;
}

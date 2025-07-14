export interface InvoiceData {
    invoiceNumber: string;
    createdDate: string;
    dueDate: string;
    fromName: string;
    fromAddress: string;
    fromEmail: string;
    fromPhone: string;
    toName: string;
    toAddress: string;
    toEmail: string;
    toPhone: string;
    invoiceTitle: string;
    items: {
        description: string;
        quantity: number;
        rate: number;
        discount: number;
        total: number;
    }[];
    subTotal: number;
    discountAmount: number;
    discountPercentage: number;
    vatAmount: number;
    vatPercentage: number;
    totalAmount: number;
    amountInWords: string;
    companyLogo: string;
    signatureName: string;
    signatureTitle: string;
}
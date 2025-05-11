export interface EmailAttachment {
    originalname: string;
    size: number;
    mimetype: string;
    cloudinaryUrl?: string;
    buffer?: Buffer;
}
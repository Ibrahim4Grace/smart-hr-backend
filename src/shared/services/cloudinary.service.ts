import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private configService: ConfigService) {
        cloudinary.v2.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_NAME'),
            api_secret: this.configService.get<string>('CLOUDINARY_SECRET_NAME'),
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'profile-pictures'): Promise<string> {
        try {
            if (!file.buffer) throw new BadRequestException(`File buffer is missing for ${file.originalname}`);

            // Convert buffer to base64
            const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            // Upload directly to Cloudinary
            const result = await cloudinary.v2.uploader.upload(base64String, {
                folder,
                resource_type: 'auto',
            });

            return result.secure_url;
        } catch (error) {
            throw new BadRequestException(`Failed to upload file ${file.originalname}: ${error.message}`);
        }
    }

    async uploadMultipleFiles(files: Express.Multer.File[], folder: string = 'borrower-documents'): Promise<string[]> {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file, folder));
            return await Promise.all(uploadPromises);
        } catch (error) {
            throw new BadRequestException(`Failed to upload files: ${error.message}`);
        }
    }

    async deleteFile(publicId: string): Promise<void> {
        try {
            await cloudinary.v2.uploader.destroy(publicId);
        } catch (error) {
            throw new BadRequestException(`Failed to delete file: ${error.message}`);
        }
    }

    async deleteMultipleFiles(publicIds: string[]): Promise<void> {
        try {
            const deletePromises = publicIds.map(publicId => this.deleteFile(publicId));
            await Promise.all(deletePromises);
        } catch (error) {
            throw new BadRequestException(`Failed to delete files: ${error.message}`);
        }
    }

    getPublicIdFromUrl(url: string): string {
        try {
            const parts = url.split('/');
            const uploadIndex = parts.findIndex(part => part === 'upload') + 2;
            const path = parts.slice(uploadIndex).join('/');
            const publicId = path.split('.')[0];
            return publicId;
        } catch (error) {
            this.logger.error(`Failed to extract public_id from URL: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to extract public_id: ${error.message}`);
        }
    }
}
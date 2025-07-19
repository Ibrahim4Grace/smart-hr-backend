import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

export interface SequentialIdConfig {
    prefix: string;
    paddingLength: number;
    fieldName: string;
}

@Injectable()
export class SequentialIdService {
    /**
     * Generates a sequential ID with the specified prefix and padding
     * @param repository - The TypeORM repository to query
     * @param config - Configuration for the ID generation
     * @returns Promise<string> - The generated sequential ID
     */
    async generateSequentialId<T>(
        repository: Repository<T>,
        config: SequentialIdConfig
    ): Promise<string> {
        const { prefix, paddingLength, fieldName } = config;

        // Find the latest record with the highest number
        const latestRecord = await repository
            .createQueryBuilder('entity')
            .orderBy(`CAST(SUBSTRING(entity.${fieldName}, ${prefix.length + 1}) AS INTEGER)`, 'DESC')
            .getOne();

        let nextNumber = 1;

        if (latestRecord && latestRecord[fieldName]) {
            const currentId = latestRecord[fieldName];
            const match = currentId.match(new RegExp(`${prefix.replace('-', '\\-')}(\\d+)`));
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        return `${prefix}${nextNumber.toString().padStart(paddingLength, '0')}`;
    }

    /**
     * Generates an employee ID (EMP-0001, EMP-0002, etc.)
     */
    async generateEmployeeId<T>(repository: Repository<T>, fieldName: string = 'employee_id'): Promise<string> {
        return this.generateSequentialId(repository, {
            prefix: 'EMP-',
            paddingLength: 4,
            fieldName
        });
    }

    /**
     * Generates an invoice number (INV-0001, INV-0002, etc.)
     */
    async generateInvoiceId<T>(repository: Repository<T>, fieldName: string = 'invoice_number'): Promise<string> {
        return this.generateSequentialId(repository, {
            prefix: 'INV-',
            paddingLength: 4,
            fieldName
        });
    }

    /**
     * Generates a customer ID (CUST-0001, CUST-0002, etc.)
     */
    async generateCustomerId<T>(repository: Repository<T>, fieldName: string = 'customer_id'): Promise<string> {
        return this.generateSequentialId(repository, {
            prefix: 'CUST-',
            paddingLength: 4,
            fieldName
        });
    }

    /**
     * Generates a project ID (PROJ-0001, PROJ-0002, etc.)
     */
    async generateProjectId<T>(repository: Repository<T>, fieldName: string = 'project_id'): Promise<string> {
        return this.generateSequentialId(repository, {
            prefix: 'PROJ-',
            paddingLength: 4,
            fieldName
        });
    }
} 
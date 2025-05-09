import { Injectable } from '@nestjs/common';

/**
 * Service for centralized cache key prefixes
 * This prevents prefix duplication and provides better organization
 */

@Injectable()
export class CachePrefixesService {
    // User-related cache prefixes
    readonly USER = 'user';
    readonly USER_BY_EMAIL = 'user:email';


    // Email-related cache prefixes
    readonly EMAIL = 'email';
    readonly EMAIL_TEMPLATE = 'email:template';

    // Client-related cache prefixes
    readonly CLIENT = 'client';
    readonly CLIENT_LIST = 'client:list';

    // Project-related cache prefixes
    readonly PROJECT = 'project';
    readonly PROJECT_LIST = 'project:list';

    // Todo-related cache prefixes
    readonly TODO = 'todo';
    readonly TODO_LIST = 'todo:list';

    // Ticket-related cache prefixes
    readonly TICKET = 'ticket';
    readonly TICKET_LIST = 'ticket:list';

    // Sales-related cache prefixes
    readonly SALES = 'sales';
    readonly SALES_REPORT = 'sales:report';

    // Invoice-related cache prefixes
    readonly INVOICE = 'invoice';
    readonly INVOICE_LIST = 'invoice:list';

    // Other application-specific prefixes can be added here

    /**
     * Gets a namespaced cache key by combining a prefix with an identifier
     * @param prefix The cache prefix (use class properties for consistency)
     * @param identifier The unique identifier
     * @returns Formatted cache key
     */
    getKey(prefix: string, identifier: string | number): string {
        return `${prefix}:${identifier}`;
    }
}
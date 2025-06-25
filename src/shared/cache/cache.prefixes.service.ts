import { Injectable } from '@nestjs/common';

/**
 * Service for centralized cache key prefixes
 * This prevents prefix duplication and provides better organization
 */

@Injectable()
export class CachePrefixesService {

    readonly USER = 'user';
    readonly USER_BY_EMAIL = 'user:email';
    readonly USER_BY_ID = 'user:id';

    readonly EMPLOYEE = 'employee';
    readonly EMPLOYEE_LIST = 'employee:list';
    readonly EMPLOYEE_BY_ID = 'employee:id';

    readonly EMAIL = 'email';
    readonly EMAIL_TEMPLATE = 'email:template';

    readonly CLIENT = 'client';
    readonly CLIENT_LIST = 'client:list';

    readonly PROJECT = 'project';
    readonly PROJECT_LIST = 'project:list';

    readonly TODO = 'todo';
    readonly TODO_LIST = 'todo:list';

    readonly TICKET = 'ticket';
    readonly TICKET_LIST = 'ticket:list';

    readonly SALES = 'sales';
    readonly SALES_REPORT = 'sales:report';

    readonly INVOICE = 'invoice';
    readonly INVOICE_LIST = 'invoice:list';

    readonly PRICING = 'pricing';
    readonly PRICING_LIST = 'pricing:list';

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
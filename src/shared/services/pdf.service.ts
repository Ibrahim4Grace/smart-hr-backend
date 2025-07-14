import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InvoiceData } from '../interfaces/pdf.interface';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PdfService.name);
    private browser: puppeteer.Browser | null = null;
    private templateCache = new Map<string, HandlebarsTemplateDelegate>();
    private pagePool: puppeteer.Page[] = [];
    private readonly maxPoolSize = 5;
    private readonly minPoolSize = 2;

    async onModuleInit() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-default-apps',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-sync',
                    '--disable-translate',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            });

            // Pre-warm the page pool
            await this.initializePagePool();

            this.logger.log('Puppeteer browser and page pool initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Puppeteer browser:', error);
        }
    }

    async onModuleDestroy() {
        // Close all pages in the pool
        for (const page of this.pagePool) {
            try {
                await page.close();
            } catch (error) {
                this.logger.error('Error closing page:', error);
            }
        }

        if (this.browser) {
            await this.browser.close();
            this.logger.log('Puppeteer browser closed');
        }
    }

    private async initializePagePool(): Promise<void> {
        if (!this.browser) return;

        for (let i = 0; i < this.minPoolSize; i++) {
            try {
                const page = await this.browser.newPage();

                // Pre-configure page for better performance
                await page.setViewport({ width: 1200, height: 800 });
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

                // Disable media and other resources to speed up loading
                await page.setRequestInterception(true);
                page.on('request', (request) => {
                    const resourceType = request.resourceType();
                    if (resourceType === 'media' || resourceType === 'font') {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });

                this.pagePool.push(page);
            } catch (error) {
                this.logger.error('Error creating page for pool:', error);
            }
        }
    }

    private async getPageFromPool(): Promise<puppeteer.Page> {
        if (this.pagePool.length > 0) {
            return this.pagePool.pop()!;
        }

        // If pool is empty, create a new page
        if (!this.browser) throw new Error('Puppeteer browser not initialized');

        const page = await this.browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (resourceType === 'media' || resourceType === 'font') {
                request.abort();
            } else {
                request.continue();
            }
        });

        return page;
    }

    private async returnPageToPool(page: puppeteer.Page): Promise<void> {
        if (this.pagePool.length < this.maxPoolSize) {
            // Clear the page content before returning to pool
            try {
                await page.evaluate(() => {
                    document.head.innerHTML = '';
                    document.body.innerHTML = '';
                });
                this.pagePool.push(page);
            } catch (error) {
                this.logger.error('Error clearing page content:', error);
                await page.close();
            }
        } else {
            // Pool is full, close the page
            await page.close();
        }
    }

    private getInvoiceTemplate(): HandlebarsTemplateDelegate {
        const templatePath = path.join(process.cwd(), 'src/shared/email-queue/templates/invoice-pdf.hbs');

        // Check if template is already cached
        if (this.templateCache.has(templatePath)) {
            return this.templateCache.get(templatePath)!;
        }

        try {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            const compiledTemplate = handlebars.compile(templateContent);

            // Cache the compiled template
            this.templateCache.set(templatePath, compiledTemplate);

            return compiledTemplate;
        } catch (error) {
            this.logger.error('Could not read invoice template file:', error);
            throw new Error('Invoice template file not found.');
        }
    }

    async generateInvoicePdf(invoiceData: InvoiceData): Promise<Buffer> {
        if (!this.browser) throw new Error('Puppeteer browser not initialized');

        let page: puppeteer.Page | null = null;

        try {
            // Get compiled template from cache
            const template = this.getInvoiceTemplate();
            const html = template(invoiceData);

            // Get page from pool
            page = await this.getPageFromPool();

            // Set content with optimized options with 10 second timeout
            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Wait for CSS to load 
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate PDF with optimized settings with 30 second timeout
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                },
                timeout: 30000
            });

            return Buffer.from(pdfBuffer);
        } catch (error) {
            this.logger.error('Error generating PDF:', error);
            throw new Error(`Failed to generate PDF: ${error.message}`);
        } finally {
            // Return page to pool
            if (page) {
                await this.returnPageToPool(page);
            }
        }
    }
}
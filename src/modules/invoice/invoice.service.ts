import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Customer } from '../customer/entities/customer.entity';
import { CacheService } from '../../shared/cache/cache.service';
import { CachePrefixesService } from '../../shared/cache/cache.prefixes.service';
import { BaseCacheableService } from '../../shared/services/base-cacheable.service';
import { PaginationService } from '../../shared/services/pagination.service';
import { PaginationOptions } from '../../shared/interfaces/pagination.interface';
import { EntityPermissionsService } from '../../shared/services/permissions.service';
import { InvoiceFilterOptions } from './interface/invoice-filter.interface';
import { InvoiceData } from '../../shared/interfaces/pdf.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InvoiceStatus } from './entities/invoice.entity';

@Injectable()
export class InvoiceService extends BaseCacheableService {
  private readonly numberToWordsCache = new Map<number, string>();

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly permissionsService: EntityPermissionsService,
    private readonly paginationService: PaginationService,
    @InjectQueue('invoice-processing') private readonly invoiceQueue: Queue,
    cacheService: CacheService,
    cachePrefixes: CachePrefixesService,
  ) { super(cacheService, cachePrefixes); }

  // Extract the numeric part and increment and Pad with zeros to 4 digits
  private async generateInvoiceNumber(): Promise<string> {
    const latestInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .orderBy('CAST(SUBSTRING(invoice.invoice_number, 5) AS INTEGER)', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (latestInvoice && latestInvoice.invoice_number) {
      const match = latestInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    return `INV-${nextNumber.toString().padStart(4, '0')}`;
  }

  //  format address
  private formatAddress(user: any): string {
    const addressParts = [user.address, user.city, user.state, user.country].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(' ') : 'Address not provided';
  }

  // number to words conversion with memoization
  private numberToWords(num: number): string {
    if (this.numberToWordsCache.has(num)) {
      return this.numberToWordsCache.get(num)!;
    }

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };

    if (num === 0) return 'Zero Dollars';

    // Split the number into dollars and cents
    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);

    let result = '';

    if (dollars > 0) {
      const billion = Math.floor(dollars / 1000000000);
      const million = Math.floor((dollars % 1000000000) / 1000000);
      const thousand = Math.floor((dollars % 1000000) / 1000);
      const remainder = dollars % 1000;

      if (billion) result += convertLessThanOneThousand(billion) + ' Billion ';
      if (million) result += convertLessThanOneThousand(million) + ' Million ';
      if (thousand) result += convertLessThanOneThousand(thousand) + ' Thousand ';
      if (remainder) result += convertLessThanOneThousand(remainder);

      result = result.trim();
      result += dollars === 1 ? ' Dollar' : ' Dollars';
    }

    if (cents > 0) {
      if (dollars > 0) result += ' and ';
      result += convertLessThanOneThousand(cents);
      result += cents === 1 ? ' Cent' : ' Cents';
    }

    // If no dollars, just show cents
    if (dollars === 0 && cents > 0) {
      result = convertLessThanOneThousand(cents) + (cents === 1 ? ' Cent' : ' Cents');
    }

    // If exactly whole dollars with no cents
    if (cents === 0 && dollars > 0) {
      // result already has "Dollars" appended above
    }

    const finalResult = result.trim();
    this.numberToWordsCache.set(num, finalResult);
    return finalResult;
  }

  async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
    const [user, customer] = await Promise.all([
      this.permissionsService.getUserById(userId),
      this.customerRepository.findOne({
        where: { id: createInvoiceDto.customer_id, user: { id: userId } },
        relations: ['user']
      })
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    const invoice_number = await this.generateInvoiceNumber();

    // Calculate invoice totals BEFORE creating the invoice entity
    const items = createInvoiceDto.items || [];
    const calculations = items.reduce((acc, item) => {
      const itemTotal = Number(item.rate) * Number(item.quantity);
      const itemDiscount = Number(item.discount) || 0;

      acc.subTotal += itemTotal;
      acc.totalDiscount += itemDiscount;
      acc.processedItems.push({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        discount: itemDiscount,
        total: itemTotal - itemDiscount
      });

      return acc;
    }, { subTotal: 0, totalDiscount: 0, processedItems: [] });

    const { subTotal, totalDiscount, processedItems } = calculations;
    const discountPercentage = subTotal > 0 ? Math.round((totalDiscount / subTotal) * 100) : 0;

    const tempInvoice = this.invoiceRepository.create({
      user,
      customer,
    });
    const vatPercentage = tempInvoice.vat_percentage || 0.05;
    const vatAmount = Math.round((subTotal - totalDiscount) * (vatPercentage / 100) * 100) / 100;
    const totalAmount = subTotal - totalDiscount + vatAmount;
    const amountInWords = this.numberToWords(totalAmount);

    // Now create the invoice entity with all calculated fields
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoice_number,
      user,
      customer,
      items: createInvoiceDto.items || [],
      sub_total: subTotal,
      total_discount: totalDiscount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      amount_in_words: amountInWords,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Prepare invoice data for background processing
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice_number,
      createdDate: createInvoiceDto.invoice_date.toLocaleDateString(),
      dueDate: createInvoiceDto.due_date.toLocaleDateString(),
      fromName: user.name,
      fromAddress: this.formatAddress(user),
      fromEmail: user.email,
      fromPhone: user.phone || 'Phone not provided',
      toName: customer.full_name,
      toAddress: customer.address,
      toEmail: customer.email,
      toPhone: customer.phone,
      invoiceTitle: createInvoiceDto.invoice_title,
      items: processedItems,
      subTotal,
      discountAmount: totalDiscount,
      discountPercentage,
      vatAmount,
      vatPercentage,
      totalAmount,
      amountInWords: this.numberToWords(totalAmount),
      companyLogo: 'https://smart-hr-assets.pages.dev/bg/logo.svg',
      signatureName: user.name,
    };

    // Queue PDF generation and email sending for background processing
    await this.invoiceQueue.add('process-invoice', {
      invoiceData,
      customerEmail: customer.email,
      customerName: customer.full_name,
      companyName: customer.company || user.company || 'Our Company',
      invoiceId: savedInvoice.id
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    // Invalidate cache asynchronously
    this.invalidateOnCreate(userId, this.cachePrefixes.INVOICE).catch(err => {
      console.error('Cache invalidation failed:', err);
    });

    return {
      message: 'Invoice created successfully. PDF will be generated and sent shortly.',
      invoiceNumber: invoice_number,
      totalAmount,
      invoiceId: savedInvoice.id
    };
  }

  async findAll(paginationOptions: PaginationOptions<Invoice>, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const cacheKey = this.generatePaginationCacheKey(userId, paginationOptions);

    const paginated = await this.cacheResult(
      this.cachePrefixes.INVOICE_LIST,
      cacheKey,
      async () => this.paginationService.paginate(
        this.invoiceRepository,
        { user: { id: user.id } },
        { ...paginationOptions, relations: ['customer'] }
      ),
      this.cacheService.CACHE_TTL.MEDIUM
    );
    return {
      ...paginated,

    };
  }

  async findAllWithFilters(options: InvoiceFilterOptions, userId: string) {
    try {
      const user = await this.permissionsService.getUserById(userId);

      // Main query for paginated data
      const qb = this.invoiceRepository.createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .where('invoice.user_id = :userId', { userId: user.id });

      if (options.status) {
        qb.andWhere('invoice.status = :status', { status: options.status });
      }
      if (options.createdDate) {
        qb.andWhere('DATE(invoice.created_at) = :createdDate', { createdDate: options.createdDate });
      }
      if (options.dueDate) {
        qb.andWhere('DATE(invoice.due_date) = :dueDate', { dueDate: options.dueDate });
      }
      if (options.minAmount !== undefined && !isNaN(options.minAmount)) {
        qb.andWhere('invoice.total_amount >= :minAmount', { minAmount: options.minAmount });
      }
      if (options.maxAmount !== undefined && !isNaN(options.maxAmount)) {
        qb.andWhere('invoice.total_amount <= :maxAmount', { maxAmount: options.maxAmount });
      }

      qb.orderBy(`invoice.${options.sort}`, options.order.toUpperCase() as 'ASC' | 'DESC');
      qb.skip((options.page - 1) * options.limit).take(options.limit);

      const [dataResult, dashboardStats] = await Promise.all([
        qb.getManyAndCount(),
        (() => {
          const dashboardQb = this.invoiceRepository
            .createQueryBuilder('invoice')
            .select('invoice.status', 'status')
            .addSelect('COUNT(invoice.id)', 'count')
            .addSelect('COALESCE(SUM(invoice.total_amount), 0)', 'total_amount')
            .where('invoice.user_id = :userId', { userId: user.id })
            .andWhere('invoice.status != :failedStatus', { failedStatus: InvoiceStatus.FAILED });

          if (options.minAmount !== undefined && !isNaN(options.minAmount)) {
            dashboardQb.andWhere('invoice.total_amount >= :minAmount', { minAmount: options.minAmount });
          }
          if (options.maxAmount !== undefined && !isNaN(options.maxAmount)) {
            dashboardQb.andWhere('invoice.total_amount <= :maxAmount', { maxAmount: options.maxAmount });
          }

          return dashboardQb.groupBy('invoice.status').getRawMany();
        })()
      ]);

      const [data, total] = dataResult;

      // Calculate dashboard metrics with proper null checks
      const dashboard = {
        totalInvoice: 0,
        cancelled: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        unpaidInvoices: 0,
        revenue: 0
      };

      for (const stat of dashboardStats) {
        // Add null checks
        if (!stat || !stat.status) continue;

        const count = parseInt(stat.count) || 0;
        const amount = parseFloat(stat.total_amount) || 0;

        // Direct comparison with enum values 
        const status = stat.status;
        switch (status) {
          case 'cancelled':
          case InvoiceStatus.CANCELLED:
            dashboard.cancelled = count;
            break;
          case 'paid':
          case InvoiceStatus.PAID:
            dashboard.paidInvoices = count;
            dashboard.revenue += amount;
            break;
          case 'overdue':
          case InvoiceStatus.OVERDUE:
            dashboard.overdueInvoices = count;
            break;
          case 'pending':
          case InvoiceStatus.PENDING:
            dashboard.unpaidInvoices = count;
            break;
          default:
            console.warn('Unknown invoice status:', status);
        }

        dashboard.totalInvoice += count;
      }
      // totals calculation - reuse dashboard stats
      const totals: Record<string, string> = {};
      let overallTotal = 0;

      for (const stat of dashboardStats) {
        if (!stat || !stat.status) continue;

        const amount = parseFloat(stat.total_amount) || 0;
        totals[stat.status] = amount.toFixed(2);
        overallTotal += amount;
      }
      totals['totalInvoices'] = overallTotal.toFixed(2);

      return {
        data,
        meta: {
          total,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(total / options.limit),
        },
        totals,
        dashboard,
      };

    } catch (error) {
      console.error('Error in findAllWithFilters:', error);
    }
  }

  async findOne(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const invoice = await this.cacheResult(
      this.cachePrefixes.INVOICE_BY_ID,
      id,
      async () => this.permissionsService.getEntityWithPermissionCheck(Invoice, id, user, ['user', 'customer']),
      this.cacheService.CACHE_TTL.LONG
    );
    if (invoice && invoice.user) {
      delete invoice.user;
    }
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const invoice = await this.permissionsService.getEntityWithPermissionCheck(Invoice, id, user, ['user']);
    Object.assign(invoice, updateInvoiceDto);

    // Recalculate invoice totals if items or relevant fields are updated
    const items = invoice.items || [];
    const calculations = items.reduce((acc, item) => {
      const itemTotal = item.rate * item.quantity;
      const itemDiscount = item.discount || 0;
      acc.subTotal += itemTotal;
      acc.totalDiscount += itemDiscount;
      return acc;
    }, { subTotal: 0, totalDiscount: 0 });
    const { subTotal, totalDiscount } = calculations;
    const discountPercentage = subTotal > 0 ? Math.round((totalDiscount / subTotal) * 100) : 0;
    const vatPercentage = invoice.vat_percentage;
    const vatAmount = Math.round((subTotal - totalDiscount) * (vatPercentage / 100) * 100) / 100;
    const totalAmount = subTotal - totalDiscount + vatAmount;
    invoice.sub_total = subTotal;
    invoice.total_discount = totalDiscount;
    invoice.vat_amount = vatAmount;
    invoice.total_amount = totalAmount;
    invoice.amount_in_words = this.numberToWords(totalAmount);

    await this.invoiceRepository.save(invoice);
    await this.invalidateOnUpdate(id, userId, this.cachePrefixes.INVOICE);
    return { message: 'Invoice updated successfully' };
  }

  async remove(id: string, userId: string) {
    const user = await this.permissionsService.getUserById(userId);
    const invoice = await this.permissionsService.getEntityWithPermissionCheck(Invoice, id, user, ['user']);
    await this.invoiceRepository.remove(invoice);
    await this.invalidateOnDelete(id, userId, this.cachePrefixes.INVOICE);
    return { message: 'Invoice deleted successfully' };
  }
}

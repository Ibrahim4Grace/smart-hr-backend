import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.baseUrl = this.configService.get<string>('PAYSTACK_BASE_URL');
    this.secretKey = this.apiKey;
  }


  private async handleChargeSuccess(data: any) {
    this.logger.log('Charge successful:', data.reference);
    return {
      status: 'success',
      type: 'charge.success',
      reference: data.reference,
      amount: data.amount,
      customer: data.customer
    };
  }

  private async handleTransferSuccess(data: any) {
    this.logger.log('Transfer successful:', data.reference);
    return {
      status: 'success',
      type: 'transfer.success',
      reference: data.reference,
      amount: data.amount
    };
  }

  private async handleTransferFailed(data: any) {
    this.logger.log('Transfer failed:', data.reference);
    return {
      status: 'failed',
      type: 'transfer.failed',
      reference: data.reference,
      reason: data.failure_reason
    };
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }


  async initializeTransaction(data: {
    amount: number;
    email: string;
    currency?: string;
    callback_url?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: data.amount * 100,
          email: data.email,
          currency: data.currency || 'NGN',
          callback_url: data.callback_url,
        },
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to initialize transaction',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to verify transaction',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      return false;
    }
  }

  // Only process charge.success and transfer events for one-time payments
  async processWebhookEvent(event: any) {
    try {
      switch (event.event) {
        case 'charge.success':
          return await this.handleChargeSuccess(event.data);
        case 'transfer.success':
          return await this.handleTransferSuccess(event.data);
        case 'transfer.failed':
          return await this.handleTransferFailed(event.data);
        default:
          this.logger.log(`Unhandled webhook event: ${event.event}`);
          return { status: 'ignored', event: event.event };
      }
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw new HttpException(
        'Failed to process webhook event',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}

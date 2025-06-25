import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateGatewayDto } from './dto/create-gateway.dto';
import { UpdateGatewayDto } from './dto/update-gateway.dto';

@Injectable()
export class GatewayService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.baseUrl = 'https://api.paystack.co';
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
          amount: data.amount * 100, // Convert to kobo/cents
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

  async createCustomer(data: { email: string; name?: string }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer`,
        data,
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create customer',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createSubscription(data: {
    customer: string;
    plan: string;
    authorization: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscription`,
        data,
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create subscription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async disableSubscription(subscriptionCode: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscription/disable`,
        { code: subscriptionCode },
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to disable subscription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

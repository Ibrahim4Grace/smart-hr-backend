import { HttpStatus, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { User } from '@modules/user/entities/user.entity';
import * as otpGenerator from 'otp-generator';
import * as bcrypt from 'bcryptjs';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

export const generateOTP = async () => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const hashedOTP = await bcrypt.hash(otp, 10);
  return { otp, hashedOTP };
};

interface CreateOtpResult {
  otpEntity: Otp;
  plainOtp: string;
}

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, manager?: EntityManager): Promise<CreateOtpResult | null> {
    try {
      const repo = manager ? manager.getRepository(User) : this.userRepository;
      const otpRepo = manager ? manager.getRepository(Otp) : this.otpRepository;
      const user = await repo.findOne({ where: { id: userId } });

      if (!user) throw new NotFoundException(SYS_MSG.USER_NOT_FOUND);

      const { otp, hashedOTP } = await generateOTP();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      const otpEntity = otpRepo.create({ otp: hashedOTP, expiry, user, user_id: userId });
      await otpRepo.save(otpEntity);

      return { otpEntity, plainOtp: otp };
    } catch (error) {
      return null;
    }
  }

  async verify(userId: string, otp: string): Promise<boolean> {
    try {
      const otpRecord = await this.otpRepository.findOne({ where: { user_id: userId } });

      if (!otpRecord) throw new NotFoundException(SYS_MSG.INVALID_OTP);

      if (otpRecord.expiry < new Date()) {
        throw new NotAcceptableException(SYS_MSG.EXPIRED_OTP);
      }

      const isMatch = await bcrypt.compare(otp, otpRecord.otp);
      if (!isMatch) {
        throw new NotFoundException(SYS_MSG.INVALID_OTP);
      }

      otpRecord.verified = true;
      await this.otpRepository.save(otpRecord);

      return true;
    } catch (error) {
      return false;
    }
  }

  async isOtpVerified(userId: string): Promise<boolean> {
    try {
      const otpRecord = await this.otpRepository.findOne({ where: { user_id: userId } });

      if (!otpRecord) return false;
      if (otpRecord.expiry < new Date()) return false;

      return otpRecord.verified;
    } catch (error) {
      return false;
    }
  }

  async find(userId: string): Promise<Otp | null> {
    const otp = await this.otpRepository.findOne({ where: { user_id: userId } });
    if (!otp) throw new NotFoundException(SYS_MSG.INVALID_OTP);
    return otp;
  }

  async retrieveUserAndOtp(user_id: string, otp: string): Promise<User | null> {
    const userOtp = await this.otpRepository.findOne({ where: { otp, user_id }, relations: ['user'] });
    if (!userOtp) throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.BAD_REQUEST);

    return userOtp.user;
  }

  async remove(userId: string) {
    return await this.otpRepository.delete({ user_id: userId });
  }
}

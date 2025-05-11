import { HttpStatus, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan, MoreThan } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import * as otpGenerator from 'otp-generator';
import * as bcrypt from 'bcryptjs';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';


const OTP_EXPIRY_MINUTES = 15;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

export const generateOTP = async () => {
  const otp = otpGenerator.generate(OTP_LENGTH, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const hashedOTP = await bcrypt.hash(otp, BCRYPT_ROUNDS);
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
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) { }

  async create(userId: string, manager?: EntityManager, isEmployee: boolean = false): Promise<CreateOtpResult | null> {
    try {
      const otpRepo = manager ? manager.getRepository(Otp) : this.otpRepository;

      const { otp, hashedOTP } = await generateOTP();
      const expiry = new Date(Date.now() + OTP_EXPIRY_MS);

      // Only check if entity exists, don't load the full entity
      if (isEmployee) {
        const employeeExists = await this.employeeRepository.exists({ where: { id: userId } });
        if (!employeeExists) throw new NotFoundException(SYS_MSG.USER_NOT_FOUND);

        // Delete any existing OTPs for this employee to prevent accumulation
        await otpRepo.delete({ employee_id: userId });

        const otpEntity = otpRepo.create({
          otp: hashedOTP,
          expiry,
          employee_id: userId
        });
        await otpRepo.save(otpEntity);

        return { otpEntity, plainOtp: otp };
      } else {
        const userExists = await this.userRepository.exists({ where: { id: userId } });
        if (!userExists) throw new NotFoundException(SYS_MSG.USER_NOT_FOUND);

        // Delete any existing OTPs for this user to prevent accumulation
        await otpRepo.delete({ user_id: userId });

        const otpEntity = otpRepo.create({
          otp: hashedOTP,
          expiry,
          user_id: userId
        });
        await otpRepo.save(otpEntity);

        return { otpEntity, plainOtp: otp };
      }
    } catch (error) {
      return null;
    }
  }

  async verify(userId: string, otp: string, isEmployee: boolean = false): Promise<boolean> {
    const whereClause = isEmployee ? { employee_id: userId } : { user_id: userId };
    const otpRecord = await this.otpRepository.findOne({
      where: whereClause,
      select: ['otp', 'expiry', 'id', 'verified']
    });

    if (!otpRecord) throw new NotFoundException(SYS_MSG.INVALID_OTP);

    if (otpRecord.expiry < new Date()) {
      await this.otpRepository.remove(otpRecord);
      throw new NotAcceptableException(SYS_MSG.EXPIRED_OTP);
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) throw new NotFoundException(SYS_MSG.INVALID_OTP);

    otpRecord.verified = true;
    await this.otpRepository.save(otpRecord);

    return true;
  }

  async isOtpVerified(userId: string, isEmployee: boolean = false): Promise<boolean> {
    const whereClause = isEmployee
      ? { employee_id: userId }
      : { user_id: userId };

    // Use a more efficient query that only returns what we need
    const otpRecord = await this.otpRepository.findOne({
      where: {
        ...whereClause,
        expiry: MoreThan(new Date()) // Only get non-expired OTPs
      },
      select: ['verified']
    });

    return !!otpRecord && otpRecord.verified;
  }

  async find(userId: string, isEmployee: boolean = false): Promise<Otp | null> {
    const whereClause = isEmployee ? { employee_id: userId } : { user_id: userId };
    const otp = await this.otpRepository.findOne({ where: whereClause });
    if (!otp) throw new NotFoundException(SYS_MSG.INVALID_OTP);
    return otp;
  }

  async retrieveUserAndOtp(userId: string, otpValue: string, isEmployee: boolean = false): Promise<User | Employee | null> {
    try {
      // First verify OTP to avoid loading relations unnecessarily
      const otpRecord = await this.otpRepository.findOne({
        where: isEmployee
          ? { employee_id: userId }
          : { user_id: userId }
      });

      if (!otpRecord) throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.BAD_REQUEST);

      const isMatch = await bcrypt.compare(otpValue, otpRecord.otp);
      if (!isMatch || otpRecord.expiry < new Date()) {
        throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.BAD_REQUEST);
      }

      // Only load the user/employee after verifying OTP
      if (isEmployee) {
        return this.employeeRepository.findOne({ where: { id: userId } });
      } else {
        return this.userRepository.findOne({ where: { id: userId } });
      }
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.BAD_REQUEST);
    }
  }

  async remove(userId: string, isEmployee: boolean = false): Promise<void> {
    const whereClause = isEmployee ? { employee_id: userId } : { user_id: userId };
    await this.otpRepository.delete(whereClause);
  }

  // Add a periodic cleanup job to remove expired OTPs
  async cleanupExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiry: LessThan(new Date())
    });
  }

} 
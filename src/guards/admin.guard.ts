import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { UserRole } from '@modules/auth/enum/usertype';
import * as SYS_MSG from '@shared/constants/SystemMessages';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;

    if (!userId) throw new CustomHttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (user.role !== UserRole.ADMIN) {
      throw new CustomHttpException(SYS_MSG.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}

import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { UserRole } from '@modules/user/enum/user.role';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
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
      select: ['id', 'name', 'role'],
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    if (user.role !== UserRole.ADMIN) {
      throw new CustomHttpException(SYS_MSG.ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }

    request.user = {
      userId: user.id,
      name: user.name,
      role: user.role,
      iat: request.user.iat,
      exp: request.user.exp,
    };

    this.logger.log(`AdminGuard: Enriched user with name: ${JSON.stringify(request.user)}`);

    return true;
  }
}

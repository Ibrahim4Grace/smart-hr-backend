import { Injectable, HttpStatus } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { UserService } from '@modules/user/user.service';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';

@Injectable()
export class AuthHelperService {
  constructor(
    private tokenService: TokenService,
    private userService: UserService,
  ) {}

  /**
   * Reusable method to validate a Bearer token and return the user.
   * @param authorizationHeader
   * @returns User
   * @throws CustomHttpException if validation fails
   */
  async validateBearerToken(authorizationHeader: string) {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new CustomHttpException(SYS_MSG.INVALID_HEADER, HttpStatus.UNAUTHORIZED);
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) throw new CustomHttpException(SYS_MSG.TOKEN_NOT_PROVIDED, HttpStatus.UNAUTHORIZED);

    const decodedToken = await this.tokenService.verifyEmailToken(token);
    const user = await this.userService.getUserRecord({
      identifier: decodedToken.userId,
      identifierType: 'id',
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return user;
  }
}

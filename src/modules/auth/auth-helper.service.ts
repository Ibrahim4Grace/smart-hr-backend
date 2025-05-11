import { Injectable, HttpStatus } from '@nestjs/common';
import { TokenService } from '@shared/token/token.service';
import { UserService } from '@modules/user/user.service';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { EmployeesService } from '@modules/employee/employees.service';

@Injectable()
export class AuthHelperService {
  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private employeeService: EmployeesService,
  ) { }

  /**
   * Reusable method to validate a Bearer token and return the user or employee.
   * @param authorizationHeader
   * @returns User | Employee
   * @throws CustomHttpException if validation fails
   */
  async validateBearerToken(authorizationHeader: string) {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new CustomHttpException(SYS_MSG.INVALID_HEADER, HttpStatus.UNAUTHORIZED);
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) throw new CustomHttpException(SYS_MSG.TOKEN_NOT_PROVIDED, HttpStatus.UNAUTHORIZED);

    const decodedToken = await this.tokenService.verifyEmailToken(token);

    // Try to find user first
    const user = await this.userService.getUserRecord({
      identifier: decodedToken.userId,
      identifierType: 'id',
    });

    if (user) {
      return user;
    }

    // If user not found, try to find employee
    const employee = await this.employeeService.getEmployeeById(decodedToken.userId);
    if (employee) {
      return employee;
    }

    // If neither user nor employee found
    throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

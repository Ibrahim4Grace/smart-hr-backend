import { UserRole } from '../../user/enum/user.role';

export interface CreateUserResponse {
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
    token: string;
  };
}

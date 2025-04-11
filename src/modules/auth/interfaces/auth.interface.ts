import { UserRole } from '@modules/auth/enum/usertype';

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

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

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  EMPLOYEE: 'employee',
  HR: 'hr'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

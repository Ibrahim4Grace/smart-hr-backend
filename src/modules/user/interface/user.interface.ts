import { UpdateRecordGeneric } from '@shared/helpers/UpdateRecordGeneric';
import { UserRole } from '@modules/auth/interfaces/auth.interface';

export interface UserPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UserInterface {
  id: string;

  email: string;

  name: string;

  password: string;

  is_active: boolean;

  status: boolean;

  role: UserRole;

  created_at: Date;

  updated_at: Date;

  phone?: string;
}

export type CreateNewUserOptions = Pick<UserInterface, 'email' | 'name' | 'password'> & {
  admin_secret?: string;
};

type UserUpdateRecord = Partial<UserInterface>;

export type UpdateUserRecordOption = UpdateRecordGeneric<UserIdentifierOptionsType, UserUpdateRecord>;

export type UserIdentifierOptionsType =
  | {
    identifierType: 'id';
    identifier: string;
  }
  | {
    identifierType: 'email';
    identifier: string;
  };
